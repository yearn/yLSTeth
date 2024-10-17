import React from 'react';

import {SubIncentiveRow} from './SubIncentiveRow';

import type {ReactElement} from 'react';
import type {TIncentives} from '@yUSD/hooks/useBootstrapIncentives';

export function SubIncentiveWrapper(props: {incentives: TIncentives[]}): ReactElement {
	return (
		<div className={'border-t border-neutral-300 bg-neutral-200 px-4 pb-2 pt-4 md:px-72'}>
			<div className={'mb-4'}>
				<b className={'text-xs'}>{'Incentives Breakdown'}</b>
			</div>
			<div
				aria-label={'header'}
				className={'mb-2 grid w-full grid-cols-8 md:w-[52%]'}>
				<div className={'col-span-2'}>
					<p className={'text-xs text-neutral-500'}>{'Token used'}</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'Amount'}</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>
						<span className={'hidden md:block'}>{'USD Value'}</span>
						<span className={'block md:hidden'}>{'$ Value'}</span>
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'APR'}</p>
				</div>
			</div>
			{props.incentives.map(
				(item, index): ReactElement => (
					<SubIncentiveRow
						key={`${index}_${item.protocol}`}
						item={item}
					/>
				)
			)}
		</div>
	);
}
