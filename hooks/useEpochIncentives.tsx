/* eslint-disable @typescript-eslint/consistent-type-assertions */
import {useMemo, useState} from 'react';
import {useYDaemonBaseURI} from 'hooks/useYDaemonBaseURI';
import {getEpoch, getEpochEndBlock, getEpochEndTimestamp, getEpochStartTimestamp} from 'utils/epochs';
import {yDaemonPricesSchema} from 'utils/schemas/yDaemonPricesSchema';
import {parseAbiItem, toHex} from 'viem';
import {erc20ABI, useContractRead} from 'wagmi';
import {multicall} from '@wagmi/core';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {decodeAsNumber, decodeAsString} from '@yearn-finance/web-lib/utils/decoder';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {getClient} from '@yearn-finance/web-lib/utils/wagmi/utils';

import {useAsyncTrigger} from './useAsyncEffect';
import {useFetch} from './useFetch';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {TYDaemonPrices} from 'utils/schemas/yDaemonPricesSchema';
import type {Hex} from 'viem';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

type TIncentives = {
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
	incentiveToken?: TTokenInfo;
};

type TGroupedIncentives = {
	protocol: TAddress;
	protocolName: string;
	protocolSymbol: string;
	normalizedSum: number;
	estimatedAPR: number;
	usdPerStETH: number;
	incentives: TIncentives[];
};

type TIncentivesFor = {
	protocols: TDict<TGroupedIncentives>;
	user: TDict<TGroupedIncentives>;
};

type TUseIncentivesResp = {
	groupIncentiveHistory: TIncentivesFor;
	isFetchingHistory: boolean;
	refreshIncentives: VoidFunction;
	totalDepositedETH: TNormalizedBN;
	totalDepositedUSD: number;
};
function useEpochIncentives(props: {epochNumber: number}): TUseIncentivesResp {
	const {address} = useWeb3();
	const [incentives, set_incentives] = useState<TIncentives[]>([]);
	const [incentiveHistory, set_incentiveHistory] = useState<TIncentives[]>([]);
	const [isFetchingHistory, set_isFetchingHistory] = useState(false);
	const {yDaemonBaseUri} = useYDaemonBaseURI({chainID: Number(process.env.BASE_CHAIN_ID)});
	const epoch = getEpoch(props.epochNumber);
	const {data: prices} = useFetch<TYDaemonPrices>({
		endpoint: `${yDaemonBaseUri}/prices/all`,
		schema: yDaemonPricesSchema
	});

	/* 🔵 - Yearn Finance **************************************************************************
	 ** useContractRead calling the `deposited` method from the bootstrap contract to get the total
	 ** deposited ETH from the contract.
	 **
	 ** @returns: bigint - total deposited eth
	 **********************************************************************************************/
	const {data: totalDepositedETH} = useContractRead({
		address: toAddress(process.env.YETH_ADDRESS),
		abi: erc20ABI,
		functionName: 'totalSupply',
		enabled: props.epochNumber >= 0,
		blockNumber: getEpochEndBlock(props.epochNumber)
	});

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Memoize the total deposited value in USD, using the prices from the yDaemon API and the
	 ** total deposited ETH from the contract.
	 **
	 ** @deps: prices - list of prices from the yDaemon API
	 ** @deps: totalDepositedETH - total deposited ETH from the contract
	 ** @returns: number - total deposited value in USD
	 **********************************************************************************************/
	const totalDepositedValue = useMemo((): number => {
		if (!prices || !totalDepositedETH) {
			return 0;
		}
		return (
			Number(toNormalizedBN(totalDepositedETH).normalized) *
			Number(toNormalizedBN(prices[ETH_TOKEN_ADDRESS] || 0, 6).normalized)
		);
	}, [prices, totalDepositedETH]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Connect to the node and listen for all the events since the deployment of the contracts.
	 ** We need to filter the Incentivize even to get the objects with protocol incentived, amount,
	 ** depositor and incentive token.
	 ** From that we will be able to create our mappings
	 **
	 ** @deps: startPeriod - start period of the current epoch
	 **********************************************************************************************/
	const filterIncentivizeEvents = useAsyncTrigger(async (): Promise<void> => {
		if (props.epochNumber < 0) {
			return;
		}
		set_isFetchingHistory(true);
		const publicClient = getClient(Number(process.env.DEFAULT_CHAIN_ID));
		const rangeLimit = toBigInt(Number(process.env.RANGE_LIMIT));
		const epochTimeStart = getEpochStartTimestamp(props.epochNumber);
		const epochTimeEnd = getEpochEndTimestamp(props.epochNumber);
		const startPeriod = toBigInt(epochTimeStart);
		const endPeriod = toBigInt(epochTimeEnd);
		const now = toBigInt(Math.floor(Date.now() / 1000));
		const currentBlockNumber = await publicClient.getBlockNumber();
		const blocksPerDay = 7200n;
		const daySinceStart = toBigInt(Math.floor(Number((now - startPeriod) / 86400n)));
		const daySinceEnd = toBigInt(Math.floor(Number((now - endPeriod) / 86400n)));
		const startsAtBlock = currentBlockNumber - blocksPerDay * daySinceStart;
		const endsAtBlock = currentBlockNumber - blocksPerDay * daySinceEnd;
		const incentives: TIncentives[] = [];
		for (let i = startsAtBlock; i < endsAtBlock; i += rangeLimit) {
			let toBlock = i + rangeLimit;
			if (toBlock > endsAtBlock) {
				toBlock = endsAtBlock;
			}
			const logs = await publicClient.getLogs({
				address: toAddress(process.env.VOTE_ADDRESS),
				event: parseAbiItem(
					'event Deposit(bytes32 indexed vote, uint256 choice, address indexed token, address depositor, uint256 amount)'
				),
				fromBlock: i,
				toBlock
			});
			for (const log of logs) {
				// Choice is between 1 and X options, where 1 is "Do Nothing / No Change".
				if (log.args.choice === 1n) {
					const {amount, depositor, token} = log.args;
					incentives.push({
						blockNumber: toBigInt(log.blockNumber as bigint),
						txHash: toHex(log.transactionHash || ''),
						protocol: toAddress(),
						protocolName: 'Do Nothing / No Change',
						protocolSymbol: 'Do Nothing / No Change',
						incentive: toAddress(token),
						depositor: toAddress(depositor),
						amount: toBigInt(amount),
						value: 0,
						estimatedAPR: 0
					});
					continue;
				}

				// The options are selected by the index in the array of possible LSTs.
				// As do nothing is not in the array, we need to add 2 to the index to get the correct choice.
				// Aka, array starting at 0 (so +1 to get 1st option), and +1 again to skip the "Do Nothing" option.
				// So to get the current array index from choice, we need to subtract 2.
				const candidate = epoch.inclusion.candidates[Number(log.args.choice) - 2];
				if (candidate) {
					const protocolAddress = toAddress(candidate.address);
					const {amount, depositor, token} = log.args;

					incentives.push({
						blockNumber: toBigInt(log.blockNumber as bigint),
						txHash: toHex(log.transactionHash || ''),
						protocol: toAddress(protocolAddress),
						protocolName: truncateHex(protocolAddress, 6),
						protocolSymbol: truncateHex(protocolAddress, 6),
						incentive: toAddress(token),
						depositor: toAddress(depositor),
						amount: toBigInt(amount),
						value: 0,
						estimatedAPR: 0
					});
					continue;
				}

				const participant = epoch.weight.participants[Number(log.args.choice) - 2];
				if (participant) {
					const protocolAddress = toAddress(participant.address);
					const {amount, depositor, token} = log.args;

					incentives.push({
						blockNumber: toBigInt(log.blockNumber as bigint),
						txHash: toHex(log.transactionHash || ''),
						protocol: toAddress(protocolAddress),
						protocolName: truncateHex(protocolAddress, 6),
						protocolSymbol: truncateHex(protocolAddress, 6),
						incentive: toAddress(token),
						depositor: toAddress(depositor),
						amount: toBigInt(amount),
						value: 0,
						estimatedAPR: 0
					});
					continue;
				}
			}
		}
		set_incentives(incentives);
	}, [epoch?.inclusion?.candidates, epoch?.weight?.participants, props.epochNumber]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** The filtered events are only a bunch of addresses and amounts. Because we are an UI we want
	 ** to make this easy for users to understand. We will fetch the token information from the
	 ** blockchain and the logo from the API, then store it in an intermediate object.
	 **
	 ** @deps: incentives - list of all the incentives
	 **********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		if (props.epochNumber < 0) {
			return;
		}
		const calls = [];
		for (const {incentive, protocol} of incentives) {
			calls.push(
				...[
					{address: protocol, abi: erc20ABI, functionName: 'name'},
					{address: protocol, abi: erc20ABI, functionName: 'symbol'},
					{address: incentive, abi: erc20ABI, functionName: 'name'},
					{address: incentive, abi: erc20ABI, functionName: 'symbol'},
					{address: incentive, abi: erc20ABI, functionName: 'decimals'}
				]
			);
		}
		const results = await multicall({contracts: calls, chainId: Number(process.env.BASE_CHAIN_ID)});

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
					chainId: Number(process.env.BASE_CHAIN_ID),
					logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${toAddress(args.incentive)}/logo-128.png`
				}
			});
		}
		set_isFetchingHistory(false);
		set_incentiveHistory(incentiveList);
	}, [incentives, props.epochNumber]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** For the UI we will need two things:
	 ** - The list of all the protocols that have been incentivized with the list of incentives they
	 **   have received.
	 ** - The list of all the incentives that have been distributed by the current user.
	 ** To do that we will use the incentiveHistory object and group the data by protocol, then by
	 ** depositor.
	 **
	 ** @deps: address - address of the user
	 ** @deps: incentiveHistory - list of all the incentives that have been distributed
	 ** @deps: prices - list of all the prices of the tokens
	 ** @deps: totalDepositedETH - total amount of ETH deposited
	 **********************************************************************************************/
	const groupIncentiveHistory = useMemo((): TIncentivesFor => {
		if (!incentiveHistory) {
			return {protocols: {}, user: {}};
		}
		const getAPR = (USDValue: number): number =>
			((USDValue * 12) /
				(Number(toNormalizedBN(toBigInt(totalDepositedETH)).normalized) *
					Number(toNormalizedBN(prices?.[ETH_TOKEN_ADDRESS] || 0, 6).normalized))) *
			100;

		const groupByProtocol = incentiveHistory.reduce((acc, cur): TDict<TGroupedIncentives> => {
			if (!cur) {
				return acc;
			}
			const key = cur.protocol;
			const amount = toNormalizedBN(cur.amount, cur.incentiveToken?.decimals || 18).normalized;
			const tokenAddress = toAddress(cur.incentive);
			const price = toNormalizedBN(prices?.[tokenAddress] || 0, 6).normalized;
			const value = Number(amount) * Number(price);
			const estimatedAPR = getAPR(value);
			if (!acc[toAddress(key)]) {
				acc[toAddress(key)] = {
					protocol: cur.protocol,
					estimatedAPR: estimatedAPR,
					protocolName: cur.protocolName || truncateHex(cur.protocol, 6),
					protocolSymbol: cur.protocolSymbol || truncateHex(cur.protocol, 6),
					normalizedSum: value,
					usdPerStETH: value / Number(toNormalizedBN(toBigInt(totalDepositedETH)).normalized),
					incentives: [{...cur, value, estimatedAPR}]
				};
				return acc;
			}
			//check if the incentive is already in the list
			const incentiveIndex = acc[toAddress(key)].incentives.findIndex(
				(incentive): boolean => toAddress(incentive.incentive) === toAddress(cur.incentive)
			);
			if (incentiveIndex === -1) {
				acc[toAddress(key)].normalizedSum += value;
				acc[toAddress(key)].estimatedAPR = getAPR(acc[toAddress(key)].normalizedSum);
				acc[toAddress(key)].incentives.push({...cur, value, estimatedAPR});
			} else {
				acc[toAddress(key)].normalizedSum += value;
				acc[toAddress(key)].incentives[incentiveIndex].amount += cur.amount;
				acc[toAddress(key)].incentives[incentiveIndex].value += value;
				acc[toAddress(key)].incentives[incentiveIndex].estimatedAPR = getAPR(
					acc[toAddress(key)].incentives[incentiveIndex].value
				);
			}
			acc[toAddress(key)].usdPerStETH =
				acc[toAddress(key)].normalizedSum / Number(toNormalizedBN(toBigInt(totalDepositedETH)).normalized);
			return acc;
		}, {} as TDict<TGroupedIncentives>);

		const groupForUser = incentiveHistory.reduce((acc, cur): TDict<TGroupedIncentives> => {
			if (!cur || toAddress(cur.depositor) !== toAddress(address)) {
				return acc;
			}
			const key = cur.protocol;
			const amount = toNormalizedBN(cur.amount, cur.incentiveToken?.decimals ?? 18).normalized;
			const tokenAddress = toAddress(cur.incentive);
			const price = toNormalizedBN(prices?.[tokenAddress] || 0, 6).normalized;
			const value = Number(amount) * Number(price);
			const estimatedAPR = getAPR(value);
			if (!acc[toAddress(key)]) {
				acc[toAddress(key)] = {
					protocol: cur.protocol,
					protocolName: cur.protocolName || truncateHex(cur.protocol, 6),
					protocolSymbol: cur.protocolSymbol || truncateHex(cur.protocol, 6),
					normalizedSum: value,
					estimatedAPR: estimatedAPR,
					usdPerStETH: value / Number(toNormalizedBN(toBigInt(totalDepositedETH)).normalized),
					incentives: [{...cur, value, estimatedAPR}]
				};
				return acc;
			}
			//check if the incentive is already in the list
			const incentiveIndex = acc[toAddress(key)].incentives.findIndex(
				(incentive): boolean => toAddress(incentive.incentive) === toAddress(cur.incentive)
			);
			if (incentiveIndex === -1) {
				acc[toAddress(key)].normalizedSum += value;
				acc[toAddress(key)].estimatedAPR = getAPR(acc[toAddress(key)].normalizedSum);
				acc[toAddress(key)].incentives.push({...cur, value, estimatedAPR});
			} else {
				acc[toAddress(key)].normalizedSum += value;
				acc[toAddress(key)].incentives[incentiveIndex].amount += cur.amount;
				acc[toAddress(key)].incentives[incentiveIndex].value += value;
				acc[toAddress(key)].incentives[incentiveIndex].estimatedAPR = getAPR(
					acc[toAddress(key)].incentives[incentiveIndex].value
				);
			}
			acc[toAddress(key)].usdPerStETH =
				acc[toAddress(key)].normalizedSum / Number(toNormalizedBN(toBigInt(totalDepositedETH)).normalized);
			return acc;
		}, {} as TDict<TGroupedIncentives>);

		return {protocols: groupByProtocol, user: groupForUser};
	}, [address, incentiveHistory, prices, totalDepositedETH]);

	return {
		groupIncentiveHistory,
		isFetchingHistory,
		refreshIncentives: filterIncentivizeEvents,
		totalDepositedETH: toNormalizedBN(totalDepositedETH || 0n),
		totalDepositedUSD: totalDepositedValue
	};
}

export default useEpochIncentives;
