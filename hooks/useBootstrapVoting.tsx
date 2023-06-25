import {useCallback, useEffect, useRef, useState} from 'react';
import {getClient} from 'utils';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {parseAbiItem} from 'viem';
import {useContractReads} from 'wagmi';
import {useDeepCompareMemo} from '@react-hookz/web';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {TAddressWagmi, TDict} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

type TBaseReadContractData = {
	address: TAddressWagmi;
	abi: typeof BOOTSTRAP_ABI;
	chainId: number;
}

export type TUseBootstrapVotingResp = {
	voteData: {
		votesAvailable: TNormalizedBN,
		votesUsed: TNormalizedBN,
		votesUsedPerProtocol: TDict<TNormalizedBN>
	},
	isLoading: boolean,
	isLoadingEvents: boolean,
	onUpdate: VoidFunction
}

const bootstrapContractReadData: TBaseReadContractData = ({
	address: toAddress(process.env.BOOTSTRAP_ADDRESS),
	abi: BOOTSTRAP_ABI,
	chainId: Number(process.env.DEFAULT_CHAINID || 1)
});

function useBootstrapVoting(): TUseBootstrapVotingResp {
	const {address} = useWeb3();
	const [votesUsedPerProtocol, set_votesUsedPerProtocol] = useState<TDict<TNormalizedBN>>({});
	const [isLoadingEvents, set_isLoadingEvents] = useState<boolean>(false);
	const hasAlreadyBeLoaded = useRef<boolean>(false);
	const {data, isLoading, refetch} = useContractReads({
		contracts: [
			{...bootstrapContractReadData, functionName: 'votes_available', args: [toAddress(address)]},
			{...bootstrapContractReadData, functionName: 'votes_used', args: [toAddress(address)]}
		]
	});

	const filterEvents = useCallback(async (): Promise<void> => {
		if (!address) {
			return;
		}
		set_isLoadingEvents(hasAlreadyBeLoaded.current ? false : true);
		const publicClient = getClient();
		const rangeLimit = 1_000_000n;
		const deploymentBlockNumber = toBigInt(process.env.INIT_BLOCK_NUMBER);
		const currentBlockNumber = await publicClient.getBlockNumber();
		const userVotes: TDict<TNormalizedBN> = {};
		for (let i = deploymentBlockNumber; i < currentBlockNumber; i += rangeLimit) {
			const logs = await publicClient.getLogs({
				address: toAddress(process.env.BOOTSTRAP_ADDRESS),
				event: parseAbiItem('event Vote(address indexed voter, address indexed protocol, uint256 amount)'),
				args: {
					voter: toAddress(address)
				},
				fromBlock: i,
				toBlock: i + rangeLimit
			});
			for (const log of logs) {
				const {protocol, amount} = log.args;
				if (!userVotes[toAddress(protocol)]) {
					userVotes[toAddress(protocol)] = toNormalizedBN(0n);
				}
				userVotes[toAddress(protocol)] = toNormalizedBN(
					userVotes[toAddress(protocol)].raw + toBigInt(amount)
				);
			}
		}
		performBatchedUpdates((): void => {
			set_votesUsedPerProtocol(userVotes);
			set_isLoadingEvents(false);
		});
		hasAlreadyBeLoaded.current = true;
	}, [address]);

	const onUpdate = useCallback(async (): Promise<void> => {
		await Promise.all([
			refetch(),
			filterEvents()
		]);
	}, [refetch, filterEvents]);

	useEffect((): void => {
		filterEvents();
	}, [filterEvents]);

	const voteData = useDeepCompareMemo((): TUseBootstrapVotingResp['voteData'] => ({
		votesAvailable: toNormalizedBN(data?.[0]?.result || 0n),
		votesUsed: toNormalizedBN(data?.[1]?.result || 0n),
		votesUsedPerProtocol: votesUsedPerProtocol
	}), [data, votesUsedPerProtocol]);
	return {voteData, isLoading, isLoadingEvents, onUpdate};
}

export default useBootstrapVoting;
