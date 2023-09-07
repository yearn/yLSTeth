import React, {createContext, useContext, useMemo, useState} from 'react';
import useDailyVolume from 'hooks/useDailyVolume';
import useLSTData from 'hooks/useLSTData';
import {YETH_POOL_ABI} from 'utils/abi/yETHPool.abi';
import {useContractReads} from 'wagmi';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';

import type {TLST} from 'hooks/useLSTData';

type TUseLSTProps = {
	slippage: bigint
	set_slippage: (value: bigint) => void
	dailyVolume: number
	lst: TLST[],
	stats: {
		amplification: bigint
		rampStopTime: bigint
		targetAmplification: bigint
		swapFeeRate: bigint
	}
	onUpdateLST: () => void
}
const defaultProps: TUseLSTProps = {
	slippage: 50n,
	set_slippage: (): void => {},
	dailyVolume: 0,
	lst: [] as unknown as TLST[],
	stats: {
		amplification: toBigInt(0),
		rampStopTime: toBigInt(0),
		targetAmplification: toBigInt(0),
		swapFeeRate: toBigInt(0)
	},
	onUpdateLST: (): void => {}
};

const LSTContext = createContext<TUseLSTProps>(defaultProps);
export const LSTContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const [slippage, set_slippage] = useState(50n);
	const {lst, updateLST} = useLSTData();
	const dailyVolume = useDailyVolume();

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

	const contextValue = useMemo((): TUseLSTProps => ({
		slippage,
		set_slippage,
		dailyVolume,
		lst,
		stats: areStatsFetched ? {
			amplification: toBigInt(stats?.[0]?.result as bigint),
			rampStopTime: toBigInt(stats?.[1]?.result as bigint),
			targetAmplification: toBigInt(stats?.[2]?.result as bigint),
			swapFeeRate: toBigInt(stats?.[3]?.result as bigint)
		} : defaultProps.stats,
		onUpdateLST: updateLST
	}), [lst, stats, areStatsFetched, updateLST, slippage, dailyVolume]);

	return (
		<LSTContext.Provider value={contextValue}>
			{children}
		</LSTContext.Provider>
	);
};


const useLST = (): TUseLSTProps => useContext(LSTContext);
export default useLST;
