import {useEffect,useState} from 'react';
import {EPOCH_DURATION, INITIAL_PERIOD_TIMESTAMP} from 'utils/constants';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';

/**************************************************************************************************
** This hook returns the start and end period for the current timestamp.
** It calculates the start and end period based on the INITIAL_PERIOD_TIMESTAMP and EPOCH_DURATION.
**************************************************************************************************/
export function useEpoch(): {startPeriod: number; endPeriod: number} {
	const [startPeriod, set_startPeriod] = useState(0);
	const [endPeriod, set_endPeriod] = useState(0);

	useEffect((): void => {
		const currentTimestamp = Math.floor(Date.now() / 1000);
		const elapsedEpochs = Math.floor((currentTimestamp - INITIAL_PERIOD_TIMESTAMP) / EPOCH_DURATION);
		const startPeriod = INITIAL_PERIOD_TIMESTAMP + elapsedEpochs * EPOCH_DURATION;
		const endPeriod = startPeriod + EPOCH_DURATION;

		performBatchedUpdates((): void => {
			set_startPeriod(startPeriod);
			set_endPeriod(endPeriod);
		});
	}, []);

	return {startPeriod, endPeriod};
}
