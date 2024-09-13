/* eslint-disable @typescript-eslint/consistent-type-assertions */

import React, {createContext, useContext, useMemo, useState} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {decodeAsBigInt, toAddress, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import BOOTSTRAP_ABI_NEW from '@libAbi/bootstrap.abi.new';
import {readContracts} from '@wagmi/core';
import {possibleTokensToVoteFor} from '@yUSD/utils/constants';

import type {TNDict} from '@builtbymom/web3/types';
import type {TBasket, TBasketItem, TIncentives, TIndexedTokenInfo} from '@libUtils/types';

type TUseBasketProps = {
	assets: TIndexedTokenInfo[];
	basket: TBasket;
	weightIncentives: TIncentives;
	currentVotesForNoChanges: TBasketItem['voteForEpoch'];
	refreshAssets: () => Promise<void>;
	refreshBasket: () => Promise<void>;
	refreshIncentives: () => Promise<void>;
	refreshEpochIncentives: (epoch: bigint) => Promise<void>;
	getIncentivesForEpoch: (epoch: bigint) => {data: TIncentives; hasData: boolean};
	isLoaded: boolean;
	areIncentivesLoaded: boolean;
	epoch: bigint | undefined;
};
const defaultProps: TUseBasketProps = {
	assets: [],
	basket: [],
	weightIncentives: {},
	currentVotesForNoChanges: {
		vote: zeroNormalizedBN,
		totalVotes: zeroNormalizedBN,
		ratio: 0
	},
	refreshAssets: async (): Promise<void> => undefined,
	refreshBasket: async (): Promise<void> => undefined,
	refreshIncentives: async (): Promise<void> => undefined,
	refreshEpochIncentives: async (): Promise<void> => undefined,
	getIncentivesForEpoch: (): {data: TIncentives; hasData: boolean} => ({data: {}, hasData: false}),
	isLoaded: false,
	areIncentivesLoaded: false,
	epoch: undefined
};

const BasketContext = createContext<TUseBasketProps>(defaultProps);
export const BasketContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const {address} = useWeb3();
	const assets = useMemo(() => Object.values(possibleTokensToVoteFor), []);
	const [basket, set_basket] = useState<TBasket>([]);
	const [weightIncentives, set_weightIncentives] = useState<TIncentives>({});
	const [currentVotesForNoChanges, set_currentVotesForNoChanges] = useState<TBasketItem['voteForEpoch']>({
		vote: zeroNormalizedBN,
		totalVotes: zeroNormalizedBN,
		ratio: 0
	});
	const [areIncentivesLoaded, set_areIncentivesLoaded] = useState(false);
	const [pastWeightIncentives, set_pastWeightIncentives] = useState<TNDict<{data: TIncentives; hasData: boolean}>>(
		{}
	);

	const refreshBasket = useAsyncTrigger(async (): Promise<void> => {
		if (!assets.length) {
			return;
		}
		const data = await readContracts(retrieveConfig(), {
			contracts: assets
				.map((item, index): any => {
					return [
						{
							address: toAddress(process.env.DEPOSIT_ADDRESS),
							abi: BOOTSTRAP_ABI_NEW,
							functionName: 'incentives',
							args: [item.address, address],
							chainId: Number(process.env.DEFAULT_CHAIN_ID)
						}
					] as any[];
				})
				.flat()
		});
		let idx = 0;
		const supply = toNormalizedBN(decodeAsBigInt(data[idx++]), 18);
		const vbSum = toNormalizedBN(toBigInt((data[idx++]?.result as [bigint, bigint])?.[1] as bigint) || 0n, 18);
		const totalVotesForEpoch = toNormalizedBN(decodeAsBigInt(data[idx++]), 18);

		const voteForNoChange = toNormalizedBN(decodeAsBigInt(data[idx++]), 18);
		set_currentVotesForNoChanges({
			vote: voteForNoChange,
			totalVotes: totalVotesForEpoch,
			ratio: voteForNoChange.normalized / totalVotesForEpoch.normalized
		});

		const itemsInBasket = assets.map((token, index): TBasketItem => {
			const rate = toNormalizedBN(toBigInt(data?.[idx++]?.result as bigint) || 0n, 18);
			const weight = toNormalizedBN(toBigInt((data?.[idx]?.result as bigint[])?.[0] as bigint) || 0n, 18);
			const targetWeight = toNormalizedBN(toBigInt((data?.[idx]?.result as bigint[])?.[1] as bigint) || 0n, 18);
			const currentBandPlus = toNormalizedBN(
				toBigInt((data?.[idx]?.result as bigint[])?.[2] as bigint) || 0n,
				18
			);
			const currentBandMin = toNormalizedBN(
				toBigInt((data?.[idx++]?.result as bigint[])?.[3] as bigint) || 0n,
				18
			);

			const poolAllowance = toNormalizedBN(toBigInt(data?.[idx++]?.result as bigint) || 0n, 18);
			const lstSupply = toNormalizedBN(toBigInt(data?.[idx++]?.result as bigint) || 0n, 18);
			const virtualBalance = toNormalizedBN(toBigInt(data?.[idx++]?.result as bigint) || 0n, 18);
			const zapAllowance = toNormalizedBN(toBigInt(data?.[idx++]?.result as bigint) || 0n, 18);
			const voteForEpoch = toNormalizedBN(toBigInt(data?.[idx++]?.result as bigint) || 0n, 18);
			const amountInPool = lstSupply;
			const amountInPoolPercent = (Number(virtualBalance.normalized) / Number(vbSum.normalized)) * 100;
			const currentBeaconEquivalentValue = virtualBalance;
			const currentEquilibrumWeight = weight;
			const weightRamps = targetWeight;

			return {
				...token,
				index,
				rate,
				weight,
				targetWeight,
				weightRatio: Number(virtualBalance.normalized) / Number(vbSum.normalized),
				poolAllowance: poolAllowance,
				zapAllowance: zapAllowance,
				poolSupply: lstSupply,
				virtualPoolSupply: toNormalizedBN(
					((virtualBalance.raw * toBigInt(1e18)) / (supply.raw || 1n)) * 100n,
					18
				),
				voteForEpoch: {
					vote: voteForEpoch,
					totalVotes: totalVotesForEpoch,
					ratio: voteForEpoch.normalized / totalVotesForEpoch.normalized
				},
				poolStats: {
					amountInPool,
					amountInPoolPercent,
					targetWeight,
					currentBeaconEquivalentValue,
					currentEquilibrumWeight,
					currentBandPlus,
					currentBandMin,
					distanceFromTarget: amountInPoolPercent - Number(currentEquilibrumWeight.normalized) * 100,
					weightRamps
				}
			};
		});
		set_basket(itemsInBasket);
	}, [address, assets]);

	/**************************************************************************
	 * Once we have the list of candidates, it's possible for us to try to
	 * retrieve the list of incentives for each candidate
	 *************************************************************************/
	// const refreshWeightIncentives = useCallback(
	// 	async (_epoch: bigint): Promise<void> => {
	// 		if (!assets.length) {
	// 			return;
	// 		}
	// 		const rangeLimit = toBigInt(Number(process.env.RANGE_LIMIT));
	// 		const epochStartBlock = getEpochStartBlock(Number(_epoch));
	// 		const epochEndBlock = getEpochEndBlock(Number(_epoch));
	// 		const currentBlock = await getBlockNumber(retrieveConfig());
	// 		const checkUpToBlock = epochEndBlock < currentBlock ? epochEndBlock : currentBlock;
	// 		const publicClient = getClient(retrieveConfig());

	// 		type TDetectedIncentives = {
	// 			amount: bigint;
	// 			idx: bigint;
	// 			depositor: TAddress;
	// 			token: TAddress;
	// 		};
	// 		const detectedIncentives: TDetectedIncentives[] = [];
	// 		if (publicClient) {
	// 			for (let i = epochStartBlock; i < checkUpToBlock; i += rangeLimit) {
	// 				const events = await getLogs(publicClient, {
	// 					address: toAddress(process.env.WEIGHT_INCENTIVES_ADDRESS),
	// 					event: WEIGHT_INCENTIVE_ABI[0],
	// 					fromBlock: i,
	// 					toBlock: i + rangeLimit,
	// 					args: {
	// 						epoch: _epoch
	// 					}
	// 				});
	// 				for (const log of events) {
	// 					detectedIncentives.push({
	// 						amount: toBigInt(log.args.amount),
	// 						idx: toBigInt(log.args.idx),
	// 						depositor: toAddress(log.args.depositor),
	// 						token: toAddress(log.args.token)
	// 					});
	// 				}
	// 			}
	// 		}

	// 		/**********************************************************************
	// 		 * Once we have all the incentives for the current epoch, we can assign
	// 		 * them to the candidates. However, we first need to retrieve the
	// 		 * information about the token added to built a proper TToken object.
	// 		 * To avoid duplicate calls, we will build a map of unique token
	// 		 * address
	// 		 *********************************************************************/
	// 		const tokensData = await readContracts(retrieveConfig(), {
	// 			contracts: [
	// 				...detectedIncentives.map(item => ({
	// 					address: toAddress(item.token),
	// 					abi: erc20Abi,
	// 					functionName: 'name',
	// 					chainId: Number(process.env.DEFAULT_CHAIN_ID)
	// 				})),
	// 				...detectedIncentives.map(item => ({
	// 					address: toAddress(item.token),
	// 					abi: erc20Abi,
	// 					functionName: 'symbol',
	// 					chainId: Number(process.env.DEFAULT_CHAIN_ID)
	// 				})),
	// 				...detectedIncentives.map(item => ({
	// 					address: toAddress(item.token),
	// 					abi: erc20Abi,
	// 					functionName: 'decimals',
	// 					chainId: Number(process.env.DEFAULT_CHAIN_ID)
	// 				}))
	// 			]
	// 		});
	// 		const assetsWithNoChange = [NO_CHANGE_LST_LIKE, ...assets];
	// 		const byCandidate: TDict<TDict<TTokenIncentive[]>> = {};
	// 		for (let i = 0; i < detectedIncentives.length; i++) {
	// 			const {idx, token} = detectedIncentives[i];
	// 			const candidate = assetsWithNoChange[Number(idx)].address;
	// 			if (!byCandidate[candidate]) {
	// 				byCandidate[candidate] = {};
	// 			}
	// 			if (!byCandidate[candidate][token]) {
	// 				byCandidate[candidate][token] = [];
	// 			}

	// 			const tokenAddress = detectedIncentives[i].token;
	// 			const tokenName = decodeAsString(tokensData[i]);
	// 			const tokenSymbol = decodeAsString(tokensData[i + detectedIncentives.length]);
	// 			const tokenDecimals = decodeAsNumber(tokensData[i + detectedIncentives.length * 2]);
	// 			const amount = toNormalizedBN(detectedIncentives[i].amount, tokenDecimals);
	// 			byCandidate[candidate][token].push({
	// 				address: toAddress(tokenAddress),
	// 				name: tokenName,
	// 				symbol: tokenSymbol,
	// 				decimals: tokenDecimals,
	// 				chainID: Number(process.env.DEFAULT_CHAIN_ID),
	// 				balance: zeroNormalizedBN,
	// 				value: 0,
	// 				depositor: detectedIncentives[i].depositor,
	// 				amount
	// 			});
	// 		}

	// 		set_areIncentivesLoaded(true);
	// 		set_weightIncentives(byCandidate);
	// 		set_pastWeightIncentives(prev => ({...prev, [Number(_epoch)]: {data: byCandidate, hasData: true}}));
	// 	},
	// 	[assets]
	// );

	// const triggerWeightIncentivesRefresh = useAsyncTrigger(async (): Promise<void> => {
	// 	if (!epoch) {
	// 		return;
	// 	}
	// 	await refreshWeightIncentives(epoch);

	// 	//For the claim section, we need the previous epoch incentives
	// 	refreshWeightIncentives();
	// }, [refreshWeightIncentives]);

	// /**************************************************************************
	//  * getIncentivesForEpoch is a function that will retrieve the incentives
	//  * for a given epoch.
	//  *************************************************************************/
	// const getIncentivesForEpoch = useCallback(
	// 	(_epoch: bigint): {data: TIncentives; hasData: boolean} => {
	// 		if (!pastWeightIncentives[Number(_epoch)]) {
	// 			return {data: {}, hasData: false};
	// 		}
	// 		return pastWeightIncentives[Number(_epoch)];
	// 	},
	// 	[pastWeightIncentives]
	// );

	// const contextValue = useMemo(
	// 	(): TUseBasketProps => ({
	// 		assets,
	// 		basket,
	// 		weightIncentives,
	// 		getIncentivesForEpoch,
	// 		refreshAssets,
	// 		refreshBasket,
	// 		refreshIncentives: triggerWeightIncentivesRefresh,
	// 		refreshEpochIncentives: refreshWeightIncentives,
	// 		isLoaded: basket.length > 0,
	// 		areIncentivesLoaded,
	// 		currentVotesForNoChanges,
	// 		epoch
	// 	}),
	// 	[
	// 		assets,
	// 		basket,
	// 		weightIncentives,
	// 		getIncentivesForEpoch,
	// 		refreshAssets,
	// 		refreshBasket,
	// 		triggerWeightIncentivesRefresh,
	// 		refreshWeightIncentives,
	// 		areIncentivesLoaded,
	// 		currentVotesForNoChanges,
	// 		epoch
	// 	]
	// );

	return <BasketContext.Provider value={{assets}}>{children}</BasketContext.Provider>;
};

const useBasket = (): TUseBasketProps => useContext(BasketContext);
export default useBasket;
