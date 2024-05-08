import {useEffect, useState} from 'react';
import {EPOCH_DURATION, INITIAL_PERIOD_TIMESTAMP, VOTE_START_DELAY} from '@yETH/utils/constants';

/**************************************************************************************************
 ** This hook returns the start and end period for the current timestamp.
 ** It calculates the start and end period based on the INITIAL_PERIOD_TIMESTAMP and EPOCH_DURATION.
 **************************************************************************************************/
export function useEpoch(): {startPeriod: number; endPeriod: number; voteStart: number; hasVotingStarted: boolean} {
	const [startPeriod, set_startPeriod] = useState(0);
	const [endPeriod, set_endPeriod] = useState(0);
	const [voteStart, set_voteStart] = useState(0);
	const [hasVotingStarted, set_hasVotingStarted] = useState(false);

	useEffect((): void => {
		const currentTimestamp = Math.floor(Date.now() / 1000);
		const elapsedEpochs = Math.floor((currentTimestamp - INITIAL_PERIOD_TIMESTAMP) / EPOCH_DURATION);
		const startPeriod = INITIAL_PERIOD_TIMESTAMP + elapsedEpochs * EPOCH_DURATION;
		const endPeriod = startPeriod + EPOCH_DURATION;
		const voteStart = startPeriod + VOTE_START_DELAY;

		set_startPeriod(startPeriod);
		set_endPeriod(endPeriod);
		set_voteStart(voteStart);
		set_hasVotingStarted(currentTimestamp >= voteStart);
	}, []);

	return {startPeriod, endPeriod, voteStart, hasVotingStarted};
}
