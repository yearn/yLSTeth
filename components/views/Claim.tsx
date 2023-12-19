import React from 'react';
import useBootstrap from 'contexts/useBootstrap';
import {useTimer} from 'hooks/useTimer';

import {ClaimIncentives} from './Claim.Incentives';
import {UnlockTokens} from './Claim.Unlock';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {voteEnd} = periods || {};
	const time = useTimer({endTime: Number(voteEnd)});
	return <>{`in ${time}`}</>;
}

function ClaimHeading(): ReactElement {
	const {
		periods: {voteStatus}
	} = useBootstrap();
	if (voteStatus === 'ended') {
		return (
			<div className={'mb-10 flex w-[52%] flex-col justify-center'}>
				<h1 className={'text-3xl font-black md:text-8xl'}>{'Claim'}</h1>
				<p className={'pt-8 text-neutral-700'}>{'You did your democratic duty beautifully anon.'}</p>
				<p className={'text-neutral-700'}>
					{'And now it’s time to claim your ‘good on chain citizen’ rewards. Enjoy!'}
				</p>
			</div>
		);
	}

	return (
		<div className={'mb-10 flex w-3/4 flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>
				{'Claim'}
				<span
					suppressHydrationWarning
					className={'text-xs font-normal italic text-neutral-400'}>
					{'Soon ™️'}
				</span>
			</h1>
			<b
				suppressHydrationWarning
				className={'font-number mt-4 text-4xl leading-10 text-purple-300'}>
				<Timer />
			</b>
			<p className={'pt-8 text-neutral-700'}>
				{
					'If you voted for any LSTs you’d like to see included in yETH, you’re eligble to recieve incentives from the top 5 protocols (even if you didn’t vote for them).'
				}
			</p>
			<p className={'text-neutral-700'}>{' But hold your horses anon, you can claim soon.'}</p>
		</div>
	);
}

function Claim(): ReactElement {
	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<ClaimHeading />
				<div className={'flex flex-col gap-10 md:flex-row md:gap-20'}>
					<ClaimIncentives />
					<div>
						<div className={'h-0 md:h-[104px]'} />
						<UnlockTokens />
					</div>
				</div>
			</div>
		</section>
	);
}

export default Claim;
