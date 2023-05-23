import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';

import type {TTokenInfo} from 'contexts/useTokenList';

export const ETH_TOKEN: TTokenInfo = {
	address: toAddress(ETH_TOKEN_ADDRESS),
	chainId: 1,
	name: 'Ether',
	symbol: 'ETH',
	decimals: 18,
	logoURI: `https://assets.smold.app/api/token/1/${ETH_TOKEN_ADDRESS}/logo-128.png`
};

export const FTM_TOKEN: TTokenInfo = {
	address: toAddress(ETH_TOKEN_ADDRESS),
	chainId: 250,
	name: 'Fantom',
	symbol: 'FTM',
	decimals: 18,
	logoURI: `https://assets.smold.app/api/token/1/${ETH_TOKEN_ADDRESS}/logo-128.png`
};

