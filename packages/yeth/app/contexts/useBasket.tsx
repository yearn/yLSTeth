/* eslint-disable @typescript-eslint/consistent-type-assertions */

import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {erc20Abi} from 'viem';
import {getLogs} from 'viem/actions';
import {useReadContract} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	decodeAsAddress,
	decodeAsBigInt,
	decodeAsNumber,
	decodeAsString,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {BASKET_ABI} from '@libAbi/basket.abi';
import {ONCHAIN_VOTE_WEIGHT_ABI} from '@libAbi/onchainVoteWeight.abi';
import {WEIGHT_INCENTIVE_ABI} from '@libAbi/weightIncentives.abi';
import {getBlockNumber, getClient, readContract, readContracts} from '@wagmi/core';
import {NO_CHANGE_LST_LIKE} from '@yETH/utils/constants';
import {getEpochEndBlock, getEpochStartBlock} from '@yETH/utils/epochs';

import type {TAddress, TDict, TNDict} from '@builtbymom/web3/types';
import type {TBasket, TBasketItem, TIncentives, TIndexedTokenInfo, TTokenIncentive} from '@libUtils/types';

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
	const [assets, set_assets] = useState<TIndexedTokenInfo[]>([]);
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

	const {data: epoch} = useReadContract({
		address: toAddress(process.env.WEIGHT_INCENTIVES_ADDRESS),
		abi: WEIGHT_INCENTIVE_ABI,
		functionName: 'epoch',
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		query: {
			select: (data): bigint => toBigInt(data)
		}
	});

	/**************************************************************************
	 * Retrieve the list of assets in the basket
	 *************************************************************************/
	const refreshAssets = useAsyncTrigger(async (): Promise<void> => {
		/**********************************************************************
		 * Then, we want to retrieve the number of assets in our yBasket. This
		 * will allow us to retrieve the address of each asset
		 *********************************************************************/
		const numAssets = await readContract(retrieveConfig(), {
			address: toAddress(process.env.BASKET_ADDRESS),
			abi: BASKET_ABI,
			functionName: 'num_assets',
			chainId: Number(process.env.DEFAULT_CHAIN_ID)
		});

		/**********************************************************************
		 * Once we have the number of assets, we can retrieve the list of
		 * addresses for each asset
		 *********************************************************************/
		const allAssets = await readContracts(retrieveConfig(), {
			contracts: Array.from({length: Number(numAssets)}, (_, i) => ({
				address: toAddress(process.env.BASKET_ADDRESS),
				abi: BASKET_ABI,
				functionName: 'assets',
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				args: [i]
			})) as any[]
		});

		/**********************************************************************
		 * Once we have the assets, we need to retrieve the information
		 * about the token added to built a proper TToken object. This includes
		 * at least the token name, symbol and decimals
		 *********************************************************************/
		const candidateAddresses = allAssets.map(candidate => decodeAsAddress(candidate));
		const tokens = await readContracts(retrieveConfig(), {
			contracts: [
				...candidateAddresses.map(candidate => ({
					address: toAddress(candidate),
					abi: erc20Abi,
					functionName: 'name',
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				})),
				...candidateAddresses.map(candidate => ({
					address: toAddress(candidate),
					abi: erc20Abi,
					functionName: 'symbol',
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				})),
				...candidateAddresses.map(candidate => ({
					address: toAddress(candidate),
					abi: erc20Abi,
					functionName: 'decimals',
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				}))
			] as any[]
		});

		/******************************************************************************************
		 * And now we can build the list of assets with the information
		 * we have retrieved
		 ******************************************************************************************/
		const assetsInBasket: TIndexedTokenInfo[] = [];
		for (let i = 0; i < candidateAddresses.length; i++) {
			const candidateName = decodeAsString(tokens[i]);
			const candidateSymbol = decodeAsString(tokens[i + candidateAddresses.length]);
			const candidateDecimals = decodeAsNumber(tokens[i + candidateAddresses.length * 2]);
			assetsInBasket.push({
				address: candidateAddresses[i],
				name: candidateName,
				symbol: candidateSymbol,
				decimals: candidateDecimals,
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				balance: toNormalizedBN(0n, candidateDecimals),
				value: 0,
				index: i + 1
			});
		}
		set_assets(assetsInBasket);
	}, []);

	const refreshBasket = useAsyncTrigger(async (): Promise<void> => {
		if (!assets.length) {
			return;
		}
		const data = await readContracts(retrieveConfig(), {
			contracts: [
				{
					address: toAddress(process.env.POOL_ADDRESS),
					abi: BASKET_ABI,
					functionName: 'supply',
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				},
				{
					address: toAddress(process.env.POOL_ADDRESS),
					abi: BASKET_ABI,
					functionName: 'vb_prod_sum',
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				},
				{
					address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
					abi: ONCHAIN_VOTE_WEIGHT_ABI,
					functionName: 'total_votes',
					args: [epoch],
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				},
				{
					address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
					abi: ONCHAIN_VOTE_WEIGHT_ABI,
					functionName: 'votes',
					args: [epoch, 0n],
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				},
				...assets
					.map((item, index): any => {
						return [
							{
								address: toAddress(process.env.POOL_ADDRESS),
								abi: BASKET_ABI,
								functionName: 'rate',
								args: [index],
								chainId: Number(process.env.DEFAULT_CHAIN_ID)
							},
							{
								address: toAddress(process.env.POOL_ADDRESS),
								abi: BASKET_ABI,
								functionName: 'weight',
								args: [index],
								chainId: Number(process.env.DEFAULT_CHAIN_ID)
							},
							{
								address: item.address,
								abi: erc20Abi,
								functionName: 'allowance',
								args: [toAddress(address), toAddress(process.env.POOL_ADDRESS)],
								chainId: Number(process.env.DEFAULT_CHAIN_ID)
							},
							{
								address: item.address,
								abi: erc20Abi,
								functionName: 'balanceOf',
								args: [toAddress(process.env.POOL_ADDRESS)],
								chainId: Number(process.env.DEFAULT_CHAIN_ID)
							},
							{
								address: toAddress(process.env.POOL_ADDRESS),
								abi: BASKET_ABI,
								functionName: 'virtual_balance',
								args: [index],
								chainId: Number(process.env.DEFAULT_CHAIN_ID)
							},
							{
								address: item.address,
								abi: erc20Abi,
								functionName: 'allowance',
								args: [toAddress(address), toAddress(process.env.ZAP_ADDRESS)],
								chainId: Number(process.env.DEFAULT_CHAIN_ID)
							},
							{
								address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
								abi: ONCHAIN_VOTE_WEIGHT_ABI,
								functionName: 'votes',
								args: [epoch, toBigInt(index + 1)],
								chainId: Number(process.env.DEFAULT_CHAIN_ID)
							}
						] as any[];
					})
					.flat()
			]
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
	}, [address, assets, epoch]);

	/**************************************************************************
	 * Once we have the list of candidates, it's possible for us to try to
	 * retrieve the list of incentives for each candidate
	 *************************************************************************/
	const refreshWeightIncentives = useCallback(
		async (_epoch: bigint): Promise<void> => {
			if (!assets.length) {
				return;
			}
			const rangeLimit = toBigInt(Number(process.env.RANGE_LIMIT));
			const epochStartBlock = getEpochStartBlock(Number(_epoch));
			const epochEndBlock = getEpochEndBlock(Number(_epoch));
			const currentBlock = await getBlockNumber(retrieveConfig());
			const checkUpToBlock = epochEndBlock < currentBlock ? epochEndBlock : currentBlock;
			const publicClient = getClient(retrieveConfig());

			type TDetectedIncentives = {
				amount: bigint;
				idx: bigint;
				depositor: TAddress;
				token: TAddress;
			};
			const detectedIncentives: TDetectedIncentives[] = [];
			if (publicClient) {
				for (let i = epochStartBlock; i < checkUpToBlock; i += rangeLimit) {
					const events = await getLogs(publicClient, {
						address: toAddress(process.env.WEIGHT_INCENTIVES_ADDRESS),
						event: WEIGHT_INCENTIVE_ABI[0],
						fromBlock: i,
						toBlock: i + rangeLimit,
						args: {
							epoch: _epoch
						}
					});
					for (const log of events) {
						detectedIncentives.push({
							amount: toBigInt(log.args.amount),
							idx: toBigInt(log.args.idx),
							depositor: toAddress(log.args.depositor),
							token: toAddress(log.args.token)
						});
					}
				}
			} else {
				console.error('No public client available');
			}

			/**********************************************************************
			 * Once we have all the incentives for the current epoch, we can assign
			 * them to the candidates. However, we first need to retrieve the
			 * information about the token added to built a proper TToken object.
			 * To avoid duplicate calls, we will build a map of unique token
			 * address
			 *********************************************************************/
			const tokensData = await readContracts(retrieveConfig(), {
				contracts: [
					...detectedIncentives.map(item => ({
						address: toAddress(item.token),
						abi: erc20Abi,
						functionName: 'name',
						chainId: Number(process.env.DEFAULT_CHAIN_ID)
					})),
					...detectedIncentives.map(item => ({
						address: toAddress(item.token),
						abi: erc20Abi,
						functionName: 'symbol',
						chainId: Number(process.env.DEFAULT_CHAIN_ID)
					})),
					...detectedIncentives.map(item => ({
						address: toAddress(item.token),
						abi: erc20Abi,
						functionName: 'decimals',
						chainId: Number(process.env.DEFAULT_CHAIN_ID)
					}))
				]
			});
			const assetsWithNoChange = [NO_CHANGE_LST_LIKE, ...assets];
			const byCandidate: TDict<TDict<TTokenIncentive[]>> = {};
			for (let i = 0; i < detectedIncentives.length; i++) {
				const {idx, token} = detectedIncentives[i];
				const candidate = assetsWithNoChange[Number(idx)].address;
				if (!byCandidate[candidate]) {
					byCandidate[candidate] = {};
				}
				if (!byCandidate[candidate][token]) {
					byCandidate[candidate][token] = [];
				}

				const tokenAddress = detectedIncentives[i].token;
				const tokenName = decodeAsString(tokensData[i]);
				const tokenSymbol = decodeAsString(tokensData[i + detectedIncentives.length]);
				const tokenDecimals = decodeAsNumber(tokensData[i + detectedIncentives.length * 2]);
				const amount = toNormalizedBN(detectedIncentives[i].amount, tokenDecimals);
				byCandidate[candidate][token].push({
					address: toAddress(tokenAddress),
					name: tokenName,
					symbol: tokenSymbol,
					decimals: tokenDecimals,
					chainID: Number(process.env.DEFAULT_CHAIN_ID),
					balance: zeroNormalizedBN,
					value: 0,
					depositor: detectedIncentives[i].depositor,
					amount
				});
			}

			set_areIncentivesLoaded(true);
			set_weightIncentives(byCandidate);
			set_pastWeightIncentives(prev => ({...prev, [Number(_epoch)]: {data: byCandidate, hasData: true}}));
		},
		[assets]
	);

	const triggerWeightIncentivesRefresh = useAsyncTrigger(async (): Promise<void> => {
		if (!epoch) {
			return;
		}
		await refreshWeightIncentives(epoch);

		//For the claim section, we need the previous epoch incentives
		refreshWeightIncentives(epoch - 1n);
		// refreshWeightIncentives(epoch - 2n);
		// refreshWeightIncentives(epoch - 3n);
		// refreshWeightIncentives(epoch - 4n);
		// refreshWeightIncentives(epoch - 5n);
	}, [epoch, refreshWeightIncentives]);

	/**************************************************************************
	 * getIncentivesForEpoch is a function that will retrieve the incentives
	 * for a given epoch.
	 *************************************************************************/
	const getIncentivesForEpoch = useCallback(
		(_epoch: bigint): {data: TIncentives; hasData: boolean} => {
			if (!pastWeightIncentives[Number(_epoch)]) {
				return {data: {}, hasData: false};
			}
			return pastWeightIncentives[Number(_epoch)];
		},
		[pastWeightIncentives]
	);

	console.warn({
		assets,
		basket,
		weightIncentives,
		currentVotesForNoChanges,
		areIncentivesLoaded,
		pastWeightIncentives
	});

	const contextValue = useMemo(
		(): TUseBasketProps => ({
			assets,
			basket,
			weightIncentives,
			getIncentivesForEpoch,
			refreshAssets,
			refreshBasket,
			refreshIncentives: triggerWeightIncentivesRefresh,
			refreshEpochIncentives: refreshWeightIncentives,
			isLoaded: basket.length > 0,
			areIncentivesLoaded,
			currentVotesForNoChanges,
			epoch
		}),
		[
			assets,
			basket,
			weightIncentives,
			getIncentivesForEpoch,
			refreshAssets,
			refreshBasket,
			triggerWeightIncentivesRefresh,
			refreshWeightIncentives,
			areIncentivesLoaded,
			currentVotesForNoChanges,
			epoch
		]
	);

	return <BasketContext.Provider value={contextValue}>{children}</BasketContext.Provider>;
};

const useBasket = (): TUseBasketProps => useContext(BasketContext);

export default useBasket;
