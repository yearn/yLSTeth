
import {CBETH_TOKEN, SFRXETH_TOKEN, STADERETH_TOKEN, SWETH_TOKEN, WSTETH_TOKEN} from './tokens';

import type {TTokenInfo} from 'contexts/useTokenList';

export const INITIAL_PERIOD_TIMESTAMP = 1_694_044_800;
export const EPOCH_DURATION = 2_419_200; // 4 weeks
export const VOTE_START_DELAY = 1_814_400; // 3 weeks

export const LST: (TTokenInfo & {index: number})[] = [
	{...SFRXETH_TOKEN, index: 0},
	{...SWETH_TOKEN, index: 1},
	{...WSTETH_TOKEN, index: 2},
	{...STADERETH_TOKEN, index: 3},
	{...CBETH_TOKEN, index: 4}
];

