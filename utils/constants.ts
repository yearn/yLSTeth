
import {zeroAddress} from 'viem';

import {CBETH_TOKEN, MEVETH_TOKEN, SFRXETH_TOKEN, STADERETH_TOKEN, SWETH_TOKEN, WSTETH_TOKEN} from './tokens';

import type {TIndexedTokenInfo} from './types';

export const INITIAL_PERIOD_BLOCK = 17_653_050n;
export const DAILY_AVG_BLOCKS = 7_200n;
export const EPOCH_AVG_BLOCKS = 2_419_200n; // 4 weeks

export const INITIAL_PERIOD_TIMESTAMP = 1_694_044_800;
export const EPOCH_DURATION = 2_419_200; // 4 weeks
export const VOTE_START_DELAY = 1_814_400; // 3 weeks

export const NO_CHANGE_LST_LIKE: TIndexedTokenInfo = ({
	address: zeroAddress,
	chainId: 1,
	decimals: 18,
	logoURI: '/iconNoChange.svg',
	name: 'Do Nothing / No Change',
	symbol: 'Do Nothing / No Change',
	index: -1
});

export const LST: TIndexedTokenInfo[] = [
	{...SFRXETH_TOKEN, index: 0},
	{...SWETH_TOKEN, index: 1},
	{...WSTETH_TOKEN, index: 2},
	{...STADERETH_TOKEN, index: 3},
	{...CBETH_TOKEN, index: 4},
	{...MEVETH_TOKEN, index: 5}
];
export const LST_COUNT = LST.length;

