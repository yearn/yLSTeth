import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {decodeEventLog, erc20Abi} from 'viem';
import {useBlock} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {decodeAsNumber, decodeAsString, toAddress, toBigInt, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {getClient, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import BOOTSTRAP_ABI_NEW from '@libAbi/bootstrap.abi.new';
import {readContracts} from '@wagmi/core';
import {NONE_TOKEN} from '@yUSD/tokens';
import {INITIAL_PERIOD_BLOCK} from '@yUSD/utils/constants';

import {DepositHeader} from './Deposit.Header';
import {DepositHistory} from './Deposit.History';
import {DepositSelector} from './Deposit.Selector';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TDepositHistory, TLogTopic} from './Deposit.types';

function ViewDeposit(): ReactElement {
	const {address} = useWeb3();
	const {data: block} = useBlock({chainId: Number(process.env.DEFAULT_CHAIN_ID)});
	const [history, set_history] = useState<undefined | TDepositHistory[]>(undefined);
	const [loading, set_loading] = useState({isLoading: true, lastBlock: 0n});
	const publicClient = useMemo(() => getClient(Number(process.env.DEFAULT_CHAIN_ID)), []);

	/************************************************************************************************
	 ** fetchDepositLogs: Fetches and processes deposit logs for the current user
	 ** - Retrieves logs from the deposit contract
	 ** - Decodes event logs and filters for the current user's deposits
	 ** - Returns an array of processed deposit log objects
	 ** @param {bigint} fromBlock - The starting block number to fetch logs from
	 ** @param {bigint} toBlock - The ending block number to fetch logs to
	 ** @returns {Promise<TLogTopic[]>} An array of processed deposit log objects
	 ************************************************************************************************/
	const fetchDepositLogs = useCallback(
		async (fromBlock: bigint, toBlock: bigint, receiver: TAddress): Promise<TLogTopic[]> => {
			const rangeLimit = toBigInt(Number(process.env.RANGE_LIMIT));
			let allDepositLogs: TLogTopic[] = [];

			for (let i = fromBlock; i < toBlock; i += rangeLimit) {
				const endBlock = i + rangeLimit > toBlock ? toBlock : i + rangeLimit;
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
					fromBlock: i,
					toBlock: endBlock
				});

				const processedLogs = depositLogs.map(log => ({
					block: log.blockNumber,
					decodedEvent: decodeEventLog({
						abi: BOOTSTRAP_ABI_NEW,
						data: log.data,
						topics: log.topics
					})
				})) as TLogTopic[];

				allDepositLogs = allDepositLogs.concat(processedLogs);
			}

			return allDepositLogs;
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
			const rangeLimit = toBigInt(Number(process.env.RANGE_LIMIT));
			let allVoteLogs: TLogTopic[] = [];

			for (let i = fromBlock; i < toBlock; i += rangeLimit) {
				const endBlock = i + rangeLimit > toBlock ? toBlock : i + rangeLimit;
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
					fromBlock: i,
					toBlock: endBlock
				});

				const processedLogs = voteLogs.map(log => ({
					block: log.blockNumber,
					decodedEvent: decodeEventLog({
						abi: BOOTSTRAP_ABI_NEW,
						data: log.data,
						topics: log.topics
					})
				})) as TLogTopic[];

				allVoteLogs = allVoteLogs.concat(processedLogs);
			}

			return allVoteLogs;
		},
		[publicClient]
	);

	/************************************************************************************************
	 ** fetchTokenDetails: Fetches symbol and decimals for multiple token addresses
	 ** - Uses readContracts to batch fetch token details
	 ** - Returns an object with token addresses as keys and their details as values
	 ** @param {TAddress[]} addresses - Array of token addresses to fetch details for
	 ** @returns {Promise<Record<TAddress, { symbol: string; decimals: number }>>}
	 ************************************************************************************************/
	const fetchTokenDetails = useCallback(
		async (addresses: TAddress[]): Promise<{[key: TAddress]: {symbol: string; decimals: number}}> => {
			if (addresses.length === 0) {
				return {};
			}
			const calls = [];
			for (const address of addresses) {
				calls.push({
					address,
					chainId: Number(process.env.DEFAULT_CHAIN_ID),
					abi: erc20Abi,
					functionName: 'symbol'
				});
				calls.push({
					address,
					chainId: Number(process.env.DEFAULT_CHAIN_ID),
					abi: erc20Abi,
					functionName: 'decimals'
				});
			}

			const results = await readContracts(retrieveConfig(), {contracts: calls});
			const tokenDetails: {[key: TAddress]: {symbol: string; decimals: number}} = {};
			for (let i = 0; i < addresses.length; i++) {
				const address = addresses[i];
				const symbol = decodeAsString(results[i * 2]);
				const decimals = decodeAsNumber(results[i * 2 + 1]);
				tokenDetails[address] = {symbol, decimals};
			}

			return tokenDetails;
		},
		[]
	);

	/************************************************************************************************
	 ** mapDepositAndVoteTopicsToHistory: Maps deposit and vote topics to history entries
	 ** - Combines deposit and vote information
	 ** - Returns an array of TDepositHistory objects
	 ** @param {TLogTopic[]} depositTopics - Array of deposit log topics
	 ** @param {TLogTopic[]} voteTopics - Array of vote log topics
	 ** @param {{[key: TAddress]: {symbol: string; decimals: number}}} tokenDetails - Token details
	 ** @returns {TDepositHistory[]} Array of deposit history objects
	 ************************************************************************************************/
	const mapDepositAndVoteTopicsToHistory = useCallback(
		(
			depositTopics: TLogTopic[],
			voteTopics: TLogTopic[],
			tokenDetails: {[key: TAddress]: {symbol: string; decimals: number}}
		): TDepositHistory[] => {
			return depositTopics.map((depositTopic: TLogTopic): TDepositHistory => {
				const voteTopic = voteTopics.find((voteTopic: TLogTopic) => voteTopic.block === depositTopic.block);
				const assetAddress = toAddress(depositTopic.decodedEvent.args.asset);
				const assetDetails = tokenDetails[assetAddress] || {symbol: 'N/A', decimals: 18};
				const votedAssetAddress = toAddress(voteTopic?.decodedEvent.args.asset);
				const votedAssetDetails = tokenDetails[votedAssetAddress] || {symbol: 'N/A', decimals: 18};
				return {
					block: depositTopic.block,
					asset: {
						address: assetAddress,
						chainID: Number(process.env.DEFAULT_CHAIN_ID),
						name: assetDetails.symbol,
						symbol: assetDetails.symbol,
						decimals: assetDetails.decimals,
						logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${assetAddress}/logo-128.png`,
						value: 0,
						balance: zeroNormalizedBN
					},
					amount: depositTopic.decodedEvent.args.amount,
					stTokenAmount: depositTopic.decodedEvent.args.value,
					votedAsset: voteTopic
						? {
								address: votedAssetAddress,
								chainID: Number(process.env.DEFAULT_CHAIN_ID),
								name: votedAssetDetails.symbol,
								symbol: votedAssetDetails.symbol,
								decimals: votedAssetDetails.decimals,
								logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${votedAssetAddress}/logo-128.png`,
								value: 0,
								balance: zeroNormalizedBN
							}
						: NONE_TOKEN
				};
			});
		},
		[]
	);

	/************************************************************************************************
	 ** refetchLogs: Asynchronously fetches and processes deposit and vote logs
	 ** - Retrieves recent logs within a 1000 block range
	 ** - Uses mapDepositAndVoteTopicsToHistory to combine deposit and vote information
	 ** - Updates the history state with processed log data
	 ** - Implements a locking mechanism to prevent concurrent executions
	 ************************************************************************************************/
	const refetchLogs = useCallback(async (): Promise<void> => {
		if (!block?.number) {
			return;
		}

		if (!address) {
			set_loading(prevLoading => ({...prevLoading, isLoading: false}));
			return;
		}

		if ((loading.lastBlock === block.number || loading.isLoading) && loading.lastBlock !== 0n) {
			return;
		}

		set_loading(prevLoading => ({...prevLoading, isLoading: true}));

		const fromBlock = INITIAL_PERIOD_BLOCK;
		const toBlock = block.number;
		const [depositTopics, voteTopics] = await Promise.all([
			fetchDepositLogs(fromBlock, toBlock, address),
			fetchVoteLogs(fromBlock, toBlock, address)
		]);

		/************************************************************************************************
		 ** As we might not have the token details in the cache, we need to fetch them
		 ***********************************************************************************************/
		const tokenDetails = await fetchTokenDetails(
			Array.from(
				new Set([
					...depositTopics.map(topic => toAddress(topic.decodedEvent.args.asset)),
					...voteTopics.map(topic => toAddress(topic.decodedEvent.args.asset))
				])
			)
		);

		const history = mapDepositAndVoteTopicsToHistory(depositTopics, voteTopics, tokenDetails);
		set_history(history.filter((each): boolean => each.asset !== undefined));
		set_loading({isLoading: false, lastBlock: block.number});
	}, [
		address,
		block?.number,
		fetchDepositLogs,
		fetchTokenDetails,
		fetchVoteLogs,
		loading.isLoading,
		loading.lastBlock,
		mapDepositAndVoteTopicsToHistory
	]);

	/************************************************************************************************
	 ** This useEffect hook is responsible for fetching and updating deposit logs.
	 ** It runs whenever the refetchLogs function changes (which depends on various states).
	 **
	 ** Key points:
	 ** 1. Uses a cancellation flag to prevent state updates if the component unmounts.
	 ** 2. Defines an async function fetchData to call refetchLogs.
	 ** 3. Immediately invokes fetchData.
	 ** 4. Returns a cleanup function that sets isCancelled to true, preventing further updates.
	 **
	 ** This pattern ensures that log fetching is performed when necessary and can be safely
	 ** cancelled if the component unmounts, preventing potential memory leaks or errors.
	 ************************************************************************************************/
	useEffect(() => {
		let isCancelled = false;
		const fetchData = async (): Promise<void> => {
			if (!isCancelled) {
				await refetchLogs();
			}
		};
		fetchData();
		return () => {
			isCancelled = true;
		};
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
