import {zeroAddress} from 'viem';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';

import type {TIndexedTokenInfo} from '@libUtils/types';

export const INITIAL_PERIOD_BLOCK = 17_653_050n;
export const DAILY_AVG_BLOCKS = 7_200n;
export const EPOCH_AVG_BLOCKS = 201_600n; // 4 weeks

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
