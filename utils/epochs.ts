import {EPOCH_DURATION, INITIAL_PERIOD_TIMESTAMP} from 'utils/constants';
import {CBETH_TOKEN, QETH_TOKEN, SFRXETH_TOKEN, STADERETH_TOKEN, STRATFIRETH_TOKEN, SWETH_TOKEN, WBETH_TOKEN, WSTETH_TOKEN} from 'utils/tokens';

import type {TEpoch} from './types';

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

/**************************************************************************************************
** This function returns the current epoch object based on the current epoch number.
** It uses the getCurrentEpochNumber function to get the current epoch number and then
** retrieves the corresponding epoch object from the allEpochs array.
**************************************************************************************************/
export function getCurrentEpoch(): TEpoch {
	const currentEpochNumber = getCurrentEpochNumber();
	return allEpochs[currentEpochNumber];
}


const allEpochs: TEpoch[] = [];

// Epoch 0
allEpochs.push({
	index: 0,
	inclusion: {
		id: '0x0101000000000000000000000000000000000000000000000000000000000000',
		candidates: [
			{...QETH_TOKEN, index: 0},
			{...WBETH_TOKEN, index: 1},
			{...STRATFIRETH_TOKEN, index: 2}
		]
	},
	weight: {
		id: '0x0102000000000000000000000000000000000000000000000000000000000000',
		participants: [
			{...SFRXETH_TOKEN, index: 0},
			{...SWETH_TOKEN, index: 1},
			{...WSTETH_TOKEN, index: 2},
			{...STADERETH_TOKEN, index: 3},
			{...CBETH_TOKEN, index: 4}
		]
	}
});
