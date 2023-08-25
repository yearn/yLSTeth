import {useState} from 'react';
import {YETH_POOL_ABI} from 'utils/abi/yETHPool.abi';
import {LST} from 'utils/constants';
import {erc20ABI, useContractReads} from 'wagmi';
import {useUpdateEffect} from '@react-hookz/web';
import useWeb3 from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

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

function useLSTData(): {lst: TLST[], updateLST: () => void} {
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
			...LST.map((_, index) => ({
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'rate',
				args: [index],
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			})),
			// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
			...LST.map((_, index) => ({
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
			const vbSum = toNormalizedBN(toBigInt((data?.[26]?.result as [bigint, bigint])?.[1] as bigint) || 0n);

			// console.warn(vb, vbSum, data?.[index + 26]);
			return ({
				...token,
				index,
				rate,
				weight,
				targetWeight,
				weightRatio: Number(virtualBalance.normalized) / Number(vbSum.normalized),
				poolAllowance: allowances,
				poolSupply: lstSupply,
				virtualPoolSupply: toNormalizedBN(virtualBalance.raw * toBigInt(1e18) / supply.raw * 100n)
			});
		});
		set_lst(_lst);
	}, [data, isFetched]);

	return {lst, updateLST: refetch};
}

export default useLSTData;
