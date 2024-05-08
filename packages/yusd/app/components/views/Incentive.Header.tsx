import React, {useMemo} from 'react';
import {formatTAmount} from '@builtbymom/web3/utils';
import {useTimer} from '@libHooks/useTimer';
import {Renderable} from '@yearn-finance/web-lib/components/Renderable';
import useLST from '@yUSD/contexts/useLST';
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

function IncentiveHeader({isIncentivePeriodClosed}: {isIncentivePeriodClosed: boolean}): ReactElement {
	const {TVL} = useLST();
	/* 🔵 - Yearn Finance **************************************************************************
	 ** Calculate the sum of all the incentives for all the protocols.
	 **********************************************************************************************/
	const sumOfAllIncentives = useMemo((): number => {
		const sum = 0;
		//TODO DO THIS
		// for (const eachIncentive of Object.values(groupIncentiveHistory.protocols)) {
		// 	sum += eachIncentive.normalizedSum;
		// }
		return sum;
	}, []);

	return (
		<div className={'mb-10 flex w-full flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>{'Incentivize'}</h1>
			<Timer isIncentivePeriodClosed={isIncentivePeriodClosed} />
			<div className={'mt-6 flex w-full flex-col items-start gap-4 md:grid-cols-1 md:flex-row md:gap-6'}>
				<div className={'w-full'}>
					<p className={'text-neutral-700'}>
						{
							'They say it’s not what you know, but who you… incentivize. You can incentivize with any amount and any token for:'
						}
					</p>
					<ul>
						<li className={'list-inside list-disc text-neutral-700'}>
							{
								'Weight votes: anyone who votes in favor receives incentives accordingly. Incentives are non-refundable.'
							}
						</li>
						<li className={'list-inside list-disc text-neutral-700'}>
							{
								'Inclusion votes: Support an LST to get added to yUSD or to not let any new LST in. Incentives are refundable if your outcome does not win.'
							}
						</li>
					</ul>
				</div>
				<div className={'flex w-full justify-end space-x-4 pb-2 md:w-auto'}>
					<div className={'w-full min-w-[200px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'whitespace-nowrap pb-2'}>{'Current total deposits, USD'}</p>
						<b
							suppressHydrationWarning
							className={'font-number text-3xl'}>
							<Renderable
								shouldRender={true}
								fallback={'-'}>
								{formatTAmount({value: TVL, decimals: 2, symbol: '$'})}
							</Renderable>
						</b>
					</div>
					<div className={'w-full min-w-[200px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'whitespace-nowrap pb-2'}>{'Current total incentives, USD'}</p>
						<b
							suppressHydrationWarning
							className={'font-number text-3xl'}>
							<Renderable
								shouldRender={true}
								fallback={'-'}>
								{formatTAmount({value: sumOfAllIncentives, decimals: 2, symbol: '$'})}
							</Renderable>
						</b>
					</div>
				</div>
			</div>
		</div>
	);
}

export {IncentiveHeader};
