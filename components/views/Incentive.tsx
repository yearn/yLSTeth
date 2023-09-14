import React, {useMemo, useState} from 'react';
import useIncentives from 'hooks/useIncentives';
import {getCurrentEpoch} from 'utils/epochs';
import {toAddress} from '@yearn-finance/web-lib/utils/address';

import {IncentiveHeader} from './Incentive.Header';
import {IncentiveHistory} from './Incentive.History';
import {IncentiveSelector} from './Incentive.Selector';

import type {ReactElement} from 'react';
import type {TIndexedTokenInfo} from 'utils/types';
import type {TDict} from '@yearn-finance/web-lib/types';

function ViewIncentive(): ReactElement {
	const [currentTab, set_currentTab] = useState<'current' | 'potential'>('current');
	const {groupIncentiveHistory, isFetchingHistory} = useIncentives();
	const currentEpoch = getCurrentEpoch();

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
				<IncentiveHeader />
				<IncentiveSelector
					possibleLSTs={possibleLSTs}
					currentTab={currentTab}
					set_currentTab={set_currentTab}
					onOpenModal={(): void => undefined} />
				<div className={'bg-neutral-100'}>
					<IncentiveHistory
						possibleLSTs={possibleLSTs}
						isPending={isFetchingHistory}
						incentives={groupIncentiveHistory} />
				</div>
			</div>
		</section>
	);
}

export default ViewIncentive;
