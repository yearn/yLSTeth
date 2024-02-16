import React, {useCallback, useState} from 'react';
import IconChevronPlain from 'app/components/icons/IconChevronPlain';
import IconSpinner from 'app/components/icons/IconSpinner';
import useLST from 'app/contexts/useLST';
import {NO_CHANGE_LST_LIKE} from 'app/utils/constants';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl, formatAmount, formatPercent, isZeroAddress, toAddress, truncateHex} from '@builtbymom/web3/utils';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {ImageWithFallback} from '@yearn-finance/web-lib/components/ImageWithFallback';

import type {TLST} from 'app/hooks/useLSTData';
import type {TSortDirection} from 'app/utils/types';
import type {ReactElement} from 'react';
import type {TDict} from '@builtbymom/web3/types';

function VoteCardWeights(): ReactElement {
	const {address} = useWeb3();
	const {lst} = useLST();
	const {
		incentives: {groupIncentiveHistory, isFetchingHistory}
	} = useLST();
	const {safeChainID} = useChainID();
	const [sortBy, set_sortBy] = useState<'totalIncentive' | 'weight'>('totalIncentive');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('desc');
	const [votePowerPerLST, set_votePowerPerLST] = useState<TDict<number>>({});

	/* 🔵 - Yearn Finance **************************************************************************
	 **	Callback method used to sort the vaults list.
	 **	The use of useCallback() is to prevent the method from being re-created on every render.
	 **********************************************************************************************/
	const onSort = useCallback((newSortBy: 'totalIncentive' | 'weight', newSortDirection: string): void => {
		set_sortBy(newSortBy);
		set_sortDirection(newSortDirection as TSortDirection);
	}, []);

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

	const onVote = useCallback((): void => {
		const sumOfVotes = Object.values(votePowerPerLST).reduce((a, b) => a + b, 0);
		const votes = [];
		for (const item of lst) {
			const numberOfVoteForThisLST = votePowerPerLST[item.address] || 0;
			votes[item.index] = Math.floor((numberOfVoteForThisLST / sumOfVotes) * 1e18);
		}
		const numberOfVoteForNoChange = votePowerPerLST[NO_CHANGE_LST_LIKE.address] || 0;
		votes.unshift(Math.floor((numberOfVoteForNoChange / sumOfVotes) * 1e18));

		const totalVotePower = votes.reduce((a, b) => a + b, 0);
		if (totalVotePower > 10_000) {
			votes[0] += 10_000 - totalVotePower;
		}

		console.log(votes);
	}, [lst, votePowerPerLST]);

	return (
		<div className={'mt-8'}>
			<div
				aria-label={'header'}
				className={'mb-4 hidden grid-cols-12 px-4 md:grid'}>
				<div className={'col-span-3'}>
					<p className={'text-xs text-neutral-500'}>{'LST'}</p>
				</div>
				<div className={'col-span-3 -mr-2 flex justify-end text-right'}>
					<p
						onClick={(): void => onSort('totalIncentive', toggleSortDirection('totalIncentive'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'Incentives (USD)'}
						<span className={'pl-2'}>{renderChevron(sortBy === 'totalIncentive')}</span>
					</p>
				</div>
				<div className={'col-span-3 -mr-2 flex justify-end text-right'}>
					<p
						onClick={(): void => onSort('weight', toggleSortDirection('weight'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'Current weight'}
						<span className={'pl-2'}>{renderChevron(sortBy === 'weight')}</span>
					</p>
				</div>
			</div>

			{[NO_CHANGE_LST_LIKE, ...lst]
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
						aValue = Number((a as TLST)?.weight?.normalized || 0);
						bValue = Number((b as TLST)?.weight?.normalized || 0);
					}
					return sortDirection === 'desc' ? Number(bValue) - Number(aValue) : Number(aValue) - Number(bValue);
				})
				.map((currentLST): ReactElement => {
					const item = groupIncentiveHistory?.protocols?.[currentLST.address] || undefined;
					return (
						<div
							key={currentLST.address}
							aria-label={'content'}
							className={
								'my-0.5 grid grid-cols-12 rounded-sm bg-neutral-100/50 p-4 transition-colors open:bg-neutral-100 hover:bg-neutral-100'
							}>
							<div className={'col-span-12 flex w-full flex-row items-center space-x-6 md:col-span-3'}>
								<div className={'size-10 min-w-[40px]'}>
									<ImageWithFallback
										src={
											currentLST.logoURI ||
											`https://assets.smold.app/api/token/${safeChainID}/${toAddress(
												currentLST?.address
											)}/logo-128.png`
										}
										alt={''}
										unoptimized
										width={40}
										height={40}
									/>
								</div>
								<div className={'flex flex-col'}>
									<p className={'whitespace-nowrap'}>
										{currentLST?.symbol || truncateHex(currentLST.address, 6)}
									</p>
									<small className={'whitespace-nowrap text-xs'}>{currentLST.name}</small>
								</div>
							</div>
							<div
								className={
									'col-span-12 mt-4 flex items-center justify-between md:col-span-3 md:mt-0 md:justify-end'
								}>
								<small className={'block text-neutral-500 md:hidden'}>{'Total incentive (USD)'}</small>
								<p
									suppressHydrationWarning
									className={'font-number'}>
									{`$${formatAmount(item?.normalizedSum || 0, 2, 2)}`}
								</p>
							</div>
							<div
								className={
									'col-span-12 mt-2 flex items-center justify-between md:col-span-3 md:mt-0 md:justify-end'
								}>
								<small className={'block text-neutral-500 md:hidden'}>{'Current weight'}</small>
								<p
									suppressHydrationWarning
									className={'font-number'}>
									{formatPercent(Number((currentLST as TLST)?.weight?.normalized || 0) * 100)}
								</p>
							</div>

							<div className={'col-span-12 mt-2 flex w-full items-center pl-[40%] md:col-span-3 md:mt-0'}>
								<div className={'grid h-10 w-full grid-cols-4 items-center rounded-lg bg-neutral-0'}>
									<div className={'flex items-center justify-start pl-1'}>
										<button
											disabled={!votePowerPerLST[currentLST.address]}
											onClick={() =>
												set_votePowerPerLST(p => ({
													...p,
													[currentLST.address]:
														p[currentLST.address] === 0 ? 0 : p[currentLST.address] - 1
												}))
											}
											className={cl(
												'flex size-8 items-center justify-center rounded-lg bg-neutral-100',
												'text-xl transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed',
												'disabled:opacity-60 disabled:text-neutral-400'
											)}>
											{'-'}
										</button>
									</div>
									<div className={'col-span-2 text-center'}>
										<p
											suppressHydrationWarning
											className={cl(
												'font-number',
												!votePowerPerLST[currentLST.address] ? 'text-neutral-900/30' : ''
											)}>
											{`${formatAmount(
												((votePowerPerLST[currentLST.address] || 0) /
													Object.values(votePowerPerLST).reduce((a, b) => a + b, 0)) *
													100,
												0,
												2
											)}%`}
										</p>
									</div>
									<div className={'flex items-center justify-end pr-1'}>
										<button
											onClick={() =>
												set_votePowerPerLST(p => ({
													...p,
													[currentLST.address]: p[currentLST.address] + 1 || 1
												}))
											}
											className={
												'flex size-8 items-center justify-center rounded-lg bg-neutral-100 transition-colors hover:bg-neutral-200'
											}>
											<p className={'text-xl'}>{'+'}</p>
										</button>
									</div>
								</div>
							</div>
						</div>
					);
				})}

			{isFetchingHistory && (
				<div className={'mt-6 flex flex-row items-center justify-center'}>
					<IconSpinner className={'!h-6 !w-6 !text-neutral-400'} />
				</div>
			)}
			<div className={'mt-auto pt-10'}>
				<Button
					onClick={onVote}
					isDisabled={
						isFetchingHistory ||
						Object.values(votePowerPerLST).reduce((a, b) => a + b, 0) === 0 ||
						Object.values(votePowerPerLST).reduce((a, b) => a + b, 0) > 100 ||
						isZeroAddress(address)
					}
					className={'w-full md:w-[264px]'}>
					{'Vote'}
				</Button>
			</div>
		</div>
	);
}

export {VoteCardWeights};
