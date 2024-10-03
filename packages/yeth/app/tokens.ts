import {ETH_TOKEN_ADDRESS, toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';

import type {TToken} from '@builtbymom/web3/types';

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
export const STYETH_TOKEN: TToken = {
	address: toAddress(process.env.STYETH_ADDRESS),
	chainID: Number(process.env.DEFAULT_CHAIN_ID),
	name: 'Staked Yearn ETH',
	symbol: 'st-yETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${process.env.STYETH_ADDRESS}/logo-128.png`,
	value: 0,
	balance: zeroNormalizedBN
};
export const YETH_TOKEN: TToken = {
	address: toAddress(process.env.YETH_ADDRESS),
	chainID: Number(process.env.DEFAULT_CHAIN_ID),
	name: 'Yearn ETH',
	symbol: 'yETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${process.env.YETH_ADDRESS}/logo-128.png`,
	value: 0,
	balance: zeroNormalizedBN
};
