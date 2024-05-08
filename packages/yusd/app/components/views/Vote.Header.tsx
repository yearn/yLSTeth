import React from 'react';
import {formatAmount, toBigInt} from '@builtbymom/web3/utils';
import {useTimer} from '@libHooks/useTimer';
import {Renderable} from '@yearn-finance/web-lib/components/Renderable';
import {useEpoch} from '@yUSD/hooks/useEpoch';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';

function Timer(): ReactElement {
	const {voteStart, endPeriod, hasVotingStarted} = useEpoch();
	const time = useTimer({endTime: hasVotingStarted ? Number(endPeriod) : Number(voteStart)});

	return (
		<b
			suppressHydrationWarning
			className={'font-number text-accent mt-4 text-4xl leading-10'}>
			{hasVotingStarted ? `ends in ${time}` : `starts in ${time}`}
		</b>
	);
}

function VoteDecayTimer(): ReactElement {
	const {endPeriod, hasVotingStarted} = useEpoch();
	const onDay = 86400;
	const time = useTimer({endTime: hasVotingStarted ? Number(endPeriod) - onDay : 0});

	return (
		<small
			suppressHydrationWarning
			className={'font-number pt-4 text-xs'}>
			{hasVotingStarted ? `Will decay in in ${time}` : ''}
		</small>
	);
}

function VoteHeader(props: {votePower: TNormalizedBN | undefined; isLoading: boolean}): ReactElement {
	return (
		<div className={'mb-10 flex w-full flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>{'Vote'}</h1>
			<Timer />
			<div className={'mt-6 flex w-full flex-col items-start gap-4 md:grid md:grid-cols-2 md:flex-row md:gap-6'}>
				<div className={'w-full'}>
					<p className={'text-neutral-700'}>
						{
							'st-yUSD holders are the house, senate, lords, and commons of yUSD governance. Holders vote every epoch on yUSD composition, accepting new LSTs into yUSD, as well as governance proposals and parameter configurations. Vote power is fixed at the start of voting.'
						}
					</p>
					<p className={'pt-4 text-neutral-700'}>
						{
							'With the transition to on-chain governance, voting power now decays in the remaining 24 hours of the voting period, from 100% to 0% at the final block of the epoch.'
						}
					</p>
				</div>
				<div className={'-mt-4 flex w-full justify-end space-x-4 pb-2 md:w-auto'}>
					<div className={'w-full min-w-[300px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'block whitespace-nowrap pb-2'}>{'Current voting power this epoch'}</p>

						<b
							suppressHydrationWarning
							className={'font-number block text-3xl'}>
							<Renderable
								shouldRender={!props.isLoading}
								fallback={<div className={'skeleton-lg col-span-5 h-10 w-2/3'} />}>
								{formatAmount(props.votePower?.normalized || 0, 4, 4)}
							</Renderable>
						</b>

						<div suppressHydrationWarning>
							{toBigInt(props.votePower?.raw) > 0n ? (
								<VoteDecayTimer />
							) : props.isLoading ? (
								<div className={'skeleton-lg col-span-5 mt-2 h-4 w-full'} />
							) : (
								<div className={'invisible pt-2 text-xs'}>{'-'}</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export {VoteHeader};
