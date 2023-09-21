import React, {useCallback, useState} from 'react';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import IconChevronPlain from 'components/icons/IconChevronPlain';
import IconSpinner from 'components/icons/IconSpinner';
import useLST from 'contexts/useLST';
import useIncentives from 'hooks/useIncentives';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {formatAmount, formatPercent} from '@yearn-finance/web-lib/utils/format.number';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {ReactElement} from 'react';
import type {TSortDirection} from 'utils/types';

function VoteCardWeights(): ReactElement {
	const {lst} = useLST();
	const {groupIncentiveHistory, isFetchingHistory} = useIncentives();
	const {safeChainID} = useChainID();
	const [sortBy, set_sortBy] = useState<'totalIncentive' | 'weight'>('totalIncentive');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('desc');

	/* 🔵 - Yearn Finance **************************************************************************
	**	Callback method used to sort the vaults list.
	**	The use of useCallback() is to prevent the method from being re-created on every render.
	**********************************************************************************************/
	const onSort = useCallback((newSortBy: 'totalIncentive' | 'weight', newSortDirection: string): void => {
		performBatchedUpdates((): void => {
			set_sortBy(newSortBy);
			set_sortDirection(newSortDirection as TSortDirection);
		});
	}, []);

	const toggleSortDirection = (newSortBy: string): TSortDirection => {
		return sortBy === newSortBy ? (
			sortDirection === '' ? 'desc' : sortDirection === 'desc' ? 'asc' : 'desc'
		) : 'desc';
	};

	const renderChevron = useCallback((shouldSortBy: boolean): ReactElement => {
		if (shouldSortBy && sortDirection === 'desc') {
			return <IconChevronPlain className={'yearn--sort-chevron transition-all'} />;
		}
		if (shouldSortBy && sortDirection === 'asc') {
			return <IconChevronPlain className={'yearn--sort-chevron rotate-180 transition-all'} />;
		}
		return <IconChevronPlain className={'yearn--sort-chevron--off text-neutral-300 transition-all group-hover:text-neutral-500'} />;
	}, [sortDirection]);

	return (
		<div className={'mt-8'}>
			<div aria-label={'header'} className={'mb-4 hidden grid-cols-12 px-4 md:grid'}>
				<div className={'col-span-6'}>
					<p className={'text-xs text-neutral-500'}>
						{'LST'}
					</p>
				</div>
				<div className={'col-span-3 -mr-2 flex justify-end text-right'}>
					<p
						onClick={(): void => onSort('totalIncentive', toggleSortDirection('totalIncentive'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'Incentives (USD)'}
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'totalIncentive')}
						</span>
					</p>
				</div>
				<div className={'col-span-3 -mr-2 flex justify-end text-right'}>
					<p
						onClick={(): void => onSort('weight', toggleSortDirection('weight'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'Current weight'}
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'weight')}
						</span>
					</p>
				</div>
			</div>

			{
				[...lst]
					.filter((e): boolean => Boolean(e))
					.sort((a, b): number => {
						const aProtocol = groupIncentiveHistory?.protocols?.[a.address];
						const bProtocol = groupIncentiveHistory?.protocols?.[b.address];
						let aValue = 0;
						let bValue = 0;
						if (sortBy === 'totalIncentive') {
							aValue = aProtocol?.normalizedSum || 0;
							bValue = bProtocol?.normalizedSum || 0;
						} else if (sortBy === 'weight') {
							aValue = Number(a.weight.normalized);
							bValue = Number(b.weight.normalized);
						}
						return sortDirection === 'desc' ? Number(bValue) - Number(aValue) : Number(aValue) - Number(bValue);
					})
					.map((lst): ReactElement => {
						const item = groupIncentiveHistory?.protocols?.[lst.address] || undefined;
						return (
							<div
								key={lst.address}
								aria-label={'content'}
								className={'my-0.5 grid grid-cols-12 rounded-sm bg-neutral-100/50 p-4 transition-colors open:bg-neutral-100 hover:bg-neutral-100'}>
								<div className={'col-span-12 flex w-full flex-row items-center space-x-6 md:col-span-6'}>
									<div className={'h-10 w-10 min-w-[40px]'}>
										<ImageWithFallback
											src={`https://assets.smold.app/api/token/${safeChainID}/${toAddress(lst?.address)}/logo-128.png`}
											alt={''}
											unoptimized
											width={40}
											height={40} />
									</div>
									<div className={'flex flex-col'}>
										<p className={'whitespace-nowrap'}>
											{lst?.symbol || truncateHex(lst.address, 6)}
										</p>
										<small className={'whitespace-nowrap text-xs'}>
											{lst.name}
										</small>
									</div>
								</div>
								<div className={'col-span-12 mt-4 flex items-center justify-between md:col-span-3 md:mt-0 md:justify-end'}>
									<small className={'block text-neutral-500 md:hidden'}>
										{'Total incentive (USD)'}
									</small>
									<p suppressHydrationWarning className={'font-number'}>
										{`$${formatAmount(item?.normalizedSum || 0, 2, 2)}`}
									</p>
								</div>
								<div className={'col-span-12 mt-2 flex items-center justify-between md:col-span-3 md:mt-0 md:justify-end'}>
									<small className={'block text-neutral-500 md:hidden'}>
										{'Current weight'}
									</small>
									<p suppressHydrationWarning className={'font-number'}>
										{formatPercent(Number(lst?.weight.normalized || 0) * 100)}
									</p>
								</div>
							</div>
						);
					})}

			{isFetchingHistory && (
				<div className={'mt-6 flex flex-row items-center justify-center'}>
					<IconSpinner className={'!h-6 !w-6 !text-neutral-400'} />
				</div>
			)}

		</div>
	);
}

export {VoteCardWeights};
