import {useMemo} from 'react';
import {useFetch} from 'app/hooks/useFetch';
import {YETH_TOKEN} from 'app/tokens';
import {BASKET_ABI} from 'app/utils/abi/basket.abi';
import {yDaemonPricesSchema} from 'app/utils/types';
import {useReadContract} from 'wagmi';
import {toAddress, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {useYDaemonBaseURI} from '@yearn-finance/web-lib/hooks/useYDaemonBaseURI';

import type {TYDaemonPrices} from 'app/utils/types';
import type {TNormalizedBN} from '@builtbymom/web3/types';

export type TTVLData = {TVL: number; TAL: TNormalizedBN; isLoaded: boolean};
function useTVL(): TTVLData {
	const {yDaemonBaseUri} = useYDaemonBaseURI({chainID: Number(process.env.DEFAULT_CHAIN_ID)});
	const {data: prices} = useFetch<TYDaemonPrices>({
		endpoint: `${yDaemonBaseUri}/prices/some/${toAddress(process.env.YETH_ADDRESS)}?humanized=true`,
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
		return {TVL: Number(_value.normalized) * Number(prices[YETH_TOKEN.address]), TAL: _value, isLoaded: true};
	}, [data, prices]);

	return totalValueLocked;
}

export default useTVL;
