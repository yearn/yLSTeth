import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import axios from 'axios';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';

import type {TAddress, TDict, TNDict} from '@yearn-finance/web-lib/types';


const GECKO_CHAIN_NAMES: TNDict<string> = {
	1:     'ethereum',
	10:    'optimistic-ethereum',
	56:    'binance-smart-chain',
	100:   'xdai',
	137:   'polygon-pos',
	250:   'fantom',
	42161: 'arbitrum-one'
};

const NATIVE_WRAPPER_COINS: TNDict<TAddress> = {
	1: toAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
	10: toAddress('0x4200000000000000000000000000000000000006'),
	56: toAddress('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'),
	100: toAddress('0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'),
	137: toAddress('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'),
	250: toAddress('0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83'),
	42161: toAddress('0x82aF49447D8a07e3bd95BD0d56f35241523fBab1')
};


export type TUsePriceProps = {prices: TNDict<TDict<number>>}
const defaultProps: TUsePriceProps = {prices: {}};
const Price = createContext<TUsePriceProps>(defaultProps);
export const PriceContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const {safeChainID} = useChainID(Number(process.env.BASE_CHAINID));
	const [prices, set_prices] = useState<TNDict<TDict<number>>>({});

	const onRefreshPrice = useCallback(async (): Promise<void> => {
		const tokenAddress = NATIVE_WRAPPER_COINS[safeChainID];

		const response = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${GECKO_CHAIN_NAMES[safeChainID] || 'ethereum'}?contract_addresses=${tokenAddress}&vs_currencies=usd&precision=6`);
		set_prices((prev): TNDict<TDict<number>> => {
			const	newPrice = {...prev};
			if (!newPrice[safeChainID]) {
				newPrice[safeChainID] = {};
			}
			newPrice[safeChainID][ETH_TOKEN_ADDRESS] = Number(response?.data?.[toAddress(tokenAddress).toLowerCase()]?.usd || 0);
			return newPrice;
		});
	}, [safeChainID]);

	useEffect((): void => {
		onRefreshPrice();
	}, [onRefreshPrice]);

	const	contextValue = useMemo((): TUsePriceProps => ({
		prices
	}), [prices]);

	return (
		<Price.Provider value={contextValue}>
			{children}
		</Price.Provider>
	);
};


const usePrices = (): TUsePriceProps => useContext(Price);
export default usePrices;
