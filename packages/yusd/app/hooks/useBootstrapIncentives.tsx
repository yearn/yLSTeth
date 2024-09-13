/* eslint-disable @typescript-eslint/consistent-type-assertions */
import {useCallback, useEffect, useMemo, useState} from 'react';
import {erc20Abi, parseAbiItem, toHex} from 'viem';
import {useContractRead} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {
	decodeAsNumber,
	decodeAsString,
	toAddress,
	toBigInt,
	toNormalizedBN,
	truncateHex,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import BOOTSTRAP_ABI from '@libAbi/bootstrap.abi';
import {useFetch} from '@libHooks/useFetch';
import {yDaemonPricesSchema} from '@libUtils/types';
import {useAsync, useMountEffect, useUpdateEffect} from '@react-hookz/web';
import {multicall} from '@wagmi/core';
import {useYDaemonBaseURI} from '@yearn-finance/web-lib/hooks/useYDaemonBaseURI';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {getClient} from '@yearn-finance/web-lib/utils/wagmi/utils';
import {BOOTSTRAP_INIT_BLOCK_NUMBER} from '@yUSD/utils/constants';

import useBootstrapPeriods from './useBootstrapPeriods';

import type {Hex} from 'viem';
import type {TAddress, TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TIndexedTokenInfo, TYDaemonPrices} from '@libUtils/types';

export type TIncentivesClaimed = {
	id: string;
	protocol: TAddress;
	incentive: TAddress;
	claimer: TAddress;
};

export type TIncentives = {
	protocol: TAddress;
	protocolName: string;
	protocolSymbol: string;
	incentive: TAddress;
	depositor: TAddress;
	amount: bigint;
	value: number;
	estimatedAPR: number;
	blockNumber: bigint;
	txHash: Hex;
	incentiveToken?: TIndexedTokenInfo;
};

export type TGroupedIncentives = {
	protocol: TAddress;
	protocolName: string;
	protocolSymbol: string;
	normalizedSum: number;
	estimatedAPR: number;
	usdPerStETH: number;
	incentives: TIncentives[];
};

export type TIncentivesFor = {
	protocols: TDict<TGroupedIncentives>;
	user: TDict<TGroupedIncentives>;
};

export type TUseBootstrapIncentivesResp = {
	groupIncentiveHistory: TIncentivesFor;
	claimedIncentives: TIncentivesClaimed[] | undefined;
	isFetchingHistory: boolean;
	refreshIncentives: VoidFunction;
	refreshClaimedIncentives: VoidFunction;
	totalDepositedETH: TNormalizedBN;
	totalDepositedUSD: number;
};
function useBootstrapIncentives(): TUseBootstrapIncentivesResp {
	const {address} = useWeb3();
	const {voteStatus} = useBootstrapPeriods();
	const [incentives, set_incentives] = useState<TIncentives[]>([]);
	const [claimedIncentives, set_claimedIncentives] = useState<TIncentivesClaimed[] | undefined>(undefined);
	const [isFetchingHistory, set_isFetchingHistory] = useState(false);
	const {yDaemonBaseUri} = useYDaemonBaseURI({chainID: Number(process.env.BASE_CHAIN_ID)});
	const {data: prices} = useFetch<TYDaemonPrices>({
		endpoint: `${yDaemonBaseUri}/prices/all`,
		schema: yDaemonPricesSchema
	});

	/************************************************************************************************
	 ** useContractRead calling the `deposited` method from the bootstrap contract to get the total
	 ** deposited ETH from the contract.
	 **
	 ** @returns bigint - total deposited eth
	 ************************************************************************************************/
	const {data: totalDepositedETH} = useContractRead({
		address: toAddress(process.env.DEPOSIT_ADDRESS),
		abi: BOOTSTRAP_ABI,
		functionName: 'deposited'
	});

	/************************************************************************************************
	 ** Memoize the total deposited value in USD, using the prices from the yDaemon API and the
	 ** total deposited ETH from the contract.
	 **
	 ** @deps prices - list of prices from the yDaemon API
	 ** @deps totalDepositedETH - total deposited ETH from the contract
	 ** @returns number - total deposited value in USD
	 ************************************************************************************************/
	const totalDepositedValue = useMemo((): number => {
		if (!prices || !totalDepositedETH) {
			return 0;
		}
		return (
			Number(toNormalizedBN(totalDepositedETH, 18).normalized) *
			Number(toNormalizedBN(prices[ETH_TOKEN_ADDRESS] || 0, 6).normalized)
		);
	}, [prices, totalDepositedETH]);

	/************************************************************************************************
	 ** Connect to the node and listen for all the events since the deployment of the contracts.
	 ** We need to filter the Incentivize event to get the objects with protocol incentivized, amount,
	 ** depositor and incentive token.
	 ** From that we will be able to create our mappings
	 **
	 ** @deps none
	 ************************************************************************************************/
	const filterIncentivizeEvents = useCallback(async (): Promise<void> => {
		set_isFetchingHistory(true);
		const publicClient = getClient(Number(process.env.DEFAULT_CHAIN_ID));
		const rangeLimit = toBigInt(Number(process.env.RANGE_LIMIT));
		const deploymentBlockNumber = toBigInt(BOOTSTRAP_INIT_BLOCK_NUMBER);
		const currentBlockNumber = await publicClient.getBlockNumber();
		const incentives: TIncentives[] = [];

		for (let fromBlock = deploymentBlockNumber; fromBlock < currentBlockNumber; fromBlock += rangeLimit) {
			const toBlock = fromBlock + rangeLimit > currentBlockNumber ? currentBlockNumber : fromBlock + rangeLimit;
			const logs = await publicClient.getLogs({
				address: toAddress(process.env.DEPOSIT_ADDRESS),
				event: parseAbiItem(
					'event Incentivize(address indexed protocol, address indexed incentive, address indexed depositor, uint256 amount)'
				),
				fromBlock,
				toBlock
			});

			console.warn(logs);

			for (const log of logs) {
				const {protocol, incentive, amount, depositor} = log.args;
				incentives.push({
					blockNumber: toBigInt(log.blockNumber as bigint),
					txHash: toHex(log.transactionHash || ''),
					protocol: toAddress(protocol),
					protocolName: truncateHex(protocol, 6),
					protocolSymbol: truncateHex(protocol, 6),
					incentive: toAddress(incentive),
					depositor: toAddress(depositor),
					amount: toBigInt(amount),
					value: 0,
					estimatedAPR: 0
				});
			}
		}

		set_incentives(incentives);
		set_isFetchingHistory(false);
	}, []);
	useMountEffect(filterIncentivizeEvents);

	/************************************************************************************************
	 ** Connect to the node and listen for all the events since the deployment of the contracts.
	 ** We need to filter the ClaimIncentive event to be able to know which incentives were already
	 ** claimed by the user.
	 ** From that we will be able to create our mappings
	 **
	 ** @deps address - The address of the user
	 ** @deps voteStatus - The status of the vote
	 ************************************************************************************************/
	const filterClaimIncentiveEvents = useCallback(async (): Promise<void> => {
		if (!address || voteStatus !== 'ended') {
			return;
		}
		const publicClient = getClient(Number(process.env.DEFAULT_CHAIN_ID));
		const rangeLimit = toBigInt(Number(process.env.RANGE_LIMIT));
		const deploymentBlockNumber = toBigInt(BOOTSTRAP_INIT_BLOCK_NUMBER);
		const currentBlockNumber = await publicClient.getBlockNumber();
		const incentivesClaimed: TIncentivesClaimed[] = [];
		for (let i = deploymentBlockNumber; i < currentBlockNumber; i += rangeLimit) {
			const logs = await publicClient.getLogs({
				address: toAddress(process.env.DEPOSIT_ADDRESS),
				event: parseAbiItem(
					'event ClaimIncentive(address indexed protocol, address indexed incentive, address indexed claimer, uint256 amount)'
				),
				args: {claimer: address},
				fromBlock: i,
				toBlock: i + rangeLimit
			});
			for (const log of logs) {
				const {protocol, incentive, claimer} = log.args;
				incentivesClaimed.push({
					id: `${toAddress(protocol)}-${toAddress(incentive)}-${toAddress(claimer)}`,
					protocol: toAddress(protocol),
					incentive: toAddress(incentive),
					claimer: toAddress(claimer)
				});
			}
		}
		set_claimedIncentives(incentivesClaimed);
	}, [address, voteStatus]);
	useEffect((): void => {
		filterClaimIncentiveEvents();
	}, [filterClaimIncentiveEvents]);

	/************************************************************************************************
	 ** The filtered events contain only addresses and amounts. To enhance user understanding, we
	 ** fetch token information from the blockchain and logos from the API, storing these in an
	 ** intermediate object for easier UI presentation.
	 **
	 ** @deps incentives - List of all incentives
	 ************************************************************************************************/
	const incentiveDetails = useAsync(async function fetchToken(
		chainID: number,
		incentives: TIncentives[]
	): Promise<TIncentives[]> {
		const calls = [];
		for (const {incentive, protocol} of incentives) {
			calls.push(
				...[
					{address: protocol, abi: erc20Abi, functionName: 'name'},
					{address: protocol, abi: erc20Abi, functionName: 'symbol'},
					{address: incentive, abi: erc20Abi, functionName: 'name'},
					{address: incentive, abi: erc20Abi, functionName: 'symbol'},
					{address: incentive, abi: erc20Abi, functionName: 'decimals'}
				]
			);
		}
		const results = await multicall(retrieveConfig(), {contracts: calls, chainId: chainID});

		const incentiveList: TIncentives[] = [];
		let i = 0;
		for (const args of incentives) {
			const protocolName = decodeAsString(results[i++]);
			const protocolSymbol = decodeAsString(results[i++]);
			const name = decodeAsString(results[i++]);
			const symbol = decodeAsString(results[i++]);
			const decimals = decodeAsNumber(results[i++]);
			incentiveList.push({
				protocol: args.protocol,
				protocolName: protocolName,
				protocolSymbol: protocolSymbol,
				incentive: args.incentive,
				depositor: args.depositor,
				amount: args.amount,
				value: 0,
				estimatedAPR: 0,
				blockNumber: args.blockNumber,
				txHash: args.txHash,
				incentiveToken: {
					address: args.incentive,
					name: name,
					symbol: symbol,
					decimals: decimals,
					chainID: chainID,
					logoURI: `https://assets.smold.app/api/token/${chainID}/${args.incentive}/logo-128.png`,
					index: 0,
					value: 0,
					balance: zeroNormalizedBN
				}
			});
		}
		set_isFetchingHistory(false);
		return incentiveList;
	}, []);
	const [{result: incentiveHistory}, fetchTokenData] = incentiveDetails;
	useUpdateEffect((): void => {
		fetchTokenData.execute(Number(process.env.DEFAULT_CHAIN_ID), incentives);
	}, [incentives]);

	/************************************************************************************************
	 ** For the UI we will need two things:
	 ** 1. The list of all protocols that have been incentivized with their received incentives.
	 ** 2. The list of all incentives distributed by the current user.
	 ** We will use the incentiveHistory object to group the data by protocol, then by depositor.
	 **
	 ** Dependencies:
	 ** - address: Address of the user
	 ** - incentiveHistory: List of all distributed incentives
	 ** - prices: List of all token prices
	 ** - totalDepositedETH: Total amount of ETH deposited
	 ************************************************************************************************/
	const groupIncentiveHistory = useMemo((): TIncentivesFor => {
		if (!incentiveHistory) {
			return {protocols: {}, user: {}};
		}
		const getAPR = (USDValue: number): number =>
			((USDValue * 12) /
				(Number(toNormalizedBN(toBigInt(totalDepositedETH), 18).normalized) *
					Number(toNormalizedBN(prices?.[ETH_TOKEN_ADDRESS] || 0, 6).normalized))) *
			100;

		const groupByProtocol = incentiveHistory.reduce((acc, cur): TDict<TGroupedIncentives> => {
			if (!cur) {
				return acc;
			}
			const key = cur.protocol;
			const amount = toNormalizedBN(cur.amount, cur.incentiveToken?.decimals || 18).normalized;
			const price = toNormalizedBN(prices?.[toAddress(cur.incentive)] || 0, 6).normalized;
			const value = Number(amount) * Number(price);
			const estimatedAPR = getAPR(value);
			if (!acc[key]) {
				acc[key] = {
					protocol: cur.protocol,
					estimatedAPR: estimatedAPR,
					protocolName: cur.protocolName || truncateHex(cur.protocol, 6),
					protocolSymbol: cur.protocolSymbol || truncateHex(cur.protocol, 6),
					normalizedSum: value,
					usdPerStETH: value / Number(toNormalizedBN(toBigInt(totalDepositedETH), 18).normalized),
					incentives: [{...cur, value, estimatedAPR}]
				};
				return acc;
			}
			//check if the incentive is already in the list
			const incentiveIndex = acc[key].incentives.findIndex(
				(incentive): boolean => toAddress(incentive.incentive) === toAddress(cur.incentive)
			);
			if (incentiveIndex === -1) {
				acc[key].normalizedSum += value;
				acc[key].estimatedAPR = getAPR(acc[key].normalizedSum);
				acc[key].incentives.push({...cur, value, estimatedAPR});
			} else {
				acc[key].normalizedSum += value;
				acc[key].incentives[incentiveIndex].amount += cur.amount;
				acc[key].incentives[incentiveIndex].value += value;
				acc[key].incentives[incentiveIndex].estimatedAPR = getAPR(acc[key].incentives[incentiveIndex].value);
			}
			acc[key].usdPerStETH =
				acc[key].normalizedSum / Number(toNormalizedBN(toBigInt(totalDepositedETH), 18).normalized);
			return acc;
		}, {} as TDict<TGroupedIncentives>);

		const groupForUser = incentiveHistory.reduce((acc, cur): TDict<TGroupedIncentives> => {
			if (!cur || toAddress(cur.depositor) !== toAddress(address)) {
				return acc;
			}
			const key = cur.protocol;
			const amount = toNormalizedBN(cur.amount, cur.incentiveToken?.decimals ?? 18).normalized;
			const price = toNormalizedBN(prices?.[toAddress(cur.incentive)] || 0, 6).normalized;
			const value = Number(amount) * Number(price);
			const estimatedAPR = getAPR(value);
			if (!acc[key]) {
				acc[key] = {
					protocol: cur.protocol,
					protocolName: cur.protocolName || truncateHex(cur.protocol, 6),
					protocolSymbol: cur.protocolSymbol || truncateHex(cur.protocol, 6),
					normalizedSum: value,
					estimatedAPR: estimatedAPR,
					usdPerStETH: value / Number(toNormalizedBN(toBigInt(totalDepositedETH), 18).normalized),
					incentives: [{...cur, value, estimatedAPR}]
				};
				return acc;
			}
			//check if the incentive is already in the list
			const incentiveIndex = acc[key].incentives.findIndex(
				(incentive): boolean => toAddress(incentive.incentive) === toAddress(cur.incentive)
			);
			if (incentiveIndex === -1) {
				acc[key].normalizedSum += value;
				acc[key].estimatedAPR = getAPR(acc[key].normalizedSum);
				acc[key].incentives.push({...cur, value, estimatedAPR});
			} else {
				acc[key].normalizedSum += value;
				acc[key].incentives[incentiveIndex].amount += cur.amount;
				acc[key].incentives[incentiveIndex].value += value;
				acc[key].incentives[incentiveIndex].estimatedAPR = getAPR(acc[key].incentives[incentiveIndex].value);
			}
			acc[key].usdPerStETH =
				acc[key].normalizedSum / Number(toNormalizedBN(toBigInt(totalDepositedETH), 18).normalized);
			return acc;
		}, {} as TDict<TGroupedIncentives>);

		return {protocols: groupByProtocol, user: groupForUser};
	}, [address, incentiveHistory, prices, totalDepositedETH]);

	return {
		groupIncentiveHistory,
		isFetchingHistory,
		refreshIncentives: filterIncentivizeEvents,
		totalDepositedETH: toNormalizedBN(totalDepositedETH || 0n, 18),
		totalDepositedUSD: totalDepositedValue,
		claimedIncentives: claimedIncentives,
		refreshClaimedIncentives: filterClaimIncentiveEvents
	};
}

export default useBootstrapIncentives;
