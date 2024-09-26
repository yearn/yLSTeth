import React, {Fragment, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/router';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl, formatAmount, formatPercent, toAddress, truncateHex} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@libComponents/ImageWithFallback';
import {IconChevronBottom} from '@yearn-finance/web-lib/icons/IconChevronBottom';
import {SubIncentiveWrapper} from '@yUSD/components/bootstrapViews/SubIncentiveWrapper';
import useBootstrap from '@yUSD/contexts/useBootstrap';

import type {ReactElement} from 'react';
import type {TIndexedTokenInfo} from '@libUtils/types';

function IncentiveHistoryTabs(props: {
	currentTab: 'all' | 'your';
	set_currentTab: (tab: 'all' | 'your') => void;
}): ReactElement {
	const router = useRouter();

	useEffect((): void => {
		const urlParams = new URLSearchParams(window.location.search);
		const filter = urlParams.get('filter');

		if (filter === 'all' || filter === 'your') {
			props.set_currentTab(filter);
		} else if (router.query?.filter === 'all' || router.query?.filter === 'your') {
			props.set_currentTab(router.query.filter);
		}
	}, [props.set_currentTab, router.query]);

	return (
		<div className={'overflow-hidden'}>
			<div className={'-mx-42 relative'}>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {filter: 'all'}}, undefined, {scroll: false});
					}}
					className={cl(
						'mx-4 mb-2 text-lg transition-colors',
						props.currentTab === 'all' ? 'font-bold' : 'text-neutral-400'
					)}>
					{'All Incentives'}
				</button>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {filter: 'your'}}, undefined, {scroll: false});
					}}
					className={cl(
						'mx-4 mb-2 text-lg transition-colors',
						props.currentTab === 'your' ? 'font-bold' : 'text-neutral-400'
					)}>
					{'Your Incentives'}
				</button>
				<div className={'absolute bottom-0 left-0 flex h-0.5 w-full flex-row bg-neutral-300'}>
					<div
						className={cl(
							'h-full w-fit transition-colors px-4',
							props.currentTab === 'all' ? 'bg-black' : 'bg-transparent'
						)}>
						<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>
							{'All Incentives'}
						</button>
					</div>
					<div
						className={cl(
							'h-full w-fit transition-colors pl-4',
							props.currentTab === 'your' ? 'bg-black' : 'bg-transparent'
						)}>
						<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>
							{'Your Incentives'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function IncentiveRow(props: {item: TIndexedTokenInfo; currentTab: 'all' | 'your'}): ReactElement {
	const {
		incentives: {
			totalDepositedUSD,
			totalSupply,
			groupIncentiveHistory: {protocols, user}
		}
	} = useBootstrap();
	const {safeChainID} = useChainID(Number(process.env.DEFAULT_CHAIN_ID));

	const protocolIncentives = useMemo(
		() => protocols?.[props.item.address]?.incentives || [],
		[props.item.address, protocols]
	);
	const userIncentives = useMemo(() => user?.[props.item.address]?.incentives || [], [props.item.address, user]);

	/**********************************************************************************************
	 * Group to display, which is either the current assets or the potential candidates.
	 * The user can toggle between the two using the currentTab prop.
	 **********************************************************************************************/
	const incentivesToDisplay = useMemo(() => {
		if (props.currentTab === 'all') {
			return protocolIncentives;
		}
		return userIncentives;
	}, [props.currentTab, protocolIncentives, userIncentives]);

	/**************************************************************************
	 ** This method calculates the total incentive value for the candidate.
	 ** It does so by iterating over the incentives and summing the value of
	 ** each.
	 **************************************************************************/
	const candidateIncentiveValue = protocolIncentives.reduce((acc, current) => acc + current.value, 0);

	/**************************************************************************
	 ** This method calculates the total incentive value for the candidate.
	 ** It does so by iterating over the user's incentives and summing the value of
	 ** each.
	 **************************************************************************/
	const candidateIncentiveValueForUser = userIncentives.reduce((acc, current) => acc + current.value, 0);

	/**********************************************************************************************
	 * Group to display, which is either the current assets or the potential candidates.
	 * The user can toggle between the two using the currentTab prop.
	 **********************************************************************************************/
	const valueToDisplay = useMemo(() => {
		if (props.currentTab === 'all') {
			return candidateIncentiveValue;
		}
		return candidateIncentiveValueForUser;
	}, [candidateIncentiveValue, candidateIncentiveValueForUser, props.currentTab]);

	/**************************************************************************
	 ** This method calculates the value of incentives per staked basket token.
	 **************************************************************************/
	const candidateIncentivesPerStakedBasketToken = useMemo((): number => {
		let sum = 0;
		for (const incentive of protocolIncentives) {
			const usdPerStakedBasketToken = incentive.value / totalSupply.normalized;
			sum += usdPerStakedBasketToken;
		}
		return sum;
	}, [protocolIncentives, totalSupply.normalized]);

	/**************************************************************************
	 ** This method calculates the estimated APR for the candidate.
	 **************************************************************************/
	const candidateIncentivesEstimatedAPR = useMemo((): number => {
		const totalAPR = (candidateIncentiveValue / totalDepositedUSD.normalized) * 100;
		return totalAPR;
	}, [candidateIncentiveValue, totalDepositedUSD.normalized]);

	const hasIncentives = incentivesToDisplay.length > 0;

	if (!props.item) {
		return <Fragment />;
	}
	return (
		<details
			aria-label={'content'}
			className={cl(
				'border-b-2 border-neutral-0 bg-neutral-200/50 transition-colors open:bg-neutral-200',
				hasIncentives ? 'hover:bg-neutral-200' : ''
			)}
			onClick={(e): void => {
				if (!hasIncentives) {
					e.preventDefault();
					e.stopPropagation();
				}
			}}>
			<summary className={cl('grid grid-cols-12 p-4', hasIncentives ? 'cursor-pointer' : '!cursor-default')}>
				<div className={'col-span-12 flex w-full flex-row items-center space-x-6 md:col-span-5'}>
					<div className={'size-10 min-w-[40px]'}>
						<ImageWithFallback
							src={`https://assets.smold.app/api/token/${safeChainID}/${toAddress(
								props.item?.address
							)}/logo-128.png`}
							alt={''}
							unoptimized
							width={40}
							height={40}
						/>
					</div>
					<div className={'flex flex-col'}>
						<p className={'whitespace-nowrap'}>
							{props.item?.symbol || truncateHex(props.item.address, 6)}
						</p>
						<small className={'whitespace-nowrap text-xs'}>{props.item.name}</small>
					</div>
				</div>
				<div className={'col-span-12 mt-4 flex justify-between md:col-span-2 md:mt-0 md:justify-end'}>
					<small className={'block text-neutral-500 md:hidden'}>{'Total incentive (USD)'}</small>
					<p
						suppressHydrationWarning
						className={'font-number'}>
						{`$${formatAmount(valueToDisplay, 2, 2)}`}
					</p>
				</div>
				<div className={'col-span-12 mt-2 flex justify-between md:col-span-2 md:mt-0 md:justify-end'}>
					<small className={'block text-neutral-500 md:hidden'}>{'USD/st-yUSD'}</small>
					<p
						suppressHydrationWarning
						className={'font-number'}>
						{`$${formatAmount(candidateIncentivesPerStakedBasketToken, 2, 2)}`}
					</p>
				</div>
				<div className={'col-span-12 mt-2 flex justify-between md:col-span-2 md:mt-0 md:justify-end'}>
					<small className={'block text-neutral-500 md:hidden'}>{'st-yUSD vAPR'}</small>
					<p
						suppressHydrationWarning
						className={'font-number'}>
						{`${formatPercent(candidateIncentivesEstimatedAPR, 4)}`}
					</p>
				</div>
				<div className={'col-span-1 hidden justify-end md:flex'}>
					<IconChevronBottom
						className={cl('chev h-6 w-6 text-neutral-900', !hasIncentives ? 'opacity-20' : '')}
					/>
				</div>
			</summary>

			<div className={hasIncentives ? 'block' : 'hidden'}>
				<SubIncentiveWrapper incentives={incentivesToDisplay || []} />
			</div>
		</details>
	);
}

function IncentiveHistory(props: {epochToDisplay: number; set_epochToDisplay: (epoch: number) => void}): ReactElement {
	const {assets} = useBootstrap();

	const [currentTab, set_currentTab] = useState<'all' | 'your'>('all');

	return (
		<div className={'mt-2 pt-8'}>
			<div className={''}>
				<IncentiveHistoryTabs
					currentTab={currentTab}
					set_currentTab={set_currentTab}
				/>
				<div
					aria-label={'header'}
					className={'mb-4 mt-6 hidden grid-cols-12 px-4 md:grid'}>
					<div className={'col-span-5'}>
						<p className={'text-xs text-neutral-500'}>{'STABLE'}</p>
					</div>
					<div className={'col-span-2 flex justify-end'}>
						<p className={'group flex flex-row text-xs text-neutral-500 md:-mr-2'}>
							{'Total incentive (USD)'}
						</p>
					</div>
					<div className={'col-span-2 flex justify-end'}>
						<p className={'group flex flex-row text-xs text-neutral-500 md:-mr-2'}>{'USD/st-yUSD'}</p>
					</div>
					<div className={'col-span-2 flex justify-end'}>
						<p className={'group flex flex-row text-xs text-neutral-500 md:-mr-2'}>{'st-yUSD vAPR'}</p>
					</div>
					<div className={'col-span-1 flex justify-end'} />
				</div>
			</div>

			<div className={'min-h-[74px] bg-neutral-100'}>
				{assets.map((item): ReactElement => {
					return (
						<IncentiveRow
							key={`${item.address}_${props.epochToDisplay}`}
							currentTab={currentTab}
							item={item}
						/>
					);
				})}
			</div>
		</div>
	);
}

export {IncentiveHistory};
