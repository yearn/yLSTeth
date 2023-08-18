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
	poolAllowance: TNormalizedBN,
	weightRatio: number,
	index: number
} & TTokenInfo

export type TUseLSTProps = {
	lst: TLST[],
	onUpdateLST: () => void
}
const defaultProps: TUseLSTProps = {
	lst: [] as unknown as TLST[],
	onUpdateLST: (): void => {}
};

const LSTContext = createContext<TUseLSTProps>(defaultProps);
export const LSTContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const {address} = useWeb3();
	const [lst, set_lst] = useState(LST.map((token, index): TLST => ({
		...token,
		rate: toNormalizedBN(0),
		weight: toNormalizedBN(0),
		poolAllowance: toNormalizedBN(0),
		weightRatio: 0,
		index
	})));

	const {data, refetch, isFetched} = useContractReads({
		contracts: [
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'supply',
				chainId: 1337
			},
			// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
			...[0n, 1n, 2n, 3n, 4n].map((index) => ({
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'rate',
				args: [index],
				chainId: 1337
			})),
			// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
			...[0n, 1n, 2n, 3n, 4n].map((index) => ({
				address: toAddress(process.env.POOL_ADDRESS),
				abi: YETH_POOL_ABI,
				functionName: 'weight',
				args: [index],
				chainId: 1337
			})),
			// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
			...LST.map((item) => ({
				address: item.address,
				abi: erc20ABI,
				functionName: 'allowance',
				args: [address, toAddress(process.env.POOL_ADDRESS)],
				chainId: 1337
			})) as never[]
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
			const allowances = toNormalizedBN(toBigInt(data?.[index + 11]?.result as bigint) || 0n);

			return ({
				...token,
				index,
				rate,
				weight,
				weightRatio: Number(weight.normalized) / Number(supply.normalized) * 100,
				poolAllowance: allowances
			});
		});
		set_lst(_lst);
	}, [data, isFetched]);


	const contextValue = useMemo((): TUseLSTProps => ({
		lst,
		onUpdateLST: refetch
	}), [lst, refetch]);

	return (
		<LSTContext.Provider value={contextValue}>
			{children}
		</LSTContext.Provider>
	);
};


const useLST = (): TUseLSTProps => useContext(LSTContext);
export default useLST;
