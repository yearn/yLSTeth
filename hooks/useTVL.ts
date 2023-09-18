import {useMemo} from 'react';
import {YETH_POOL_ABI} from 'utils/abi/yETHPool.abi';
import {yDaemonPricesSchema} from 'utils/schemas/yDaemonPricesSchema';
import {YETH_TOKEN} from 'utils/tokens';
import {useContractRead} from 'wagmi';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

import {useFetch} from './useFetch';
import {useYDaemonBaseURI} from './useYDaemonBaseURI';

import type {TYDaemonPrices} from 'utils/schemas/yDaemonPricesSchema';

function useTVL(): number {
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

	const totalValueLocked = useMemo((): number => {
		if (!data || !prices) {
			return 0;
		}
		const [, value] = data;
		const _value = toNormalizedBN(value);
		return Number(_value.normalized) * Number(prices[YETH_TOKEN.address]);
	}, [data, prices]);

	return (totalValueLocked);
}

export default useTVL;
