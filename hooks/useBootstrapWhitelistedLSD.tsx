import {useCallback, useState} from 'react';
import {createPublicClient, http, parseAbiItem} from 'viem';
import {fantom} from 'viem/chains';
import {erc20ABI} from 'wagmi';
import {useAsync, useMountEffect, useUpdateEffect} from '@react-hookz/web';
import {multicall} from '@wagmi/core';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {decodeAsNumber, decodeAsString} from '@yearn-finance/web-lib/utils/decoder';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';

function useBootstrapWhitelistedLSD(): TDict<TTokenInfo> {
	const [whitelistedLSDAddr, set_whitelistedLSDAddr] = useState<TAddress[]>([]);

	const [{result: whitelistedLSD}, fetchTokenData] = useAsync(async function fetchToken(
		chainID: number,
		addresses: TAddress[]
	): Promise<TDict<TTokenInfo>> {
		const calls = [];
		for (const address of addresses) {
			calls.push(...[
				{address: address, abi: erc20ABI, functionName: 'name'},
				{address: address, abi: erc20ABI, functionName: 'symbol'},
				{address: address, abi: erc20ABI, functionName: 'decimals'}
			]);
		}
		const results = await multicall({contracts: calls, chainId: chainID});

		const tokens: TDict<TTokenInfo> = {};
		let i = 0;
		for (const address of addresses) {
			const name = decodeAsString(results[i++]);
			const symbol = decodeAsString(results[i++]);
			const decimals = decodeAsNumber(results[i++]);
			tokens[address] = {
				address: address,
				name: name,
				symbol: symbol,
				decimals: decimals,
				chainId: chainID,
				logoURI: `https://assets.smold.app/api/token/${chainID}/${address}/logo-128.png`
			};
		}
		return (tokens);
	}, {});

	const filterEvents = useCallback(async (): Promise<void> => {
		const publicClient = createPublicClient({
			chain: fantom,
			transport: http('https://rpc3.fantom.network')
		});
		const rangeLimit = 1_000_000n;
		const deploymentBlockNumber = 62_856_231n;
		const currentBlockNumber = await publicClient.getBlockNumber();
		const whitelisted: TAddress[] = [];
		for (let i = deploymentBlockNumber; i < currentBlockNumber; i += rangeLimit) {
			console.log(`Fetching logs from ${i} to ${i + rangeLimit} of ${currentBlockNumber}`);
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
				console.log(`${address} has been whitelisted on block ${log.blockNumber}`);
			}
		}
		set_whitelistedLSDAddr(whitelisted);
	}, []);

	useMountEffect(filterEvents);
	useUpdateEffect((): void => {
		fetchTokenData.execute(250, whitelistedLSDAddr);
	}, [whitelistedLSDAddr]);

	return whitelistedLSD;
}

export default useBootstrapWhitelistedLSD;
