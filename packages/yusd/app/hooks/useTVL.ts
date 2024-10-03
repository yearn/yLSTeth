import {useMemo} from 'react';
import {useReadContract} from 'wagmi';
import {toAddress, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {BASKET_ABI} from '@libAbi/basket.abi';
import {useFetch} from '@libHooks/useFetch';
import {yDaemonPricesSchema} from '@libUtils/types';
import {useYDaemonBaseURI} from '@yearn-finance/web-lib/hooks/useYDaemonBaseURI';
import {YUSD_TOKEN} from '@yUSD/tokens';

import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonPrices} from '@libUtils/types';

export type TTVLData = {TVL: number; TAL: TNormalizedBN; isLoaded: boolean};
function useTVL(): TTVLData {
	const {yDaemonBaseUri} = useYDaemonBaseURI({chainID: Number(process.env.DEFAULT_CHAIN_ID)});
	const {data: prices} = useFetch<TYDaemonPrices>({
		endpoint: `${yDaemonBaseUri}/prices/some/${toAddress(process.env.YUSD_ADDRESS)}?humanized=true`,
		schema: yDaemonPricesSchema
	});

	const {data} = useReadContract({
		address: toAddress(process.env.POOL_ADDRESS),
		abi: BASKET_ABI,
		functionName: 'vb_prod_sum'
	});

	const totalValueLocked = useMemo((): TTVLData => {
		if (!data || !prices) {
			return {TVL: 0, TAL: zeroNormalizedBN, isLoaded: false};
		}

		const [, value] = data;
		const _value = toNormalizedBN(value, 18);
		return {TVL: Number(_value.normalized) * Number(prices[YUSD_TOKEN.address]), TAL: _value, isLoaded: true};
	}, [data, prices]);

	return totalValueLocked;
}

export default useTVL;
