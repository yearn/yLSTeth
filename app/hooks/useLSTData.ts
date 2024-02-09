import {useState} from 'react';
import {YETH_POOL_ABI} from 'app/utils/abi/yETHPool.abi';
import {LST} from 'app/utils/constants';
import {erc20ABI, useContractReads} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {decodeAsBigInt, toAddress, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {useUpdateEffect} from '@react-hookz/web';

import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

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
} & TToken;

function useLSTData(): {lst: TLST[]; updateLST: () => void} {
	const {address} = useWeb3();
	const [lst, set_lst] = useState(
		LST.map(
			(token, index): TLST => ({
				...token,
				rate: zeroNormalizedBN,
				weight: zeroNormalizedBN,
				targetWeight: zeroNormalizedBN,
				poolAllowance: zeroNormalizedBN,
				zapAllowance: zeroNormalizedBN,
				poolSupply: zeroNormalizedBN,
				virtualPoolSupply: zeroNormalizedBN,
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
		const supply = toNormalizedBN(decodeAsBigInt(data[idx++]), 18);
		const vbSum = toNormalizedBN(toBigInt((data[idx++]?.result as [bigint, bigint])?.[1] as bigint) || 0n, 18);

		const _lst = LST.map((token, index): TLST => {
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
		set_lst(_lst);
	}, [data, isFetched]);

	return {lst, updateLST: refetch};
}

export default useLSTData;
