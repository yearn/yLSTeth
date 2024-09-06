import React, {useMemo, useState} from 'react';
import {decodeEventLog} from 'viem';
import {useBlock} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {toAddress} from '@builtbymom/web3/utils';
import {getClient} from '@builtbymom/web3/utils/wagmi';
import BOOTSTRAP_ABI_NEW from '@libAbi/bootstrap.abi.new';

import {DepositHeader} from './Deposit.Header';
import {DepositHistory} from './Deposit.History';
import {DepositSelector} from './Deposit.Selector';

import type {ReactElement} from 'react';
import type {Address} from 'viem';
import type {TDepositHistory} from './Deposit.History';

function ViewDeposit(): ReactElement {
	const {address, chainID} = useWeb3();
	const {getToken} = useWallet();
	const {data: block} = useBlock({chainId: Number(process.env.DEFAULT_CHAIN_ID)});

	const [history, set_history] = useState<undefined | TDepositHistory[]>(undefined);
	const [isLoading, set_isLoading] = useState<boolean>(false);

	const publicClient = useMemo(() => getClient(Number(process.env.DEFAULT_CHAIN_ID)), []);

	const refetchLogs = useAsyncTrigger(async () => {
		if (!block?.number) {
			return;
		}

		set_isLoading(true);
		const depositLogs = await publicClient.getLogs({
			address: toAddress(process.env.DEPOSIT_ADDRESS),
			event: {
				type: 'event',
				name: 'Deposit',
				inputs: [
					{name: 'depositor', type: 'address'},
					{name: 'receiver', type: 'address'},
					{name: 'asset', type: 'address'},
					{name: 'amount', type: 'uint256'},
					{name: 'value', type: 'uint256'}
				]
			},
			args: {
				depositor: address
			},
			fromBlock: block.number - 1000n,
			toBlock: block.number
		});

		const voteLogs = await publicClient.getLogs({
			address: toAddress(process.env.DEPOSIT_ADDRESS),
			event: {
				type: 'event',
				name: 'Vote',
				inputs: [
					{name: 'voter', type: 'address'},
					{name: 'asset', type: 'address'},
					{name: 'amount', type: 'uint256'}
				]
			},
			args: {
				voter: address
			},
			fromBlock: block.number - 1000n,
			toBlock: block.number
		});

		const depositTopics = depositLogs.map(log => ({
			block: log.blockNumber,
			decodedEvent: decodeEventLog({
				abi: BOOTSTRAP_ABI_NEW,
				data: log.data,
				topics: log.topics
			})
		}));

		const voteTopics = voteLogs.map(log => ({
			block: log.blockNumber,
			decodedEvent: decodeEventLog({
				abi: BOOTSTRAP_ABI_NEW,
				data: log.data,
				topics: log.topics
			})
		}));

		const history = depositTopics.map(depositTopic => {
			const voteTopic = voteTopics.find(voteTopic => voteTopic.block === depositTopic.block);
			return {
				block: depositTopic.block,
				asset: getToken({
					address: (depositTopic.decodedEvent.args as {asset: Address}).asset,
					chainID: chainID
				}),
				amount: (depositTopic.decodedEvent.args as {amount: bigint}).amount,
				stTokenAmount: (depositTopic.decodedEvent.args as {value: bigint}).value,
				votedAsset: getToken({
					address: (voteTopic?.decodedEvent.args as {asset: Address}).asset,
					chainID: chainID
				})
			};
		});

		set_history(history);
		set_isLoading(false);
	}, [address, block?.number, chainID, getToken, publicClient]);

	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<DepositHeader isIncentivePeriodClosed={false} />
				<DepositSelector refetchLogs={refetchLogs} />
				<DepositHistory
					history={history || []}
					isLoading={isLoading}
				/>
			</div>
		</section>
	);
}

export default ViewDeposit;
