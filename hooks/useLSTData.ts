import {useState} from 'react';
import {YETH_POOL_ABI} from 'utils/abi/yETHPool.abi';
import {LST} from 'utils/constants';
import {erc20ABI, useContractReads} from 'wagmi';
import {useUpdateEffect} from '@react-hookz/web';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {decodeAsBigInt} from '@yearn-finance/web-lib/utils/decoder';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

export type TLST = {
	rate: TNormalizedBN;
	weight: TNormalizedBN;
	targetWeight: TNormalizedBN;
	poolAllowance: TNormalizedBN;
	zapAllowance: TNormalizedBN;
	poolSupply: TNormalizedBN;
	virtualPoolSupply: TNormalizedBN;
	weightRatio: number;
	index: number;
	poolStats?: {
		amountInPool: TNormalizedBN;
		amountInPoolPercent: number;
		currentBeaconEquivalentValue: TNormalizedBN;
		targetWeight: TNormalizedBN;
		currentEquilibrumWeight: TNormalizedBN;
		currentBandPlus: TNormalizedBN;
		currentBandMin: TNormalizedBN;
		distanceFromTarget: number;
		weightRamps: TNormalizedBN;
	};
} & TTokenInfo;

function useLSTData(): {lst: TLST[]; updateLST: () => void} {
	const {address} = useWeb3();
	const [lst, set_lst] = useState(
		LST.map(
			(token, index): TLST => ({
				...token,
				rate: toNormalizedBN(0),
				weight: toNormalizedBN(0),
				targetWeight: toNormalizedBN(0),
				poolAllowance: toNormalizedBN(0),
				zapAllowance: toNormalizedBN(0),
				poolSupply: toNormalizedBN(0),
				virtualPoolSupply: toNormalizedBN(0),
				weightRatio: 0,
				index
			})
		)
	);

	const {data, refetch, isFetched} = useContractReads({
		contracts: [
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'supply',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			},
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'vb_prod_sum',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			},
			...LST.map((item, index): any => {
				return [
					{
						address: toAddress(process.env.POOL_ADDRESS),
						abi: YETH_POOL_ABI,
						functionName: 'rate',
						args: [index],
						chainId: Number(process.env.DEFAULT_CHAIN_ID)
					},
					{
						address: toAddress(process.env.POOL_ADDRESS),
						abi: YETH_POOL_ABI,
						functionName: 'weight',
						args: [index],
						chainId: Number(process.env.DEFAULT_CHAIN_ID)
					},
					{
						address: item.address,
						abi: erc20ABI,
						functionName: 'allowance',
						args: [address, toAddress(process.env.POOL_ADDRESS)],
						chainId: Number(process.env.DEFAULT_CHAIN_ID)
					},
					{
						address: item.address,
						abi: erc20ABI,
						functionName: 'balanceOf',
						args: [toAddress(process.env.POOL_ADDRESS)],
						chainId: Number(process.env.DEFAULT_CHAIN_ID)
					},
					{
						address: toAddress(process.env.POOL_ADDRESS),
						abi: YETH_POOL_ABI,
						functionName: 'virtual_balance',
						args: [index],
						chainId: Number(process.env.DEFAULT_CHAIN_ID)
					},
					{
						address: item.address,
						abi: erc20ABI,
						functionName: 'allowance',
						args: [address, toAddress(process.env.ZAP_ADDRESS)],
						chainId: Number(process.env.DEFAULT_CHAIN_ID)
					}
				] as any[];
			}).flat()
		]
	});

	useUpdateEffect((): void => {
		if (!isFetched || !data) {
			return;
		}
		let idx = 0;
		const supply = toNormalizedBN(decodeAsBigInt(data[idx++]));
		const vbSum = toNormalizedBN(toBigInt((data[idx++]?.result as [bigint, bigint])?.[1] as bigint) || 0n);

		const _lst = LST.map((token, index): TLST => {
			const rate = toNormalizedBN(toBigInt(data?.[idx++]?.result as bigint) || 0n);

			const weight = toNormalizedBN(toBigInt((data?.[idx]?.result as bigint[])?.[0] as bigint) || 0n);
			const targetWeight = toNormalizedBN(toBigInt((data?.[idx]?.result as bigint[])?.[1] as bigint) || 0n);
			const currentBandPlus = toNormalizedBN(toBigInt((data?.[idx]?.result as bigint[])?.[2] as bigint) || 0n);
			const currentBandMin = toNormalizedBN(toBigInt((data?.[idx++]?.result as bigint[])?.[3] as bigint) || 0n);

			const poolAllowance = toNormalizedBN(toBigInt(data?.[idx++]?.result as bigint) || 0n);
			const lstSupply = toNormalizedBN(toBigInt(data?.[idx++]?.result as bigint) || 0n);

			const virtualBalance = toNormalizedBN(toBigInt(data?.[idx++]?.result as bigint) || 0n);
			const zapAllowance = toNormalizedBN(toBigInt(data?.[idx++]?.result as bigint) || 0n);

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
				virtualPoolSupply: toNormalizedBN(((virtualBalance.raw * toBigInt(1e18)) / (supply.raw || 1n)) * 100n),
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
		set_lst(_lst);
	}, [data, isFetched]);

	return {lst, updateLST: refetch};
}

export default useLSTData;
