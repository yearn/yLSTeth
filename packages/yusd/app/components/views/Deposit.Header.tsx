import React from 'react';
import {useTimer} from '@libHooks/useTimer';
import {useEpoch} from '@yUSD/hooks/useEpoch';

import type {ReactElement} from 'react';

function Timer({isIncentivePeriodClosed}: {isIncentivePeriodClosed: boolean}): ReactElement {
	const {endPeriod} = useEpoch();
	const time = useTimer({endTime: Number(endPeriod - 3 * 24 * 3600)});

	return (
		<>
			<b
				suppressHydrationWarning
				className={'font-number text-accent mt-2 text-3xl leading-10'}>
				{isIncentivePeriodClosed ? 'closed' : `closes in ${time}`}
			</b>
		</>
	);
}

function DepositHeader({isIncentivePeriodClosed}: {isIncentivePeriodClosed: boolean}): ReactElement {
	console.log(isIncentivePeriodClosed);
	return (
		<div className={'mb-10 flex w-full flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>{'Bootstrapping'}</h1>
			<Timer isIncentivePeriodClosed={isIncentivePeriodClosed} />
			<div className={'mt-6 flex w-full flex-col items-start gap-4 md:grid-cols-1 md:flex-row md:gap-6'}>
				<div className={'w-full text-neutral-700'}>
					<p>{'Decide how much ETH you want to lock as st-yUSD.'}</p>
					<p>{'Remember this ETH will be locked for 16 weeks, but by holding st-yUSD:'}</p>
				</div>
			</div>
			<p className={'mt-4 font-black'}>
				{'You’ll receive incentives for voting on which STABLEs will be included in yUSD. Ka-ching.'}
			</p>
		</div>
	);
}

export {DepositHeader};
