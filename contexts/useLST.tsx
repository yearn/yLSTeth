import React, {createContext, useContext, useMemo, useState} from 'react';
import {YETH_POOL_ABI} from 'utils/abi/yETHPool.abi';
import {LST} from 'utils/constants';
import {erc20ABI, useContractReads} from 'wagmi';
import {useUpdateEffect} from '@react-hookz/web';
import useWeb3 from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTokenInfo} from './useTokenList';

export type TLST = {
	rate: TNormalizedBN,
	weight: TNormalizedBN,
	targetWeight: TNormalizedBN,
	poolAllowance: TNormalizedBN,
	poolSupply: TNormalizedBN,
	virtualPoolSupply: TNormalizedBN,
	weightRatio: number,
	index: number
} & TTokenInfo

export type TUseLSTProps = {
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
	const {address} = useWeb3();
	const [lst, set_lst] = useState(LST.map((token, index): TLST => ({
		...token,
		rate: toNormalizedBN(0),
		weight: toNormalizedBN(0),
		targetWeight: toNormalizedBN(0),
		poolAllowance: toNormalizedBN(0),
		poolSupply: toNormalizedBN(0),
		virtualPoolSupply: toNormalizedBN(0),
		weightRatio: 0,
		index
	})));

	const {data, refetch, isFetched} = useContractReads({
		contracts: [
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'supply',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			},
			// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
			...[0n, 1n, 2n, 3n, 4n].map((index) => ({
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'rate',
				args: [index],
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			})),
			// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
			...[0n, 1n, 2n, 3n, 4n].map((index) => ({
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'weight',
				args: [index],
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			})),
			// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
			...LST.map((item) => ({
				address: item.address,
				abi: erc20ABI,
				functionName: 'allowance',
				args: [address, toAddress(process.env.POOL_ADDRESS)],
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			})) as never[],
			// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
			...LST.map((item) => ({
				address: item.address,
				abi: erc20ABI,
				functionName: 'balanceOf',
				args: [toAddress(process.env.POOL_ADDRESS)],
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			})),
			// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
			...LST.map((_, index) => ({
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'virtual_balance',
				args: [index],
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			})),
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'vb_prod_sum',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			}
		]
	});


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

	useUpdateEffect((): void => {
		if (!isFetched) {
			return;
		}
		const _lst = LST.map((token, index): TLST => {
			const supply = toNormalizedBN(toBigInt(data?.[0]?.result as bigint || 0n));
			const rate = toNormalizedBN(toBigInt(data?.[index + 1]?.result as bigint) || 0n);
			const weight = toNormalizedBN(toBigInt((data?.[index + 6]?.result as [bigint, bigint, bigint, bigint])?.[0] as bigint) || 0n);
			const targetWeight = toNormalizedBN(toBigInt((data?.[index + 6]?.result as [bigint, bigint, bigint, bigint])?.[1] as bigint) || 0n);
			const allowances = toNormalizedBN(toBigInt(data?.[index + 11]?.result as bigint) || 0n);
			const lstSupply = toNormalizedBN(toBigInt(data?.[index + 16]?.result as bigint) || 0n);
			const virtualBalance = toNormalizedBN(toBigInt(data?.[index + 21]?.result as bigint) || 0n);
			const vbProdSum = toNormalizedBN(toBigInt((data?.[26]?.result as [bigint, bigint])?.[0] as bigint) || 0n);

			return ({
				...token,
				index,
				rate,
				weight,
				targetWeight,
				weightRatio: Number(weight.normalized) / Number(supply.normalized) * 100,
				poolAllowance: allowances,
				poolSupply: lstSupply,
				virtualPoolSupply: toNormalizedBN(virtualBalance.raw * toBigInt(1e18) / (vbProdSum.raw || 1n))
			});
		});
		set_lst(_lst);
	}, [data, isFetched]);

	const contextValue = useMemo((): TUseLSTProps => ({
		lst,
		stats: areStatsFetched ? {
			amplification: toBigInt(stats?.[0]?.result as bigint),
			rampStopTime: toBigInt(stats?.[1]?.result as bigint),
			targetAmplification: toBigInt(stats?.[2]?.result as bigint),
			swapFeeRate: toBigInt(stats?.[3]?.result as bigint)
		} : defaultProps.stats,
		onUpdateLST: refetch
	}), [lst, stats, areStatsFetched, refetch]);

	return (
		<LSTContext.Provider value={contextValue}>
			{children}
		</LSTContext.Provider>
	);
};


const useLST = (): TUseLSTProps => useContext(LSTContext);
export default useLST;
