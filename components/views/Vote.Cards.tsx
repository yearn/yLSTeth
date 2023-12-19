import React from 'react';
import Link from 'next/link';
import {VoteCardWeights} from 'components/views/Vote.CardWeights';
import {VoteCardWhitelist} from 'components/views/Vote.CardWhitelist';
import {useEpoch} from 'hooks/useEpoch';
import {getCurrentEpoch} from 'utils/epochs';
import {Button} from '@yearn-finance/web-lib/components/Button';

import type {ReactElement} from 'react';

function VoteCards(): ReactElement {
	const {hasVotingStarted} = useEpoch();

	return (
		<div
			className={
				'grid grid-cols-20 divide-x-0 divide-y divide-neutral-300 bg-neutral-100 md:divide-x md:divide-y-0'
			}>
			<div className={'pr-r col-span-20 flex flex-col p-4 md:col-span-11 md:px-72 md:py-10'}>
				<b className={'text-xl font-black'}>{'Weights vote'}</b>
				<VoteCardWeights />
				{hasVotingStarted && (
					<div className={'mt-auto pt-10'}>
						<Link
							href={'https://snapshot.org/#/ylsd.eth'}
							target={'_blank'}
							rel={'noopener noreferrer'}>
							<Button className={'w-full md:w-[264px]'}>{'Vote on Snapshot'}</Button>
						</Link>
					</div>
				)}
			</div>

			<div className={'col-span-20 flex flex-col px-4 py-10 md:col-span-9 md:px-72'}>
				<b className={'text-xl font-black'}>{'Whitelisting vote'}</b>
				<VoteCardWhitelist />
				{getCurrentEpoch().inclusion.candidates.length > 0 && (
					<div className={'mt-auto pt-10'}>
						<Link
							href={'https://snapshot.org/#/ylsd.eth'}
							target={'_blank'}
							rel={'noopener noreferrer'}>
							<Button className={'w-full md:w-[264px]'}>{'Vote on Snapshot'}</Button>
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}

export {VoteCards};
