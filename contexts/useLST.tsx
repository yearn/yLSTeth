/* eslint-disable @typescript-eslint/consistent-type-assertions */

import React, {createContext, useContext, useMemo, useState} from 'react';
import useIncentives from 'hooks/useIncentives';
import useLSTData from 'hooks/useLSTData';
import useTVL from 'hooks/useTVL';
import {YETH_POOL_ABI} from 'utils/abi/yETHPool.abi';
import {useContractReads} from 'wagmi';
import {toAddress, toBigInt, zeroNormalizedBN} from '@builtbymom/web3/utils';

import type {TIncentivesFor, TUseIncentivesResp} from 'hooks/useIncentives';
import type {TLST} from 'hooks/useLSTData';
import type {TNormalizedBN} from '@builtbymom/web3/types';

type TUseLSTProps = {
	slippage: bigint;
	set_slippage: (value: bigint) => void;
	dailyVolume: number;
	TVL: number;
	TAL: TNormalizedBN;
	lst: TLST[];
	stats: {
		amplification: bigint;
		rampStopTime: bigint;
		targetAmplification: bigint;
		swapFeeRate: bigint;
	};
	onUpdateLST: () => void;
	incentives: TUseIncentivesResp;
};
const defaultProps: TUseLSTProps = {
	slippage: 50n,
	set_slippage: (): void => {},
	dailyVolume: 0,
	TVL: 0,
	TAL: zeroNormalizedBN,
	lst: [] as unknown as TLST[],
	onUpdateLST: (): void => {},
	stats: {
		amplification: toBigInt(0),
		rampStopTime: toBigInt(0),
		targetAmplification: toBigInt(0),
		swapFeeRate: toBigInt(0)
	},
	incentives: {
		groupIncentiveHistory: {} as TIncentivesFor,
		isFetchingHistory: false,
		refreshIncentives: (): void => undefined,
		totalDepositedETH: zeroNormalizedBN,
		totalDepositedUSD: 0
	}
};

const LSTContext = createContext<TUseLSTProps>(defaultProps);
export const LSTContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const [slippage, set_slippage] = useState(10n);
	const {lst, updateLST} = useLSTData();
	// const dailyVolume = useDailyVolume();
	const {TVL, TAL} = useTVL();
	const incentives = useIncentives();

	const {data: stats, isFetched: areStatsFetched} = useContractReads({
		contracts: [
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'amplification',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			},
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'ramp_stop_time',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			},
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'target_amplification',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			},
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'swap_fee_rate',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			}
		]
	});

	const contextValue = useMemo(
		(): TUseLSTProps => ({
			slippage,
			set_slippage,
			dailyVolume: 0,
			lst,
			TVL,
			TAL,
			stats: areStatsFetched
				? {
						amplification: toBigInt(stats?.[0]?.result as bigint),
						rampStopTime: toBigInt(stats?.[1]?.result as bigint),
						targetAmplification: toBigInt(stats?.[2]?.result as bigint),
						swapFeeRate: toBigInt(stats?.[3]?.result as bigint)
					}
				: defaultProps.stats,
			onUpdateLST: updateLST,
			incentives
		}),
		[slippage, lst, TVL, TAL, areStatsFetched, stats, updateLST, incentives]
	);

	return <LSTContext.Provider value={contextValue}>{children}</LSTContext.Provider>;
};

const useLST = (): TUseLSTProps => useContext(LSTContext);
export default useLST;
