import {ETH_TOKEN_ADDRESS, toAddress, ZERO_ADDRESS, zeroNormalizedBN} from '@builtbymom/web3/utils';

import type {TToken} from '@builtbymom/web3/types';

export const NONE_TOKEN: TToken = {
	address: toAddress(ZERO_ADDRESS),
	chainID: Number(process.env.DEFAULT_CHAIN_ID),
	name: 'Unknow',
	symbol: 'N/A',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${ETH_TOKEN_ADDRESS}/logo-128.png`,
	value: 0,
	balance: zeroNormalizedBN
};

export const ETH_TOKEN: TToken = {
	address: toAddress(ETH_TOKEN_ADDRESS),
	chainID: Number(process.env.DEFAULT_CHAIN_ID),
	name: 'Ether',
	symbol: 'ETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${ETH_TOKEN_ADDRESS}/logo-128.png`,
	value: 0,
	balance: zeroNormalizedBN
};
export const STYUSD_TOKEN: TToken = {
	address: toAddress(process.env.STYUSD_ADDRESS),
	chainID: Number(process.env.DEFAULT_CHAIN_ID),
	name: 'Staked Yearn ETH',
	symbol: 'st-yETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${process.env.STYUSD_ADDRESS}/logo-128.png`,
	value: 0,
	balance: zeroNormalizedBN
};
export const YUSD_TOKEN: TToken = {
	address: toAddress(process.env.YUSD_ADDRESS),
	chainID: Number(process.env.DEFAULT_CHAIN_ID),
	name: 'Yearn ETH',
	symbol: 'yETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${process.env.YUSD_ADDRESS}/logo-128.png`,
	value: 0,
	balance: zeroNormalizedBN
};
