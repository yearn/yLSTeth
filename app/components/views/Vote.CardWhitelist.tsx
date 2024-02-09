import React, {useCallback, useState} from 'react';
import IconChevronPlain from 'app/components/icons/IconChevronPlain';
import IconSpinner from 'app/components/icons/IconSpinner';
import useLST from 'app/contexts/useLST';
import {getCurrentEpoch} from 'app/utils/epochs';
import {formatAmount, truncateHex} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@yearn-finance/web-lib/components/ImageWithFallback';

import type {TSortDirection} from 'app/utils/types';
import type {ReactElement} from 'react';

function VoteElement({currentLST}: {currentLST: any}): ReactElement {
	const {
		incentives: {groupIncentiveHistory}
	} = useLST();
	const item = groupIncentiveHistory?.protocols?.[currentLST.address] || undefined;

	return (
		<div
			aria-label={'content'}
			className={
				'my-0.5 grid grid-cols-12 rounded-sm bg-neutral-100/50 p-4 transition-colors open:bg-neutral-100 hover:bg-neutral-100'
			}>
			<div className={'col-span-12 flex w-full flex-row items-center space-x-6 md:col-span-6'}>
				<div className={'size-10 min-w-[40px]'}>
					<ImageWithFallback
						src={currentLST.logoURI || ''}
						alt={''}
						unoptimized
						width={40}
						height={40}
					/>
				</div>
				<div className={'flex flex-col'}>
					<p className={'whitespace-nowrap'}>{currentLST.symbol || truncateHex(currentLST.address, 6)}</p>
					<small className={'whitespace-nowrap text-xs'}>{currentLST.name}</small>
				</div>
			</div>
			<div className={'col-span-12 mt-4 flex items-center justify-between md:col-span-6 md:mt-0 md:justify-end'}>
				<small className={'block text-neutral-500 md:hidden'}>{'Total incentive (USD)'}</small>
				<p
					suppressHydrationWarning
					className={'font-number'}>
					{`$${formatAmount(item?.normalizedSum || 0, 2, 2)}`}
				</p>
			</div>
		</div>
	);
}

function VoteCardWhitelist(): ReactElement {
	const [sortBy, set_sortBy] = useState<'totalIncentive'>('totalIncentive');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('desc');
	const {
		incentives: {groupIncentiveHistory, isFetchingHistory}
	} = useLST();

	/* 🔵 - Yearn Finance **************************************************************************
	 **	Callback method used to sort the vaults list.
	 **	The use of useCallback() is to prevent the method from being re-created on every render.
	 **********************************************************************************************/
	const onSort = useCallback((newSortBy: 'totalIncentive', newSortDirection: string): void => {
		set_sortBy(newSortBy);
		set_sortDirection(newSortDirection as TSortDirection);
	}, []);

	/** 🔵 - Yearn Finance **************************************************************************
	 **	This function is used to toggle the sort direction based on the current sort direction and
	 **	the new sort by parameter. If the current sort by is the same as the new sort by, it toggles
	 **	between 'desc', 'asc', and ''. If not, it defaults to 'desc'.
	 **************************************************************************************************/
	const toggleSortDirection = (newSortBy: string): TSortDirection => {
		return sortBy === newSortBy
			? sortDirection === ''
				? 'desc'
				: sortDirection === 'desc'
					? 'asc'
					: 'desc'
			: 'desc';
	};

	const renderChevron = useCallback(
		(shouldSortBy: boolean): ReactElement => {
			if (shouldSortBy && sortDirection === 'desc') {
				return <IconChevronPlain className={'yearn--sort-chevron transition-all'} />;
			}
			if (shouldSortBy && sortDirection === 'asc') {
				return <IconChevronPlain className={'yearn--sort-chevron rotate-180 transition-all'} />;
			}
			return (
				<IconChevronPlain
					className={'yearn--sort-chevron--off text-neutral-300 transition-all group-hover:text-neutral-500'}
				/>
			);
		},
		[sortDirection]
	);

	if (getCurrentEpoch().inclusion.candidates.length === 0) {
		return (
			<div className={'mt-10'}>
				<p className={'whitespace-pre text-neutral-700'}>
					{'There is nobody to be whitelisted yet\nnothing to worry about anon'}
				</p>
			</div>
		);
	}
	return (
		<div className={'mt-8'}>
			<div
				aria-label={'header'}
				className={'mb-4 hidden grid-cols-12 px-4 md:grid'}>
				<div className={'col-span-6'}>
					<p className={'text-xs text-neutral-500'}>{'LST'}</p>
				</div>
				<div className={'col-span-6 -mr-2 flex justify-end text-right'}>
					<p
						onClick={(): void => onSort('totalIncentive', toggleSortDirection('totalIncentive'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'Incentives (USD)'}
						<span className={'pl-2'}>{renderChevron(sortBy === 'totalIncentive')}</span>
					</p>
				</div>
			</div>

			{[...getCurrentEpoch().inclusion.candidates]
				.filter((e): boolean => Boolean(e))
				.sort((a, b): number => {
					const aProtocol = groupIncentiveHistory?.protocols?.[a.address];
					const bProtocol = groupIncentiveHistory?.protocols?.[b.address];
					let aValue = 0;
					let bValue = 0;
					if (sortBy === 'totalIncentive') {
						aValue = aProtocol?.normalizedSum || 0;
						bValue = bProtocol?.normalizedSum || 0;
					}
					return sortDirection === 'desc' ? Number(bValue) - Number(aValue) : Number(aValue) - Number(bValue);
				})
				.map(
					(currentLST): ReactElement => (
						<VoteElement
							key={currentLST.address}
							currentLST={currentLST}
						/>
					)
				)}

			{isFetchingHistory && (
				<div className={'mt-6 flex flex-row items-center justify-center'}>
					<IconSpinner className={'!h-6 !w-6 !text-neutral-400'} />
				</div>
			)}
		</div>
	);
}

export {VoteCardWhitelist};
