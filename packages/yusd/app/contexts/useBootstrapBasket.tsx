/* eslint-disable @typescript-eslint/consistent-type-assertions */

import React, {createContext, useContext, useMemo, useState} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {decodeAsBigInt, toAddress, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {createUniqueID} from '@builtbymom/web3/utils/tools.identifier';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import BOOTSTRAP_ABI_NEW from '@libAbi/bootstrap.abi.new';
import {acknowledge} from '@libUtils/helpers';
import {readContracts, serialize} from '@wagmi/core';
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

const BootstrapBasketContext = createContext<TUseBasketProps>(defaultProps);
export const BootstrapBasketContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
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

	/**********************************************************************************************
	 ** assets is an object with multiple level of depth. We want to create a unique hash from
	 ** it to know when it changes. This new hash will be used to trigger the useEffect hook.
	 ** We will use classic hash function to create a hash from the assets object.
	 *********************************************************************************************/
	const assetsHash = useMemo(() => {
		acknowledge(assets);
		const hash = createUniqueID(serialize(assets));
		return hash;
	}, [assets]);

	const refreshBasket = useAsyncTrigger(async (): Promise<void> => {
		if (!assets.length) {
			return;
		}
		acknowledge(assetsHash);
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
	}, [address, assets, assetsHash]);

	return <BootstrapBasketContext.Provider value={{assets}}>{children}</BootstrapBasketContext.Provider>;
};

const useBootstrapBasket = (): TUseBasketProps => useContext(BootstrapBasketContext);
export default useBootstrapBasket;
