import React, {useMemo, useState} from 'react';
import {useEpoch} from 'app/hooks/useEpoch';
import {getCurrentEpochNumber, getEpoch} from 'app/utils/epochs';
import {toAddress} from '@builtbymom/web3/utils';

import {IncentiveHeader} from './Incentive.Header';
import {IncentiveHistory} from './Incentive.History';
import {IncentiveSelector} from './Incentive.Selector';

import type {TEpoch, TIndexedTokenInfo} from 'app/utils/types';
import type {ReactElement} from 'react';
import type {TDict} from '@builtbymom/web3/types';

function ViewIncentive(): ReactElement {
	const [currentTab, set_currentTab] = useState<'current' | 'potential'>('current');
	const [epochToDisplay, set_epochToDisplay] = useState<number>(getCurrentEpochNumber());
	const {endPeriod} = useEpoch();
	const currentEpoch = useMemo((): TEpoch => {
		return getEpoch(epochToDisplay);
	}, [epochToDisplay]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Incentive period is closed for the 3 last days of the epoch.
	 **********************************************************************************************/
	const isIncentivePeriodClosed = useMemo((): boolean => {
		const currentTimestamp = Math.floor(Date.now() / 1000);
		if (currentTimestamp > endPeriod - 3 * 24 * 3600 && currentTimestamp < endPeriod) {
			return true;
		}
		return false;
	}, [endPeriod]);

	/** 🔵 - Yearn *************************************************************************************
	 ** This memo hook selects either currentEpoch.inclusion.candidates if current tab is potential,
	 ** or currentEpoch.weight.participants if current tab is current.
	 **************************************************************************************************/
	const possibleLSTs = useMemo((): TDict<TIndexedTokenInfo> => {
		if (currentTab === 'potential') {
			const candidates: TDict<TIndexedTokenInfo> = {};
			for (const eachCandidate of currentEpoch.inclusion.candidates) {
				if (eachCandidate) {
					candidates[toAddress(eachCandidate.address)] = eachCandidate;
				}
			}
			return candidates;
		}
		const participants: TDict<TIndexedTokenInfo> = {};
		for (const eachParticipant of currentEpoch.weight.participants) {
			if (eachParticipant) {
				participants[toAddress(eachParticipant.address)] = eachParticipant;
			}
		}
		return participants;
	}, [currentTab, currentEpoch]);

	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<IncentiveHeader isIncentivePeriodClosed={isIncentivePeriodClosed} />
				<IncentiveSelector
					isIncentivePeriodClosed={isIncentivePeriodClosed}
					possibleLSTs={possibleLSTs}
					currentTab={currentTab}
					set_currentTab={set_currentTab}
				/>
				<div className={'bg-neutral-100'}>
					<IncentiveHistory
						epochToDisplay={epochToDisplay}
						set_epochToDisplay={set_epochToDisplay}
						currentTab={currentTab}
					/>
				</div>
			</div>
		</section>
	);
}

export default ViewIncentive;
