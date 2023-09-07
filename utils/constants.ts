import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type {TTokenInfo} from 'contexts/useTokenList';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SHOULD_USE_ALTERNATE_DESIGN = true;

export const LST: (TTokenInfo & {index: number})[] = [
	{
		chainId: 1,
		index: 0,
		address: toAddress('0xac3E018457B222d93114458476f3E3416Abbe38F'),
		name: 'Staked Frax Ether',
		symbol: 'sfrxETH',
		decimals: 18,
		logoURI: `https://assets.smold.app/api/token/1/${toAddress('0xac3E018457B222d93114458476f3E3416Abbe38F')}/logo-128.png`
	},
	{
		chainId: 1,
		index: 1,
		address: toAddress('0xf951E335afb289353dc249e82926178EaC7DEd78'),
		name: 'Swell Network Ether',
		symbol: 'swETH',
		decimals: 18,
		logoURI: `https://assets.smold.app/api/token/1/${toAddress('0xf951E335afb289353dc249e82926178EaC7DEd78')}/logo-128.png`
	},
	{
		chainId: 1,
		index: 2,
		address: toAddress('0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0'),
		name: 'Wrapped liquid staked Ether 2.0',
		symbol: 'wstETH',
		decimals: 18,
		logoURI: `https://assets.smold.app/api/token/1/${toAddress('0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0')}/logo-128.png`
	},
	{
		chainId: 1,
		index: 3,
		address: toAddress('0xA35b1B31Ce002FBF2058D22F30f95D405200A15b'),
		name: 'Stader ETHx',
		symbol: 'ETHx',
		decimals: 18,
		logoURI: `https://assets.smold.app/api/token/1/${toAddress('0xA35b1B31Ce002FBF2058D22F30f95D405200A15b')}/logo-128.png`
	},
	{
		chainId: 1,
		index: 4,
		address: toAddress('0xBe9895146f7AF43049ca1c1AE358B0541Ea49704'),
		name: 'Coinbase Wrapped Staked ETH',
		symbol: 'cbETH',
		decimals: 18,
		logoURI: `https://assets.smold.app/api/token/1/${toAddress('0xBe9895146f7AF43049ca1c1AE358B0541Ea49704')}/logo-128.png`
	}
];
