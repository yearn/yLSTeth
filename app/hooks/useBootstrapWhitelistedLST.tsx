import {useCallback, useState} from 'react';
import BOOTSTRAP_ABI from 'app/utils/abi/bootstrap.abi';
import {parseAbiItem} from 'viem';
import {erc20ABI} from 'wagmi';
import {
	decodeAsBigInt,
	decodeAsNumber,
	decodeAsString,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {getClient} from '@builtbymom/web3/utils/wagmi';
import {useAsync, useMountEffect, useUpdateEffect} from '@react-hookz/web';
import {multicall} from '@wagmi/core';

import type {TAddress, TDict, TToken} from '@builtbymom/web3/types';

export type TTokenExtra = TToken & {
	extra: {
		votes: bigint;
		totalVotes: bigint;
		weight: number;
	};
};

export type TUseFilterWhitelistedLSTResp = {
	whitelistedLSTAddr: TAddress[];
	isLoading: boolean;
	onUpdate: VoidFunction;
};
function useFilterWhitelistedLST(): TUseFilterWhitelistedLSTResp {
	const [whitelistedLSTAddr, set_whitelistedLSTAddr] = useState<TAddress[]>([]);
	const [isLoading, set_isLoading] = useState<boolean>(false);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Once the whitelisting period is over, we need to know the whitelisted LST tokens to work
	 ** with them during the deposit and incentives period.
	 ** To get them, we will just filter the Whitelist events from the bootstrap contract.
	 **********************************************************************************************/
	const filterWhitelistEvents = useCallback(async (): Promise<void> => {
		set_isLoading(true);
		const publicClient = getClient(Number(process.env.DEFAULT_CHAIN_ID));
		const rangeLimit = toBigInt(Number(process.env.RANGE_LIMIT));
		const deploymentBlockNumber = toBigInt(process.env.BOOTSTRAP_INIT_BLOCK_NUMBER);
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
		set_whitelistedLSTAddr(whitelisted);
		set_isLoading(false);
	}, []);

	return {whitelistedLSTAddr, isLoading, onUpdate: filterWhitelistEvents};
}

export type TUseBootstrapWhitelistedLSTResp = {
	whitelistedLST: TDict<TTokenExtra>;
	isLoading: boolean;
	onUpdate: VoidFunction;
};
function useBootstrapWhitelistedLST(): TUseBootstrapWhitelistedLSTResp {
	const {whitelistedLSTAddr, isLoading, onUpdate} = useFilterWhitelistedLST();

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Once we got the whitelistedLSTAddr, we need to fetch the token data for each of them, aka
	 ** all the stuff like name, symbol, but also the votes and the weight of each.
	 **
	 ** @returns: TDict<TToken> - The object of whitelisted tokens with all the data.
	 **********************************************************************************************/
	const fetchTokens = useCallback(async (addresses: TAddress[]): Promise<TDict<TTokenExtra>> => {
		const calls = [];

		/* 🔵 - Yearn Finance **********************************************************************
		 ** We will perform a multicall to get:
		 ** - voted, one time, which is the total number of votes for all whitelisted tokens
		 ** - name, symbol, decimals for each whitelisted token
		 ** - votes for each whitelisted token
		 ******************************************************************************************/
		const baseBootstrapContract = {address: toAddress(process.env.BOOTSTRAP_ADDRESS), abi: BOOTSTRAP_ABI};
		calls.push({...baseBootstrapContract, functionName: 'voted'});
		for (const protocolAddress of addresses) {
			calls.push(
				...[
					{address: protocolAddress, abi: erc20ABI, functionName: 'name'},
					{address: protocolAddress, abi: erc20ABI, functionName: 'symbol'},
					{address: protocolAddress, abi: erc20ABI, functionName: 'decimals'},
					{...baseBootstrapContract, functionName: 'votes', args: [protocolAddress]}
				]
			);
		}
		const results = await multicall({contracts: calls, chainId: Number(process.env.DEFAULT_CHAIN_ID)});

		/* 🔵 - Yearn Finance **********************************************************************
		 ** We got the data, we can decode them and create our object of {address: TToken}
		 ** so we can do some more calculations to get the weight of each token.
		 ******************************************************************************************/
		let i = 0;
		const tokens: TDict<TTokenExtra> = {};
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
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				logoURI: `https://assets.smold.app/api/token/${Number(
					process.env.BASE_CHAIN_ID
				)}/${address}/logo-128.png`,
				balance: zeroNormalizedBN,
				price: zeroNormalizedBN,
				value: 0,
				extra: {
					votes: allVotesForThis,
					totalVotes: totalVotes,
					weight: 0
				}
			};
		}

		/* 🔵 - Yearn Finance **********************************************************************
		 ** For each token, compute weight which is the percentage of votes for this token over the
		 ** total votes
		 ** If the weight is more than 40%, scale it down to 40% and scale up the other tokens
		 ******************************************************************************************/
		const maxWeight = 40;
		let totalWeightAfterScaling = 0;
		for (const token of Object.values(tokens)) {
			const votes = Number(toNormalizedBN(token?.extra?.votes || 0, 18).normalized);
			const total = Number(toNormalizedBN(totalVotes, 18).normalized);
			const weight = (votes / total) * 100;
			if (token.extra) {
				if (weight > maxWeight) {
					token.extra.weight = maxWeight;
					totalWeightAfterScaling += maxWeight;
				} else {
					token.extra.weight = weight;
					totalWeightAfterScaling += weight;
				}
			}
		}

		/* 🔵 - Yearn Finance **********************************************************************
		 ** If the total weight after scaling is less than 100%, scale up the tokens
		 ******************************************************************************************/
		if (totalWeightAfterScaling < 100n) {
			const diff = 100 - totalWeightAfterScaling;
			const nonZeroTokensLen = Object.values(tokens)
				.filter((token): boolean => (token?.extra?.weight || 0) > 0)
				.filter((token): boolean => (token?.extra?.weight || 0) !== 40).length;
			for (const token of Object.values(tokens)) {
				if ((token?.extra?.weight || 0) === 0) {
					continue;
				}
				if ((token?.extra?.weight || 0) === maxWeight) {
					continue;
				}
				if (token?.extra?.weight) {
					token.extra.weight += diff / nonZeroTokensLen;
				}
			}
		}

		return tokens;
	}, []);
	const [{result: whitelistedLST}, fetchTokenData] = useAsync(fetchTokens, {});

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Lifecycle hooks to manage the fetching of the token data
	 **********************************************************************************************/
	useMountEffect(onUpdate);
	useUpdateEffect((): void => {
		fetchTokenData.execute(whitelistedLSTAddr);
	}, [whitelistedLSTAddr]);

	return {whitelistedLST, isLoading, onUpdate};
}

export default useBootstrapWhitelistedLST;
