import React, {Fragment, useMemo, useState} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl, formatAmount, formatPercent, toAddress, truncateHex} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@libComponents/ImageWithFallback';
import Toggle from '@libComponents/toggle';
import IconSpinner from '@libIcons/IconSpinner';
import {IconChevronBottom} from '@yearn-finance/web-lib/icons/IconChevronBottom';
import {SubIncentiveWrapper} from '@yUSD/components/views/SubIncentiveWrapper';
import useBasket from '@yUSD/contexts/useBasket';
import useInclusion from '@yUSD/contexts/useInclusion';
import useLST from '@yUSD/contexts/useLST';
import {usePrices} from '@yUSD/contexts/usePrices';
import {NO_CHANGE_LST_LIKE} from '@yUSD/utils/constants';
import {getCurrentEpochNumber} from '@yUSD/utils/epochs';

import type {ReactElement} from 'react';
import type {TDict} from '@builtbymom/web3/types';
import type {TIndexedTokenInfo, TTokenIncentive} from '@libUtils/types';

function IncentiveRow(props: {
	item: TIndexedTokenInfo;
	incentives: TDict<TTokenIncentive[]>;
	shouldDisplayUserIncentive: boolean;
}): ReactElement {
	const {address} = useWeb3();
	const {getPrice} = usePrices();
	const {totalDepositedETH} = useLST();
	const {safeChainID} = useChainID(Number(process.env.DEFAULT_CHAIN_ID));

	/**************************************************************************
	 ** This method calculates the total incentive value for the candidate.
	 ** It does so by iterating over the incentives and summing the value of
	 ** each.
	 **************************************************************************/
	const candidateIncentiveValue = useMemo((): number => {
		let sum = 0;
		for (const incentive of Object.values(props.incentives || {})) {
			// We don't care about this level for candidates incentives
			for (const eachIncentive of incentive) {
				const price = getPrice({address: eachIncentive.address});
				sum += eachIncentive.amount.normalized * price.normalized;
			}
		}
		return sum;
	}, [getPrice, props.incentives]);

	/**************************************************************************
	 ** This method calculates the value of incentives per staked basket token.
	 **************************************************************************/
	const candidateIncentivesPerStakedBasketToken = useMemo((): number => {
		let sum = 0;
		for (const incentive of Object.values(props.incentives || {})) {
			// We don't care about this level for candidates incentives
			for (const eachIncentive of incentive) {
				const price = getPrice({address: eachIncentive.address});
				const value = eachIncentive.amount.normalized * price.normalized;
				const usdPerStakedBasketToken = value / totalDepositedETH.normalized;
				sum += usdPerStakedBasketToken;
			}
		}
		return sum;
	}, [getPrice, props.incentives, totalDepositedETH.normalized]);

	/**************************************************************************
	 ** This method calculates the estimated APR for the candidate.
	 **************************************************************************/
	const candidateIncentivesEstimatedAPR = useMemo((): number => {
		let sum = 0;
		for (const incentive of Object.values(props.incentives || {})) {
			// We don't care about this level for candidates incentives
			for (const eachIncentive of incentive) {
				const price = getPrice({address: eachIncentive.address});
				const basketTokenPrice = getPrice({address: toAddress(process.env.STYUSD_ADDRESS)});
				const value = eachIncentive.amount.normalized * price.normalized;
				sum += ((value * 12) / totalDepositedETH.normalized) * basketTokenPrice.normalized;
			}
		}
		return sum;
	}, [getPrice, props.incentives, totalDepositedETH.normalized]);

	const allIncentives = useMemo((): TTokenIncentive[] => {
		const flattenIncentives = Object.values(props.incentives || {}).flat();
		if (props.shouldDisplayUserIncentive) {
			return flattenIncentives.filter(
				(incentive): boolean => toAddress(incentive.depositor) === toAddress(address)
			);
		}
		return flattenIncentives;
	}, [address, props.incentives, props.shouldDisplayUserIncentive]);

	const hasIncentives = allIncentives.length > 0;

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
			<summary
				className={cl(
					'grid grid-cols-12 p-4 px-0 md:px-72',
					hasIncentives ? 'cursor-pointer' : '!cursor-default'
				)}>
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
						{`$${formatAmount(candidateIncentiveValue, 2, 2)}`}
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
				<SubIncentiveWrapper incentives={allIncentives || []} />
			</div>
		</details>
	);
}

function IncentiveHistory(props: {
	epochToDisplay: number;
	set_epochToDisplay: (epoch: number) => void;
	currentTab: 'current' | 'potential';
}): ReactElement {
	const {candidates, inclusionIncentives, isLoaded: isInclusionLoaded} = useInclusion();
	const {assets, weightIncentives, isLoaded: isWeightLoaded} = useBasket();
	const [shouldDisplayUserIncentive, set_shouldDisplayUserIncentive] = useState<boolean>(false);

	/**********************************************************************************************
	 * Group to display, which is either the current assets or the potential candidates.
	 * The user can toggle between the two using the currentTab prop.
	 **********************************************************************************************/
	const groupToDisplay = useMemo((): TIndexedTokenInfo[] => {
		if (props.currentTab === 'current') {
			return assets;
		}
		return candidates;
	}, [assets, candidates, props.currentTab]);

	/**********************************************************************************************
	 * Group to display, which is either the current assets or the potential candidates.
	 * The user can toggle between the two using the currentTab prop.
	 **********************************************************************************************/
	const incentivesToDisplay = useMemo((): TDict<TDict<TTokenIncentive[]>> => {
		if (props.currentTab === 'current') {
			return weightIncentives;
		}
		return inclusionIncentives;
	}, [inclusionIncentives, props.currentTab, weightIncentives]);

	const epochs = useMemo((): number[] => {
		const epochArray = [];
		for (let i = 0; i <= getCurrentEpochNumber(); i++) {
			epochArray.push(i);
		}
		return epochArray;
	}, []);

	return (
		<div className={'mt-2 pt-8'}>
			<div className={'px-4 md:px-72'}>
				<b className={'text-xl font-black'}>{'Incentives'}</b>

				<div className={'flex flex-col justify-between md:flex-row'}>
					<div>
						<p className={'mb-1 text-neutral-600'}>{'Select epoch'}</p>
						<div
							className={cl(
								'grow-1 col-span-5 flex h-10 w-full items-center justify-start rounded-md p-2 bg-neutral-0 md:w-[264px] mb-9'
							)}>
							<select
								className={
									'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 outline-none'
								}
								onChange={(e): void => props.set_epochToDisplay(Number(e.target.value))}
								value={props.epochToDisplay}
								defaultValue={getCurrentEpochNumber()}>
								{epochs.map(
									(index): ReactElement => (
										<option
											key={index}
											value={index}>
											{index === getCurrentEpochNumber() ? 'Current' : `Epoch ${index + 1}`}
										</option>
									)
								)}
							</select>
						</div>
					</div>
					<div className={'flex flex-row items-center space-x-2'}>
						<p
							className={cl(
								shouldDisplayUserIncentive ? 'font-bold text-primary' : 'font-normal text-neutral-600'
							)}>
							{'Show my incentives'}
						</p>
						<Toggle
							bgOffColor={'bg-neutral-0'}
							isEnabled={shouldDisplayUserIncentive}
							onChange={(): void => set_shouldDisplayUserIncentive(!shouldDisplayUserIncentive)}
						/>
					</div>
				</div>

				<div
					aria-label={'header'}
					className={'my-4 hidden grid-cols-12 md:grid'}>
					<div className={'col-span-5'}>
						<p className={'text-xs text-neutral-500'}>{'LST'}</p>
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
				{[NO_CHANGE_LST_LIKE, ...groupToDisplay].map((item): ReactElement => {
					return (
						<IncentiveRow
							key={`${item.address}_${props.epochToDisplay}`}
							incentives={incentivesToDisplay[toAddress(item.address)]}
							shouldDisplayUserIncentive={shouldDisplayUserIncentive}
							item={item}
						/>
					);
				})}

				{props.currentTab === 'current' && !isWeightLoaded && (
					<div className={'mt-6 flex flex-row items-center justify-center pb-12 pt-6'}>
						<IconSpinner className={'!h-6 !w-6 !text-neutral-400'} />
					</div>
				)}
				{props.currentTab === 'potential' && !isInclusionLoaded && (
					<div className={'mt-6 flex flex-row items-center justify-center pb-12 pt-6'}>
						<IconSpinner className={'!h-6 !w-6 !text-neutral-400'} />
					</div>
				)}
			</div>
		</div>
	);
}

export {IncentiveHistory};
