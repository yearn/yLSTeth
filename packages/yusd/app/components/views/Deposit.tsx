import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {decodeEventLog} from 'viem';
import {useBlock} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {toAddress} from '@builtbymom/web3/utils';
import {getClient} from '@builtbymom/web3/utils/wagmi';
import BOOTSTRAP_ABI_NEW from '@libAbi/bootstrap.abi.new';
import {NONE_TOKEN} from '@yUSD/tokens';

import {DepositHeader} from './Deposit.Header';
import {DepositHistory} from './Deposit.History';
import {DepositSelector} from './Deposit.Selector';

import type {ReactElement} from 'react';
import type {Address} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';
import type {TDepositHistory, TLogTopic} from './Deposit.types';

function ViewDeposit(): ReactElement {
	const {address, chainID} = useWeb3();
	const {getToken} = useWallet();
	const {data: block} = useBlock({chainId: Number(process.env.DEFAULT_CHAIN_ID)});
	const [history, set_history] = useState<undefined | TDepositHistory[]>(undefined);
	const [loading, set_loading] = useState({isLoading: false, lastBlock: 0n});
	const publicClient = useMemo(() => getClient(Number(process.env.DEFAULT_CHAIN_ID)), []);

	/************************************************************************************************
	 ** fetchDepositLogs: Fetches and processes deposit logs for the current user
	 ** - Retrieves logs from the deposit contract
	 ** - Decodes event logs and filters for the current user's deposits
	 ** - Returns an array of processed deposit log objects
	 ** @param {bigint} fromBlock - The starting block number to fetch logs from
	 ** @param {bigint} toBlock - The ending block number to fetch logs to
	 ** @param {address} receiver - The address to fetch logs for
	 ** @returns {Promise<TLogTopic[]>} An array of processed deposit log objects
	 ************************************************************************************************/
	const fetchDepositLogs = useCallback(
		async (fromBlock: bigint, toBlock: bigint, receiver: TAddress): Promise<TLogTopic[]> => {
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
				args: {receiver},
				fromBlock,
				toBlock
			});

			return depositLogs
				.map(log => ({
					block: log.blockNumber,
					decodedEvent: decodeEventLog({
						abi: BOOTSTRAP_ABI_NEW,
						data: log.data,
						topics: log.topics
					})
				}))
				.filter(each => (each.decodedEvent.args as {depositor: Address}).depositor === receiver) as TLogTopic[];
		},
		[publicClient]
	);

	/************************************************************************************************
	 ** fetchVoteLogs: Fetches and processes vote logs for the current user
	 ** - Retrieves logs from the deposit contract for Vote events
	 ** - Decodes event logs and filters for the current user's votes
	 ** - Returns an array of processed vote log objects
	 ** @param {bigint} fromBlock - The starting block number to fetch logs from
	 ** @param {bigint} toBlock - The ending block number to fetch logs to
	 ** @param {address} voter - The address to fetch logs for
	 ** @returns {Promise<TLogTopic[]>} An array of processed vote log objects
	 ************************************************************************************************/
	const fetchVoteLogs = useCallback(
		async (fromBlock: bigint, toBlock: bigint, voter: TAddress): Promise<TLogTopic[]> => {
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
				args: {voter},
				fromBlock,
				toBlock
			});

			return voteLogs
				.map(log => ({
					block: log.blockNumber,
					decodedEvent: decodeEventLog({
						abi: BOOTSTRAP_ABI_NEW,
						data: log.data,
						topics: log.topics
					})
				}))
				.filter(each => (each.decodedEvent.args as {voter: Address}).voter === voter) as TLogTopic[];
		},
		[publicClient]
	);

	/************************************************************************************************
	 ** mapDepositAndVoteTopicsToHistory: Maps deposit and vote topics to history entries
	 ** - Combines deposit and vote information
	 ** - Returns an array of TDepositHistory objects
	 ** @param {TLogTopic[]} depositTopics - Array of deposit log topics
	 ** @param {TLogTopic[]} voteTopics - Array of vote log topics
	 ** @returns {TDepositHistory[]} Array of deposit history objects
	 ************************************************************************************************/
	const mapDepositAndVoteTopicsToHistory = useCallback(
		(depositTopics: TLogTopic[], voteTopics: TLogTopic[]): TDepositHistory[] => {
			return depositTopics.map((depositTopic: TLogTopic): TDepositHistory => {
				const voteTopic = voteTopics.find((voteTopic: TLogTopic) => voteTopic.block === depositTopic.block);
				return {
					block: depositTopic.block,
					asset: getToken({
						address: depositTopic.decodedEvent.args.asset,
						chainID: chainID
					}),
					amount: depositTopic.decodedEvent.args.amount,
					stTokenAmount: depositTopic.decodedEvent.args.value,
					votedAsset: voteTopic
						? getToken({
								address: voteTopic.decodedEvent.args.asset,
								chainID: chainID
							})
						: NONE_TOKEN
				};
			});
		},
		[getToken, chainID]
	);

	/************************************************************************************************
	 ** refetchLogs: Asynchronously fetches and processes deposit and vote logs
	 ** - Retrieves recent logs within a 1000 block range
	 ** - Uses mapDepositAndVoteTopicsToHistory to combine deposit and vote information
	 ** - Updates the history state with processed log data
	 ************************************************************************************************/
	const refetchLogs = useCallback(async (): Promise<void> => {
		if (!block?.number || !address) {
			return;
		}

		if (loading.lastBlock === block.number) {
			return;
		}
		set_loading({isLoading: true, lastBlock: 0n});
		const fromBlock = block.number - 1000n;
		const toBlock = block.number;
		const [depositTopics, voteTopics] = await Promise.all([
			fetchDepositLogs(fromBlock, toBlock, address),
			fetchVoteLogs(fromBlock, toBlock, address)
		]);
		const history = mapDepositAndVoteTopicsToHistory(depositTopics, voteTopics);
		set_history(history.filter((each): boolean => each.asset !== undefined));
		set_loading({isLoading: false, lastBlock: block.number});
	}, [address, block?.number, fetchDepositLogs, fetchVoteLogs, loading.lastBlock, mapDepositAndVoteTopicsToHistory]);

	useEffect(() => {
		refetchLogs();
	}, [refetchLogs]);

	return (
		<section className={'grid w-full grid-cols-1 pt-10 md:mb-20 md:px-4 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<DepositHeader isIncentivePeriodClosed={false} />
				<DepositSelector refetchLogs={refetchLogs} />
				<DepositHistory
					history={history || []}
					isLoading={loading.isLoading}
				/>
			</div>
		</section>
	);
}

export default ViewDeposit;
