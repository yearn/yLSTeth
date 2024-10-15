import {zeroAddress} from 'viem';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';

import type {TDict} from '@builtbymom/web3/types';
import type {TIndexedTokenInfo} from '@libUtils/types';

export const INITIAL_PERIOD_BLOCK = 20_676_912n;
export const DAILY_AVG_BLOCKS = 7_200n;
export const EPOCH_AVG_BLOCKS = 201_600n; // 4 weeks

export const BOOTSTRAP_INIT_BLOCK_NUMBER = INITIAL_PERIOD_BLOCK;

export const INITIAL_PERIOD_TIMESTAMP = 1_694_044_800;
export const EPOCH_DURATION = 2_419_200; // 4 weeks
export const VOTE_START_DELAY = 1_814_400; // 3 weeks

export const NO_CHANGE_LST_LIKE: TIndexedTokenInfo = {
	address: zeroAddress,
	chainID: Number(process.env.DEFAULT_CHAIN_ID),
	decimals: 18,
	logoURI: '/iconNoChange.svg',
	name: 'Do Nothing / No Change',
	symbol: 'Do Nothing / No Change',
	index: -1,
	balance: zeroNormalizedBN,
	value: 0
};

export const possibleTokenAddressesToUse = [
	'0xdC035D45d973E3EC169d2276DDab16f1e407384F',
	'0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
	'0x853d955aCEf822Db058eb8505911ED77F175b99e',
	'0xdAC17F958D2ee523a2206206994597C13D831ec7',
	'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
	'0x6B175474E89094C44Da98b954EedeAC495271d0F',
	'0x83F20F44975D03b1b09e64809B757c47f942BEeA',
	'0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD', //
	'0x9D39A5DE30e57443BfF2A8307A4256c8797A3497', //
	'0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32', //
	'0x96F6eF951840721AdBF46Ac996b59E0235CB985C' //
];

export const possibleTokensToVoteFor: TDict<TIndexedTokenInfo> = {
	'0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32': {
		address: '0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32',
		index: 1,
		balance: {
			raw: 0n,
			normalized: 0,
			display: '0'
		},
		chainID: 1,
		decimals: 18,
		logoURI: 'https://assets.coingecko.com/coins/images/35383/large/sfrax.png?1708445569',
		name: 'Staked FRAX',
		symbol: 'sFRAX',
		value: 0
	},
	'0x9D39A5DE30e57443BfF2A8307A4256c8797A3497': {
		address: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
		index: 2,
		balance: {
			raw: 0n,
			normalized: 0,
			display: '0'
		},
		chainID: 1,
		decimals: 18,
		logoURI: 'https://assets.smold.app/api/token/1/0x9D39A5DE30e57443BfF2A8307A4256c8797A3497/logo-128.png',
		name: 'Staked USDe',
		symbol: 'sUSDe',
		value: 0
	}
};

export const whitelistedLST: TDict<TIndexedTokenInfo> = {
	'0x83F20F44975D03b1b09e64809B757c47f942BEeA': {
		address: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
		balance: {
			raw: 0n,
			normalized: 0,
			display: '0'
		},
		chainID: 1,
		decimals: 18,
		logoURI: 'https://assets.smold.app/api/token/1/0x83F20F44975D03b1b09e64809B757c47f942BEeA/logo-128.png',
		name: 'Savings Dai',
		symbol: 'sDAI',
		index: 1,
		value: 0
	},
	'0x3d2FdAb1fA27ddDe9dcB77f151768beB839bC9ED': {
		address: '0x3d2FdAb1fA27ddDe9dcB77f151768beB839bC9ED',
		balance: {
			raw: 0n,
			normalized: 0,
			display: '0'
		},
		chainID: 1,
		decimals: 6,
		logoURI: 'https://assets.smold.app/api/token/1/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo-128.png',
		name: 'Mock USD',
		symbol: 'MOCK',
		index: 2,
		value: 0
	}
};
