import React, {useCallback, useMemo, useState} from 'react';
import Link from 'next/link';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import IconChevronPlain from 'components/icons/IconChevronPlain';
import IconSpinner from 'components/icons/IconSpinner';
import useBootstrap from 'contexts/useBootstrap';
import useLST from 'contexts/useLST';
import {useEpoch} from 'hooks/useEpoch';
import useIncentives from 'hooks/useIncentives';
import {useTimer} from 'hooks/useTimer';
import {POTENTIAL_LST} from 'utils/constants';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {Renderable} from '@yearn-finance/web-lib/components/Renderable';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount, formatPercent} from '@yearn-finance/web-lib/utils/format.number';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {ReactElement} from 'react';

type TSortDirection = '' | 'desc' | 'asc'

function Timer(): ReactElement {
	const {endPeriod} = useEpoch();
	const time = useTimer({endTime: endPeriod});
	return <>{`in ${time}`}</>;
}


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
				lst
					.filter((e): boolean => Boolean(e))
					// .filter((item): boolean => Boolean(groupIncentiveHistory.protocols[item.address]))
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

function VoteCardWhitelist(): ReactElement {
	const {lst} = useLST();
	const {incentives: {isFetchingHistory}} = useBootstrap();
	const [sortBy, set_sortBy] = useState<'totalIncentive'>('totalIncentive');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('desc');

	/* 🔵 - Yearn Finance **************************************************************************
	**	Callback method used to sort the vaults list.
	**	The use of useCallback() is to prevent the method from being re-created on every render.
	**********************************************************************************************/
	const onSort = useCallback((newSortBy: 'totalIncentive', newSortDirection: string): void => {
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


	if (!process.env.IS_WHITELISTING_VOTE_ENABLED) {
		return (
			<div className={'mt-10'}>
				<p className={'whitespace-pre text-neutral-700'}>{'There is nobody to be whitelisted yet\nnothing to worry about anon'}</p>
			</div>
		);
	}
	return (
		<div className={'mt-8'}>
			<div aria-label={'header'} className={'mb-4 hidden grid-cols-12 px-4 md:grid'}>
				<div className={'col-span-6'}>
					<p className={'text-xs text-neutral-500'}>
						{'LST'}
					</p>
				</div>
				<div className={'col-span-6 -mr-2 flex justify-end text-right'}>
					<p
						onClick={(): void => onSort('totalIncentive', toggleSortDirection('totalIncentive'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'Incentives (USD)'}
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'totalIncentive')}
						</span>
					</p>
				</div>
			</div>

			{POTENTIAL_LST
				.filter((item): boolean => Boolean(!lst.find((e): boolean => e.address === item.address)))
				.filter((e): boolean => Boolean(e))
				.map((item): ReactElement => {
					console.warn(item);
					return (
						<div
							key={item.address}
							aria-label={'content'}
							className={'my-0.5 grid grid-cols-12 rounded-sm bg-neutral-100/50 p-4 transition-colors open:bg-neutral-100 hover:bg-neutral-100'}>
							<div className={'col-span-12 flex w-full flex-row items-center space-x-6 md:col-span-6'}>
								<div className={'h-10 w-10 min-w-[40px]'}>
									<ImageWithFallback
										src={item.logoURI}
										alt={''}
										unoptimized
										width={40}
										height={40} />
								</div>
								<div className={'flex flex-col'}>
									<p className={'whitespace-nowrap'}>
										{item.symbol || truncateHex(item.address, 6)}
									</p>
									<small className={'whitespace-nowrap text-xs'}>
										{item.name}
									</small>
								</div>
							</div>
							<div className={'col-span-12 mt-4 flex items-center justify-between md:col-span-6 md:mt-0 md:justify-end'}>
								<small className={'block text-neutral-500 md:hidden'}>
									{'Total incentive (USD)'}
								</small>
								<p className={'font-number'}>
									{`$${formatAmount(0, 2, 2)}`}
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

function VoteCards(): ReactElement {
	return (
		<div className={'grid grid-cols-20 divide-x-0 divide-y divide-neutral-300 bg-neutral-100 md:divide-x md:divide-y-0'}>
			<div className={'pr-r col-span-20 flex flex-col p-4 md:col-span-11 md:px-72 md:py-10'}>
				<b className={'text-xl font-black'}>{'Weights vote'}</b>
				<VoteCardWeights />
				<div className={'mt-auto pt-10'}>
					<Link href={'https://snapshot.org/#/ylsd.eth'}>
						<Button className={'w-full md:w-[264px]'}>{'Vote on Snapshot'}</Button>
					</Link>
				</div>
			</div>

			<div className={'col-span-20 flex flex-col px-4 py-10 md:col-span-9 md:px-72'}>
				<b className={'text-xl font-black'}>{'Whitelisting vote'}</b>
				<VoteCardWhitelist />
				{process.env.IS_WHITELISTING_VOTE_ENABLED && (
					<div className={'mt-auto pt-10'}>
						<Button
							isDisabled={!(process.env.IS_WHITELISTING_VOTE_ENABLED)}
							href={'https://snapshot.org/#/ylsd.eth'}
							className={'w-full md:w-[264px]'}>
							{'Vote on Snapshot'}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

function ViewHeader(): ReactElement {
	const {whitelistedLST: {whitelistedLST}, voting: {voteData}} = useBootstrap();

	const totalVotePowerNormalized = useMemo((): number => {
		return Number(voteData.votesAvailable.normalized) + Number(voteData.votesUsed.normalized);
	}, [voteData]);

	const totalVotesNormalized = useMemo((): number => {
		let sum = 0n;
		for (const item of Object.values(whitelistedLST)) {
			sum += item.extra.votes || 0n;
		}
		return Number(toNormalizedBN(sum).normalized);
	}, [whitelistedLST]);

	return (
		<div className={'mb-10 flex w-full flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>
				{'Vote'}
			</h1>
			<b
				suppressHydrationWarning
				className={'font-number mt-4 text-4xl text-purple-300'}>
				<Timer />
			</b>
			<div className={'flex w-full flex-col items-center gap-4 md:grid-cols-1 md:flex-row md:gap-6'}>
				<div className={'w-full'}>
					<p className={'text-neutral-700'}>
						{'st-yETH holders, it’s time to be (metaphorically) wined and dined by the LST protocols vying for a spot in yETH. Decide which LST gets your votes below, and remember you will recieve incentives from the winning LSTs whether you voted for them or not. So follow your heart anon.'}
					</p>
				</div>
				<div className={'flex w-full justify-end space-x-4 md:w-auto'}>
					<div className={'w-full min-w-[200px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'pb-2'}>{'Total Votes, yETH'}</p>
						<b suppressHydrationWarning className={'font-number text-3xl'}>
							<Renderable shouldRender={true} fallback ={'-'}>
								{formatAmount(totalVotesNormalized, 2, 2)}
							</Renderable>
						</b>
					</div>
					<div className={'w-full min-w-[200px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'whitespace-nowrap pb-2'}>{'Your vote power this epoch, yETH'}</p>
						<b suppressHydrationWarning className={'font-number text-3xl'}>
							<Renderable shouldRender={true} fallback ={'-'}>
								{formatAmount(totalVotePowerNormalized, 4, 4)}
							</Renderable>
						</b>
					</div>
				</div>
			</div>
		</div>
	);
}

function Vote(): ReactElement {
	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>

				<ViewHeader />

				<VoteCards />
			</div>
		</section>
	);
}

export default Vote;
