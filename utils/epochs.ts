import {EPOCH_DURATION, INITIAL_PERIOD_TIMESTAMP} from 'utils/constants';
import {QETH_TOKEN, STRATFIRETH_TOKEN, WBETH_TOKEN} from 'utils/tokens';

import type {TTokenInfo} from 'contexts/useTokenList';

/**************************************************************************************************
** TEpoch is a type that represents an epoch in the system. An epoch is a period of time in the
** system's operation. Each epoch has an index, an inclusion object, and a weight object.
**
** The index is a unique identifier for the epoch.
**
** The inclusion object contains an id and a list of candidates. Each candidate is a TTokenInfo
** object with an additional index property.
**
** The weight object contains an id.
**************************************************************************************************/
type TEpoch = {
	index: number;
	inclusion: {
		id: string;
		candidates: (TTokenInfo & {index: number})[];
	},
	weight: {
		id: string;
	}
}

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
		id: '0x0102000000000000000000000000000000000000000000000000000000000000'
	}
});
