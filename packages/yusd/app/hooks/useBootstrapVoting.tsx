import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {parseAbiItem} from 'viem';
import {useReadContracts} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {toAddress, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import BOOTSTRAP_ABI_NEW from '@libAbi/bootstrap.abi.new';
import {useDeepCompareMemo} from '@react-hookz/web';
import {getClient} from '@yearn-finance/web-lib/utils/wagmi/utils';
import {BOOTSTRAP_INIT_BLOCK_NUMBER} from '@yUSD/utils/constants';

import type {TAddress, TAddressWagmi, TDict, TNormalizedBN} from '@builtbymom/web3/types';

type TBaseReadContractData = {
	address: TAddressWagmi;
	abi: typeof BOOTSTRAP_ABI_NEW;
	chainId: number;
};

export type TUseBootstrapVotingResp = {
	voteData: {
		votesUsedPerProtocol: TDict<TNormalizedBN>; //map[protocol]votesUsed
		winners: TAddress[]; //[protocols]
	};
	isLoading: boolean;
	isLoadingEvents: boolean;
	onUpdate: VoidFunction;
};

type TUseVoteEventsResp = {
	votesUsedPerProtocol: TDict<TNormalizedBN>; // map[protocol]votesUsed
	isLoading: boolean;
	onUpdate: VoidFunction;
};

const bootstrapContractReadData: TBaseReadContractData = {
	address: toAddress(process.env.DEPOSIT_ADDRESS),
	abi: BOOTSTRAP_ABI_NEW,
	chainId: Number(process.env.DEFAULT_CHAIN_ID || 1)
};

function useVoteEvents(): TUseVoteEventsResp {
	const {address} = useWeb3();
	const [votesUsedPerProtocol, set_votesUsedPerProtocol] = useState<TDict<TNormalizedBN>>({}); // map[protocol]votesUsed
	const [isLoadingEvents, set_isLoadingEvents] = useState<boolean>(false);
	const hasAlreadyBeLoaded = useRef<boolean>(false);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** For the connected user, we need to know the casted vote to be able to correctly display the
	 ** status of vote/bribe/incentives. In order to do that, we need to fetch the vote events from
	 ** the bootstrap contract from init to now, with a filter on the voter (user) address.
	 **
	 ** @deps: address - the connected user address.
	 **********************************************************************************************/
	const filterVoteEvents = useCallback(async (): Promise<void> => {
		if (!address) {
			return;
		}
		set_isLoadingEvents(hasAlreadyBeLoaded.current ? false : true);
		const publicClient = getClient(Number(process.env.DEFAULT_CHAIN_ID));
		const rangeLimit = toBigInt(Number(process.env.RANGE_LIMIT));
		const deploymentBlockNumber = toBigInt(BOOTSTRAP_INIT_BLOCK_NUMBER);
		const currentBlockNumber = await publicClient.getBlockNumber();
		const userVotes: TDict<TNormalizedBN> = {};
		for (let i = deploymentBlockNumber; i < currentBlockNumber; i += rangeLimit) {
			const logs = await publicClient.getLogs({
				address: toAddress(process.env.DEPOSIT_ADDRESS),
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
					userVotes[toAddress(protocol)] = zeroNormalizedBN;
				}
				userVotes[toAddress(protocol)] = toNormalizedBN(
					userVotes[toAddress(protocol)].raw + toBigInt(amount),
					18
				);
			}
		}
		set_votesUsedPerProtocol(userVotes);
		set_isLoadingEvents(false);
		hasAlreadyBeLoaded.current = true;
	}, [address]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Effect to trigger the vote events filtering when it's dependencies change (aka address)
	 **********************************************************************************************/
	useEffect((): void => {
		filterVoteEvents();
	}, [filterVoteEvents]);

	return {
		votesUsedPerProtocol,
		isLoading: isLoadingEvents,
		onUpdate: filterVoteEvents
	};
}

function useBootstrapVoting(): TUseBootstrapVotingResp {
	const {votesUsedPerProtocol, isLoading: isLoadingVoteEvents, onUpdate: onUpdateVoteEvents} = useVoteEvents();

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Perform a multicall via `useContractReads` to get various data from the bootstrap contract.
	 **
	 ** @returns: votes_available - the number of votes available for the connected user (bigint)
	 ** @returns: votes_used - the number of votes used by the connected user (bigint)
	 ** @returns: winners_list - the list of the 5 protocols with the most votes (address[])
	 **********************************************************************************************/
	const {data, isLoading, refetch} = useReadContracts({
		contracts: [
			{...bootstrapContractReadData, functionName: 'winners_list', args: [0n]} as any,
			{...bootstrapContractReadData, functionName: 'winners_list', args: [1n]} as any,
			{...bootstrapContractReadData, functionName: 'winners_list', args: [2n]} as any,
			{...bootstrapContractReadData, functionName: 'winners_list', args: [3n]} as any,
			{...bootstrapContractReadData, functionName: 'winners_list', args: [4n]} as any
		]
	});

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Simple function to group the winners addresses into an array.
	 **
	 ** @deps: data - the data we fetched from the bootstrap contract via the multicall
	 ** @returns: winners - the list of the 5 protocols with the most votes (address[])
	 **********************************************************************************************/
	const winners = useMemo((): TAddress[] => {
		const winnerProtocols = [
			toAddress(data?.[0]?.result as string),
			toAddress(data?.[1]?.result as string),
			toAddress(data?.[2]?.result as string),
			toAddress(data?.[3]?.result as string),
			toAddress(data?.[4]?.result as string)
		];
		return winnerProtocols;
	}, [data]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Function to trigger a refetch of both the multicall data and the vote events from the
	 ** useVoteEvents hook.
	 **
	 ** @deps: refetch - the refetch function from the useContractReads hook
	 ** @deps: onUpdateVoteEvents - the onUpdate function from the useVoteEvents hook
	 **********************************************************************************************/
	const onUpdate = useCallback(async (): Promise<void> => {
		await Promise.all([refetch(), onUpdateVoteEvents()]);
	}, [refetch, onUpdateVoteEvents]);

	const voteData = useDeepCompareMemo(
		(): TUseBootstrapVotingResp['voteData'] => ({
			votesUsedPerProtocol: votesUsedPerProtocol,
			winners: winners
		}),
		[votesUsedPerProtocol, winners]
	);

	return {
		voteData,
		isLoading,
		isLoadingEvents: isLoadingVoteEvents,
		onUpdate
	};
}

export default useBootstrapVoting;
