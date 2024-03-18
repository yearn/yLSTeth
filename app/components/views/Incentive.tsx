import React, {useMemo, useState} from 'react';
import useBasket from 'app/contexts/useBasket';
import useInclusion from 'app/contexts/useInclusion';
import {useEpoch} from 'app/hooks/useEpoch';
import {getCurrentEpochNumber} from 'app/utils/epochs';

import {IncentiveHeader} from './Incentive.Header';
import {IncentiveHistory} from './Incentive.History';
import {IncentiveSelector} from './Incentive.Selector';

import type {TIndexedTokenInfo} from 'app/utils/types';
import type {ReactElement} from 'react';

function ViewIncentive(): ReactElement {
	const [currentTab, set_currentTab] = useState<'current' | 'potential'>('current');
	const [epochToDisplay, set_epochToDisplay] = useState<number>(getCurrentEpochNumber());
	const {endPeriod} = useEpoch();
	const {candidates} = useInclusion();
	const {basket, isLoaded, refreshIncentives} = useBasket();

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
	const possibleLSTs = useMemo((): TIndexedTokenInfo[] => {
		if (currentTab === 'potential') {
			return candidates;
		}
		return basket;
	}, [currentTab, basket, candidates]);

	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<IncentiveHeader isIncentivePeriodClosed={isIncentivePeriodClosed} />
				<IncentiveSelector
					isIncentivePeriodClosed={isIncentivePeriodClosed}
					possibleLSTs={possibleLSTs}
					currentTab={currentTab}
					set_currentTab={set_currentTab}
					onSubmit={refreshIncentives}
					isLoading={!isLoaded}
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
