/* eslint-disable @typescript-eslint/consistent-type-assertions */

import React, {createContext, useContext, useMemo, useState} from 'react';
import {BASKET_ABI} from 'app/utils/abi/basket.abi';
import {WEIGHT_INCENTIVE_ABI} from 'app/utils/abi/weightIncentives.abi';
import {NO_CHANGE_LST_LIKE} from 'app/utils/constants';
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
import {getBlockNumber, getClient, readContract, readContracts} from '@wagmi/core';

import type {TBasket, TBasketItem, TIncentives, TIndexedTokenInfo, TTokenIncentive} from 'app/utils/types';
import type {TAddress, TDict} from '@builtbymom/web3/types';

type TUseBasketProps = {
	assets: TIndexedTokenInfo[];
	basket: TBasket;
	weightIncentives: TIncentives;
	refreshAssets: () => Promise<void>;
	refreshBasket: () => Promise<void>;
	refreshIncentives: () => Promise<void>;
	isLoaded: boolean;
	areIncentivesLoaded: boolean;
};
const defaultProps: TUseBasketProps = {
	assets: [],
	basket: [],
	weightIncentives: {},
	refreshAssets: async (): Promise<void> => undefined,
	refreshBasket: async (): Promise<void> => undefined,
	refreshIncentives: async (): Promise<void> => undefined,
	isLoaded: false,
	areIncentivesLoaded: false
};

const BasketContext = createContext<TUseBasketProps>(defaultProps);
export const BasketContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const {address} = useWeb3();
	const [assets, set_assets] = useState<TIndexedTokenInfo[]>([]);
	const [basket, set_basket] = useState<TBasket>([]);
	const [weightIncentives, set_weightIncentives] = useState<TIncentives>({});
	const [areIncentivesLoaded, set_areIncentivesLoaded] = useState(false);

	const {data: epoch} = useReadContract({
		address: toAddress(process.env.WEIGHT_INCENTIVES_ADDRESS),
		abi: WEIGHT_INCENTIVE_ABI,
		functionName: 'epoch',
		chainId: Number(process.env.DEFAULT_CHAIN_ID)
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

		/**********************************************************************
		 * And now we can build the list of assets with the information
		 * we have retrieved
		 *********************************************************************/
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
				price: toNormalizedBN(0n, 18),
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
							}
						] as any[];
					})
					.flat()
			]
		});

		let idx = 0;
		const supply = toNormalizedBN(decodeAsBigInt(data[idx++]), 18);
		const vbSum = toNormalizedBN(toBigInt((data[idx++]?.result as [bigint, bigint])?.[1] as bigint) || 0n, 18);
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
	const refreshWeightIncentives = useAsyncTrigger(async (): Promise<void> => {
		if (!epoch) return;
		if (!assets.length) return;
		const rangeLimit = 800n;
		const epochStartBlock = 19439849n; //getEpochStartBlock(Number(epoch));
		const epochEndBlock = 19439851n; //getEpochEndBlock(Number(epoch));
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
						epoch: epoch
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
			if (!byCandidate[candidate]) byCandidate[candidate] = {};
			if (!byCandidate[candidate][token]) byCandidate[candidate][token] = [];

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
				price: zeroNormalizedBN,
				value: 0,
				depositor: detectedIncentives[i].depositor,
				amount
			});
		}

		set_areIncentivesLoaded(true);
		set_weightIncentives(byCandidate);
	}, [assets, epoch]);

	const contextValue = useMemo(
		(): TUseBasketProps => ({
			assets,
			basket,
			weightIncentives,
			refreshAssets,
			refreshBasket,
			refreshIncentives: refreshWeightIncentives,
			isLoaded: basket.length > 0,
			areIncentivesLoaded
		}),
		[assets, basket, refreshAssets, refreshBasket, refreshWeightIncentives, weightIncentives, areIncentivesLoaded]
	);

	return <BasketContext.Provider value={contextValue}>{children}</BasketContext.Provider>;
};

const useBasket = (): TUseBasketProps => useContext(BasketContext);
export default useBasket;
