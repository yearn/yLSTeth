import {useCallback, useState} from 'react';
import {getClient} from 'utils';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {parseAbiItem} from 'viem';
import {erc20ABI} from 'wagmi';
import {useAsync, useMountEffect, useUpdateEffect} from '@react-hookz/web';
import {multicall} from '@wagmi/core';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {decodeAsBigInt, decodeAsNumber, decodeAsString} from '@yearn-finance/web-lib/utils/decoder';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';

export type TUseBootstrapWhitelistedLSTResp = {
	whitelistedLST: TDict<TTokenInfo>,
	isLoading: boolean,
	onUpdate: VoidFunction
}
function useBootstrapWhitelistedLST(): TUseBootstrapWhitelistedLSTResp {
	const [whitelistedLSTAddr, set_whitelistedLSTAddr] = useState<TAddress[]>([]);
	const [isLoading, set_isLoading] = useState<boolean>(false);

	const [{result: whitelistedLST}, fetchTokenData] = useAsync(
		async function fetchToken(addresses: TAddress[]): Promise<TDict<TTokenInfo>> {
			const calls = [];
			const baseBootstrapContract = {
				address: toAddress(process.env.BOOTSTRAP_ADDRESS),
				abi: BOOTSTRAP_ABI
			};
			calls.push({...baseBootstrapContract, functionName: 'voted'});
			for (const protocolAddress of addresses) {
				calls.push(...[
					{address: protocolAddress, abi: erc20ABI, functionName: 'name'},
					{address: protocolAddress, abi: erc20ABI, functionName: 'symbol'},
					{address: protocolAddress, abi: erc20ABI, functionName: 'decimals'},
					{...baseBootstrapContract, functionName: 'votes', args: [protocolAddress]}
				]);
			}
			const results = await multicall({
				contracts: calls,
				chainId: Number(process.env.DEFAULT_CHAINID)
			});

			const tokens: TDict<TTokenInfo> = {};
			let i = 0;
			const totalVotes = decodeAsBigInt(results[i++]);
			for (const address of addresses) {
				const name = decodeAsString(results[i++]);
				const symbol = decodeAsString(results[i++]);
				const decimals = decodeAsNumber(results[i++]);
				const allVotesForThis = decodeAsBigInt(results[i++]);
				tokens[address] = {
					address: address,
					name: name,
					symbol: symbol,
					decimals: decimals,
					chainId: Number(process.env.DEFAULT_CHAINID),
					logoURI: `https://assets.smold.app/api/token/${Number(process.env.BASE_CHAINID)}/${address}/logo-128.png`,
					extra: {
						votes: allVotesForThis,
						totalVotes: totalVotes
					}
				};
			}
			return (tokens);
		}, {}
	);

	const filterEvents = useCallback(async (): Promise<void> => {
		set_isLoading(true);
		const publicClient = getClient();
		const rangeLimit = 1_000_000n;
		const deploymentBlockNumber = 62_856_231n;
		const currentBlockNumber = await publicClient.getBlockNumber();
		const whitelisted: TAddress[] = [];
		for (let i = deploymentBlockNumber; i < currentBlockNumber; i += rangeLimit) {
			const logs = await publicClient.getLogs({
				address: toAddress(process.env.BOOTSTRAP_ADDRESS),
				event: parseAbiItem('event Whitelist(address indexed)'),
				fromBlock: i,
				toBlock: i + rangeLimit
			});
			for (const log of logs) {
				const [address] = log.args;
				if (!address || whitelisted.includes(address)) {
					continue;
				}
				whitelisted.push(address);
			}
		}
		performBatchedUpdates((): void => {
			set_whitelistedLSTAddr(whitelisted);
			set_isLoading(false);
		});
	}, []);

	useMountEffect(filterEvents);
	useUpdateEffect((): void => {
		fetchTokenData.execute(whitelistedLSTAddr);
	}, [whitelistedLSTAddr]);

	return {whitelistedLST, isLoading, onUpdate: filterEvents};
}

export default useBootstrapWhitelistedLST;
