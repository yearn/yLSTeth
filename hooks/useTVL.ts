import {useMemo} from 'react';
import {YETH_POOL_ABI} from 'utils/abi/yETHPool.abi';
import {yDaemonPricesSchema} from 'utils/schemas/yDaemonPricesSchema';
import {YETH_TOKEN} from 'utils/tokens';
import {useContractRead} from 'wagmi';
import {useFetch} from '@builtbymom/web3/hooks/useFetch';
import {toAddress, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {useYDaemonBaseURI} from '@yearn-finance/web-lib/hooks/useYDaemonBaseURI';

import type {TYDaemonPrices} from 'utils/schemas/yDaemonPricesSchema';
import type {TNormalizedBN} from '@builtbymom/web3/types';

function useTVL(): {TVL: number; TAL: TNormalizedBN} {
	const {yDaemonBaseUri} = useYDaemonBaseURI({chainID: Number(process.env.BASE_CHAIN_ID)});
	const {data: prices} = useFetch<TYDaemonPrices>({
		endpoint: `${yDaemonBaseUri}/prices/some/${toAddress(process.env.YETH_ADDRESS)}?humanized=true`,
		schema: yDaemonPricesSchema
	});

	const {data} = useContractRead({
		address: toAddress(process.env.POOL_ADDRESS),
		abi: YETH_POOL_ABI,
		functionName: 'vb_prod_sum'
	});

	const totalValueLocked = useMemo((): {TVL: number; TAL: TNormalizedBN} => {
		if (!data || !prices) {
			return {TVL: 0, TAL: zeroNormalizedBN};
		}

		const [, value] = data;
		const _value = toNormalizedBN(value, 18);
		return {TVL: Number(_value.normalized) * Number(prices[YETH_TOKEN.address]), TAL: _value};
	}, [data, prices]);

	return totalValueLocked;
}

export default useTVL;
