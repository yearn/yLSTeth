import React, {createContext, useCallback, useContext} from 'react';
import {toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {useFetch} from '@libHooks/useFetch';
import {yDaemonPricesSchema} from '@libUtils/types';
import {useYDaemonBaseURI} from '@yearn-finance/web-lib/hooks/useYDaemonBaseURI';

import type {TYDaemonPrices} from '@yearn-finance/web-lib/utils/schemas/yDaemonPricesSchema';
import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';

type TWithAddress = {address: TAddress};
export type TContext = {
	getPrice: (props: TWithAddress) => TNormalizedBN;
};

const defaultProps: TContext = {
	getPrice: () => zeroNormalizedBN
};

const PriceContext = createContext<TContext>(defaultProps);
export const PriceContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const {yDaemonBaseUri} = useYDaemonBaseURI({chainID: Number(process.env.DEFAULT_CHAIN_ID)});
	const {data: prices} = useFetch<TYDaemonPrices>({
		endpoint: `${yDaemonBaseUri}/prices/all`,
		schema: yDaemonPricesSchema
	});

	const getPrice = useCallback(
		({address}: TWithAddress): TNormalizedBN => {
			return toNormalizedBN(prices?.[address] || 0, 6) || zeroNormalizedBN;
		},
		[prices]
	);

	return <PriceContext.Provider value={{getPrice}}>{children}</PriceContext.Provider>;
};

export const usePrices = (): TContext => useContext(PriceContext);
