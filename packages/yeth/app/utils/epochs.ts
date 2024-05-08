import {toBigInt} from '@builtbymom/web3/utils';

import {
	DAILY_AVG_BLOCKS,
	EPOCH_AVG_BLOCKS,
	EPOCH_DURATION,
	INITIAL_PERIOD_BLOCK,
	INITIAL_PERIOD_TIMESTAMP
} from './constants';

/**************************************************************************************************
 ** Calculate the current epoch based on the current timestamp, the initial period timestamp and
 ** the epoch duration.
 ** The formula used is: (currentTimestamp - INITIAL_PERIOD_TIMESTAMP) / EPOCH_DURATION
 ** The result is then rounded down to the nearest whole number to get the current epoch.
 **************************************************************************************************/
export function getCurrentEpochNumber(): number {
	const currentTimestamp = Math.floor(Date.now() / 1000);
	const currentEpoch = Math.floor((currentTimestamp - INITIAL_PERIOD_TIMESTAMP) / EPOCH_DURATION);
	return currentEpoch;
}

export function getEpochStartTimestamp(epochNumber: number): number {
	if (epochNumber === -1) {
		return INITIAL_PERIOD_TIMESTAMP;
	}
	return INITIAL_PERIOD_TIMESTAMP + epochNumber * EPOCH_DURATION;
}

export function getEpochEndTimestamp(epochNumber: number): number {
	if (epochNumber === -1) {
		return INITIAL_PERIOD_TIMESTAMP + EPOCH_DURATION;
	}
	return INITIAL_PERIOD_TIMESTAMP + EPOCH_DURATION + epochNumber * EPOCH_DURATION;
}

export function getEpochEndBlock(epochNumber: number): bigint {
	return INITIAL_PERIOD_BLOCK + toBigInt(epochNumber) * EPOCH_AVG_BLOCKS + EPOCH_AVG_BLOCKS;
}

export function getEpochStartBlock(epochNumber: number): bigint {
	const fourDays = DAILY_AVG_BLOCKS * 4n;
	const xEpochs = toBigInt(epochNumber) * EPOCH_AVG_BLOCKS;
	return INITIAL_PERIOD_BLOCK + xEpochs - fourDays;
}
