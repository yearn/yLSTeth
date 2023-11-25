import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';

import type {TTokenInfo} from 'contexts/useTokenList';

export const ETH_TOKEN: TTokenInfo = {
	address: toAddress(ETH_TOKEN_ADDRESS),
	chainId: 1,
	name: 'Ether',
	symbol: 'ETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${ETH_TOKEN_ADDRESS}/logo-128.png`
};
export const STYETH_TOKEN: TTokenInfo = {
	address: toAddress(process.env.STYETH_ADDRESS),
	chainId: 1,
	name: 'Staked Yearn ETH',
	symbol: 'st-yETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${process.env.STYETH_ADDRESS}/logo-128.png`

};
export const YETH_TOKEN: TTokenInfo = {
	address: toAddress(process.env.YETH_ADDRESS),
	chainId: 1,
	name: 'Yearn ETH',
	symbol: 'yETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/${process.env.YETH_ADDRESS}/logo-128.png`
};

/**********************************************************************************************
** Whitelisted tokens related to yETH ecosystem
**********************************************************************************************/
export const SFRXETH_TOKEN: TTokenInfo ={
	chainId: 1,
	address: toAddress('0xac3E018457B222d93114458476f3E3416Abbe38F'),
	name: 'Staked Frax Ether',
	symbol: 'sfrxETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0xac3E018457B222d93114458476f3E3416Abbe38F/logo-128.png`
};
export const SWETH_TOKEN: TTokenInfo ={
	chainId: 1,
	address: toAddress('0xf951E335afb289353dc249e82926178EaC7DEd78'),
	name: 'Swell Network Ether',
	symbol: 'swETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0xf951E335afb289353dc249e82926178EaC7DEd78/logo-128.png`
};
export const WSTETH_TOKEN: TTokenInfo ={
	chainId: 1,
	address: toAddress('0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0'),
	name: 'Wrapped liquid staked Ether 2.0',
	symbol: 'wstETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0/logo-128.png`
};
export const STADERETH_TOKEN: TTokenInfo ={
	chainId: 1,
	address: toAddress('0xA35b1B31Ce002FBF2058D22F30f95D405200A15b'),
	name: 'Stader ETHx',
	symbol: 'ETHx',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0xA35b1B31Ce002FBF2058D22F30f95D405200A15b/logo-128.png`
};
export const CBETH_TOKEN: TTokenInfo ={
	chainId: 1,
	address: toAddress('0xBe9895146f7AF43049ca1c1AE358B0541Ea49704'),
	name: 'Coinbase Wrapped Staked ETH',
	symbol: 'cbETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0xBe9895146f7AF43049ca1c1AE358B0541Ea49704/logo-128.png`
};

export const MPETH_TOKEN: TTokenInfo ={
	chainId: 1,
	address: toAddress('0x48AFbBd342F64EF8a9Ab1C143719b63C2AD81710'),
	name: 'Meta Pool ETH',
	symbol: 'mpETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0x48AFbBd342F64EF8a9Ab1C143719b63C2AD81710/logo-128.png`
};

export const RETH_TOKEN: TTokenInfo ={
	chainId: 1,
	address: toAddress('0xae78736Cd615f374D3085123A210448E74Fc6393'),
	name: 'Rocket Pool ETH',
	symbol: 'rETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0xae78736Cd615f374D3085123A210448E74Fc6393/logo-128.png`
};

export const MEVETH_TOKEN: TTokenInfo ={
	chainId: 1,
	address: toAddress('0x24Ae2dA0f361AA4BE46b48EB19C91e02c5e4f27E'),
	name: 'MEV Protocol ETH',
	symbol: 'mevETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0x24Ae2dA0f361AA4BE46b48EB19C91e02c5e4f27E/logo-128.png`
};

export const WEETH_TOKEN: TTokenInfo ={
	chainId: 1,
	address: toAddress('0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee'),
	name: 'EtherFi Wrapped ETH',
	symbol: 'weETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee/logo-128.png`
};

/**********************************************************************************************
** Other tokens related to yETH ecosystem
**********************************************************************************************/
export const QETH_TOKEN: TTokenInfo = {
	chainId: 1,
	address: toAddress('0x93ef1Ea305D11A9b2a3EbB9bB4FCc34695292E7d'),
	name: 'TranchessV2 WETH QUEEN',
	symbol: 'qETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0x93ef1Ea305D11A9b2a3EbB9bB4FCc34695292E7d/logo-128.png`
};
export const WBETH_TOKEN: TTokenInfo = {
	chainId: 1,
	address: toAddress('0xa2E3356610840701BDf5611a53974510Ae27E2e1'),
	name: 'Wrapped Binance Beacon ETH',
	symbol: 'wBETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0xa2E3356610840701BDf5611a53974510Ae27E2e1/logo-128.png`
};
export const STRATFIRETH_TOKEN: TTokenInfo = {
	chainId: 1,
	address: toAddress('0x9559Aaa82d9649C7A7b220E7c461d2E74c9a3593'),
	name: 'StaFi',
	symbol: 'rETH',
	decimals: 18,
	logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0x9559Aaa82d9649C7A7b220E7c461d2E74c9a3593/logo-128.png`
};
