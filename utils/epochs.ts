import {EPOCH_DURATION, INITIAL_PERIOD_TIMESTAMP} from 'utils/constants';
import {CBETH_TOKEN, SFRXETH_TOKEN, STADERETH_TOKEN, SWETH_TOKEN, WSTETH_TOKEN} from 'utils/tokens';

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
	if (currentEpochNumber > allEpochs.length - 1) {
		return allEpochs[allEpochs.length - 1];
	}
	return allEpochs[currentEpochNumber];
}


/** 🔵 - Yearn *************************************************************************************
** To add a new epoch, follow these steps:
**
** 1. Copy the first allEpochs.push block.
** 2. Replace the index with the new epoch number.
** 3. Replace the list of candidates with the new candidates for this epoch.
** 4. Replace the list of participants with the new participants for this epoch.
** 5. Update the ids to the correct voteid.
**
** Note:
** - Both the candidates and participants lists are order sensitive. The first element in the list
**   will be the choice number 2 in snapshot, as the first one will always be to keep the same as before.
** - The candidates and participants must respect a specific type that is available in the @tokens.ts file.
**
** Here is an example of how to add a new epoch:
**
** allEpochs.push({
** 	index: NEW_EPOCH_NUMBER,
** 	inclusion: {
** 		id: 'NEW_VOTE_ID',
** 		candidates: [
** 			{...NEW_CANDIDATE_1, index: 0},
** 			{...NEW_CANDIDATE_2, index: 1},
** 			{...NEW_CANDIDATE_3, index: 2}
** 		]
** 	},
** 	weight: {
** 		id: 'NEW_VOTE_ID',
** 		participants: [
** 			{...NEW_PARTICIPANT_1, index: 0},
** 			{...NEW_PARTICIPANT_2, index: 1},
** 			{...NEW_PARTICIPANT_3, index: 2},
** 			{...NEW_PARTICIPANT_4, index: 3},
** 			{...NEW_PARTICIPANT_5, index: 4}
** 		]
** 	}
** });
**************************************************************************************************/
const allEpochs: TEpoch[] = [];
// Epoch 0
allEpochs.push({
	index: 0,
	inclusion: {
		id: '0x0101000000000000000000000000000000000000000000000000000000000000',
		candidates: []
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
