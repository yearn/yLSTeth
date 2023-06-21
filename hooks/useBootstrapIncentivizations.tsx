/* eslint-disable @typescript-eslint/consistent-type-assertions */
import {useCallback, useMemo, useState} from 'react';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {useYDaemonBaseURI} from 'utils/getYDaemonBaseURI';
import {yDaemonPricesSchema} from 'utils/schemas/yDaemonPricesSchema';
import {createPublicClient, http, parseAbiItem, toHex} from 'viem';
import {fantom} from 'viem/chains';
import {erc20ABI, useContractRead} from 'wagmi';
import {useAsync, useMountEffect, useUpdateEffect} from '@react-hookz/web';
import {multicall} from '@wagmi/core';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {decodeAsNumber, decodeAsString} from '@yearn-finance/web-lib/utils/decoder';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

import {useFetch} from './useFetch';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {TYDaemonPrices} from 'utils/schemas/yDaemonPricesSchema';
import type {Hex} from 'viem';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';

export type TIncentives = {
	protocol: TAddress,
	protocolName: string,
	incentive: TAddress,
	depositor: TAddress,
	amount: bigint,
	value: number,
	estimatedAPR: number,
	blockNumber: bigint,
	txHash: Hex,
	incentiveToken?: TTokenInfo
}
export type TGroupedIncentives = {
	protocol: TAddress,
	protocolName: string,
	normalizedSum: number,
	estimatedAPR: number,
	usdPerStETH: number,
	incentives: TIncentives[]
}

export type TIncentivesFor = {
	protocols: TDict<TGroupedIncentives>,
	user: TDict<TGroupedIncentives>
}

function useBootstrapIncentivizations(): [TIncentivesFor, VoidFunction] {
	const {address} = useWeb3();
	const [userIncentives, set_userIncentives] = useState<TIncentives[]>([]);
	const {yDaemonBaseUri} = useYDaemonBaseURI({chainID: Number(process.env.BASE_CHAINID)});
	const {data: prices} = useFetch<TYDaemonPrices>({
		endpoint: `${yDaemonBaseUri}/prices/all`,
		schema: yDaemonPricesSchema
	});

	const {data: totalDepositedETH} = useContractRead({
		address: toAddress(process.env.BOOTSTRAP_ADDRESS), abi: BOOTSTRAP_ABI, functionName: 'deposited'
	});

	/* 🔵 - Yearn Finance **************************************************************************
	* Connect to the node and listen for all the events since the deployment of the contracts.
	* We need to filter the Incentivize even to get the objects with protocol incentived, amound,
	* depositor and incentive token.
	* From that we will be able to create our mappings
	**********************************************************************************************/
	const filterEvents = useCallback(async (): Promise<void> => {
		const publicClient = createPublicClient({
			chain: fantom,
			transport: http('https://rpc3.fantom.network')
		});
		const rangeLimit = 1_000_000n;
		const deploymentBlockNumber = 62_856_231n;
		const currentBlockNumber = await publicClient.getBlockNumber();
		const incentives: TIncentives[] = [];
		for (let i = deploymentBlockNumber; i < currentBlockNumber; i += rangeLimit) {
			const logs = await publicClient.getLogs({
				address: toAddress(process.env.BOOTSTRAP_ADDRESS),
				event: parseAbiItem('event Incentivize(address indexed protocol, address indexed incentive, address indexed depositor, uint256 amount)'),
				fromBlock: i,
				toBlock: i + rangeLimit
			});
			for (const log of logs) {
				const {protocol, incentive, amount, depositor} = log.args;
				console.log(`${depositor} has put ${amount} ${incentive} for ${protocol}`);
				incentives.push({
					blockNumber: toBigInt(log.blockNumber as bigint),
					txHash: toHex(log.transactionHash || ''),
					protocol: toAddress(protocol),
					protocolName: truncateHex(protocol, 6),
					incentive: toAddress(incentive),
					depositor: toAddress(depositor),
					amount: toBigInt(amount),
					value: 0,
					estimatedAPR: 0
				});
			}
		}
		set_userIncentives(incentives);
	}, []);
	useMountEffect(filterEvents);

	/* 🔵 - Yearn Finance **************************************************************************
	* The filtered events are only a bunch of addresses and amounts. Because we are an UI we want
	* to make this easy for users to understand. We will fetch the token information from the
	* blockchain and the logo from the API, then store it in an intermediate object.
	**********************************************************************************************/
	const incentives = useAsync(async function fetchToken(chainID: number, incentives: TIncentives[]): Promise<TIncentives[]> {
		const calls = [];
		for (const {incentive, protocol} of incentives) {
			calls.push(...[
				{address: protocol, abi: erc20ABI, functionName: 'name'},
				{address: incentive, abi: erc20ABI, functionName: 'name'},
				{address: incentive, abi: erc20ABI, functionName: 'symbol'},
				{address: incentive, abi: erc20ABI, functionName: 'decimals'}
			]);
		}
		const results = await multicall({contracts: calls, chainId: chainID});

		const incentiveList: TIncentives[] = [];
		let i = 0;
		for (const args of incentives) {
			const protocolName = decodeAsString(results[i++]);
			const name = decodeAsString(results[i++]);
			const symbol = decodeAsString(results[i++]);
			const decimals = decodeAsNumber(results[i++]);
			incentiveList.push({
				protocol: args.protocol,
				protocolName: protocolName,
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
					chainId: chainID,
					logoURI: `https://assets.smold.app/api/token/${chainID}/${args.incentive}/logo-128.png`
				}
			});
		}
		return (incentiveList);
	}, []);
	const [{result: incentiveHistory}, fetchTokenData] = incentives;
	useUpdateEffect((): void => {
		fetchTokenData.execute(250, userIncentives);
	}, [userIncentives]);


	/* 🔵 - Yearn Finance **************************************************************************
	* For the UI we will need two things:
	* - The list of all the protocols that have been incentivized with the list of incentives they
	*   have received.
	* - The list of all the incentives that have been distributed by the current user.
	* To do that we will use the incentiveHistory object and group the data by protocol, then by
	* depositor.
	**********************************************************************************************/
	const groupIncentiveHistory = useMemo((): {
		protocols: TDict<TGroupedIncentives>,
		user: TDict<TGroupedIncentives>
	} => {
		if (!incentiveHistory) {
			return {protocols: {}, user: {}};
		}
		const getAPR = (USDValue: number): number => (
			USDValue
			* 12
			/ Number(toNormalizedBN(toBigInt(totalDepositedETH)).normalized)
			/ Number(toNormalizedBN(prices?.[ETH_TOKEN_ADDRESS] || 0, 6).normalized)
			* 100
		);

		const groupByProtocol = incentiveHistory
			.reduce((acc, cur): TDict<TGroupedIncentives> => {
				if (!cur) {
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
						estimatedAPR: estimatedAPR,
						protocolName: cur.protocolName || truncateHex(cur.protocol, 6),
						normalizedSum: value,
						usdPerStETH: value / Number(toNormalizedBN(toBigInt(totalDepositedETH)).normalized),
						incentives: [{...cur, value, estimatedAPR}]
					};
					return acc;
				}
				//check if the incentive is already in the list
				const incentiveIndex = acc[key].incentives.findIndex((incentive): boolean => (
					toAddress(incentive.incentive) === toAddress(cur.incentive)
				));
				if (incentiveIndex === -1) {
					acc[key].normalizedSum += value;
					acc[key].estimatedAPR = getAPR(acc[key].normalizedSum);
					acc[key].incentives.push({...cur, value, estimatedAPR});
				} else {
					acc[key].incentives[incentiveIndex].value += value;
					acc[key].incentives[incentiveIndex].estimatedAPR = getAPR(acc[key].incentives[incentiveIndex].value);
				}
				acc[key].usdPerStETH = acc[key].normalizedSum / Number(toNormalizedBN(toBigInt(totalDepositedETH)).normalized);
				return acc;
			}, {} as TDict<TGroupedIncentives>);

		const groupForUser = incentiveHistory
			.reduce((acc, cur): TDict<TGroupedIncentives> => {
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
						normalizedSum: value,
						estimatedAPR: estimatedAPR,
						usdPerStETH: value / Number(toNormalizedBN(toBigInt(totalDepositedETH)).normalized),
						incentives: [{...cur, value, estimatedAPR}]
					};
					return acc;
				}
				//check if the incentive is already in the list
				const incentiveIndex = acc[key].incentives.findIndex((incentive): boolean => (
					toAddress(incentive.incentive) === toAddress(cur.incentive)
				));
				if (incentiveIndex === -1) {
					acc[key].normalizedSum += value;
					acc[key].estimatedAPR = getAPR(acc[key].normalizedSum);
					acc[key].incentives.push({...cur, value, estimatedAPR});
				} else {
					acc[key].incentives[incentiveIndex].value += value;
					acc[key].incentives[incentiveIndex].estimatedAPR = getAPR(acc[key].incentives[incentiveIndex].value);
				}
				acc[key].usdPerStETH = acc[key].normalizedSum / Number(toNormalizedBN(toBigInt(totalDepositedETH)).normalized);
				return acc;
			}, {} as TDict<TGroupedIncentives>);

		return {protocols: groupByProtocol, user: groupForUser};
	}, [address, incentiveHistory, prices, totalDepositedETH]);

	return [groupIncentiveHistory, filterEvents];
}

export default useBootstrapIncentivizations;
