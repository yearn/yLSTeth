import React, {useCallback, useState} from 'react';
import Link from 'next/link';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import IconChevronPlain from 'components/icons/IconChevronPlain';
import useLST from 'contexts/useLST';
import IconLinkOut from '@yearn-finance/web-lib/icons/IconLinkOut';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {formatDate} from '@yearn-finance/web-lib/utils/format.time';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {AnimationScope} from 'framer-motion';
import type {ReactElement} from 'react';

function LSTInPoolStats(): ReactElement {
	const {stats} = useLST();
	const hasRampStopTime = Boolean(stats?.rampStopTime && stats?.rampStopTime > 0);

	return (
		<div className={'-mt-4 px-4 md:mt-10 md:px-[72px]'}>
			<dl className={'grid grid-cols-3 flex-row gap-10 text-neutral-0 md:flex'}>
				<div>
					<dt className={'mb-2 text-xs'}>{'Daily Volume'}</dt>
					<dd className={'font-number font-bold'}>
						{'◼︎◼︎◼︎ USD'}  {/* TODO: ADD DAILY VOLUME */}
					</dd>
				</div>

				<div>
					<dt className={'mb-2 text-xs'}>{'Net APY'}</dt>
					<dd className={'font-number font-bold'}>
						{'◼︎◼︎◼︎ %'}  {/* TODO: ADD NET APY */}
					</dd>
				</div>

				<div>
					<dt className={'mb-2 text-xs'}>{'Swap Fee'}</dt>
					<dd suppressHydrationWarning className={'font-number font-bold'}>
						{`${formatAmount(toNormalizedBN(stats.swapFeeRate, 16).normalized, 2, 2)}%`}
					</dd>
				</div>

				<div>
					<dt className={'mb-2 text-xs'}>{'Virtual Price'}</dt>
					<dd className={'font-number font-bold'}>
						{'◼︎◼︎◼︎ USD'}  {/* TODO: ADD VIRTUAL PRICE */}
					</dd>
				</div>

				<div>
					<dt className={'mb-2 text-xs'}>{'A'}</dt>
					<dd suppressHydrationWarning className={'font-number font-bold'}>
						{formatAmount(toNormalizedBN(stats.amplification).normalized, 0, 0)}
					</dd>
				</div>

				{hasRampStopTime && (
					<>
						<div>
							<dt className={'mb-2 text-xs'}>{'Rumping up A'}</dt>
							<dd suppressHydrationWarning className={'font-number font-bold'} >
								{`${formatAmount(toNormalizedBN(stats.amplification).normalized, 0, 0)}->${formatAmount(toNormalizedBN(stats.targetAmplification).normalized, 0, 0)}`}
							</dd>
						</div>

						<div>
							<dt className={'mb-2 text-xs'}>{'Rump up A ends on'}</dt>
							<dd className={'font-number font-bold'} suppressHydrationWarning>
								{formatDate(Number(stats.rampStopTime) * 1000)}
							</dd>
						</div>
					</>
				)}
			</dl>
		</div>
	);
}

type TSortDirection = '' | 'desc' | 'asc'
function LSTInPool({scope}: {scope: AnimationScope}): ReactElement {
	const {lst} = useLST();
	const [sortBy, set_sortBy] = useState<string>('');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('');

	/* 🔵 - Yearn Finance **************************************************************************
	**	Callback method used to sort the pool token list.
	**	The use of useCallback() is to prevent the method from being re-created on every render.
	**********************************************************************************************/
	const onSort = useCallback((newSortBy: string, newSortDirection: string): void => {
		performBatchedUpdates((): void => {
			set_sortBy(newSortBy);
			set_sortDirection(newSortDirection as TSortDirection);
		});
	}, []);

	/* 🔵 - Yearn Finance **************************************************************************
	**	Callback method used to toggle the sort direction.
	**	By default, the sort direction is descending. If the user clicks on the same column again,
	**	the sort direction will be toggled to ascending. If the user clicks on a different column,
	**	the sort direction will be set to descending.
	**********************************************************************************************/
	const toggleSortDirection = (newSortBy: string): TSortDirection => {
		return sortBy === newSortBy ? (
			sortDirection === '' ? 'desc' : sortDirection === 'desc' ? 'asc' : 'desc'
		) : 'desc';
	};

	/* 🔵 - Yearn Finance **************************************************************************
	**	Callback method used to render the chevron icon.
	**	The chevron color and direction will change depending on the sort direction.
	**********************************************************************************************/
	const renderChevron = useCallback((shouldSortBy: boolean): ReactElement => {
		if (shouldSortBy && sortDirection === 'desc') {
			return <IconChevronPlain className={cl('!text-neutral-0', 'yearn--sort-chevron transition-all')} />;
		}
		if (shouldSortBy && sortDirection === 'asc') {
			return <IconChevronPlain className={cl('!text-neutral-0', 'yearn--sort-chevron rotate-180 transition-all')} />;
		}
		return <IconChevronPlain className={cl('!text-neutral-100/30 group-hover:!text-neutral-0', 'yearn--sort-chevron--off text-neutral-300 transition-all group-hover:text-neutral-500')} />;
	}, [sortDirection]);

	return (
		<div
			ref={scope}
			className={'pointer-events-none flex h-0 min-h-0 flex-col opacity-0'}>
			<div className={'-mt-36'}>
				<LSTInPoolStats />

				<div className={'mt-10 grid grid-cols-2 flex-row gap-4 px-4 md:flex md:px-[72px]'}>
					<Link href={`https://etherscan.io/address/${process.env.POOL_ADDRESS}`} target={'_blank'}>
						<div className={'flex cursor-pointer flex-row items-center justify-center rounded border border-neutral-0 px-3 py-2 text-center text-xs text-neutral-0 transition-colors hover:bg-neutral-0 hover:text-purple-300'}>
							{'Pool'}
							<IconLinkOut className={'ml-2 h-4 w-4'} />
						</div>
					</Link>

					<Link href={`https://etherscan.io/address/${process.env.YETH_ADDRESS}`} target={'_blank'}>
						<div className={'flex cursor-pointer flex-row items-center justify-center rounded border border-neutral-0 px-3 py-2 text-center text-xs text-neutral-0 transition-colors hover:bg-neutral-0 hover:text-purple-300'}>
							{'yETH'}
							<IconLinkOut className={'ml-2 h-4 w-4'} />
						</div>
					</Link>

					<Link href={`https://etherscan.io/address/${process.env.STYETH_ADDRESS}`} target={'_blank'}>
						<div className={'flex cursor-pointer flex-row items-center justify-center rounded border border-neutral-0 px-3 py-2 text-center text-xs text-neutral-0 transition-colors hover:bg-neutral-0 hover:text-purple-300'}>
							{'st-yETH Vault'}
							<IconLinkOut className={'ml-2 h-4 w-4'} />
						</div>
					</Link>

					<Link href={`https://etherscan.io/address/${process.env.STYETH_ADDRESS}`} target={'_blank'}>
						<div className={'flex cursor-pointer flex-row items-center justify-center rounded border border-neutral-0 px-3 py-2 text-center text-xs text-neutral-0 transition-colors hover:bg-neutral-0 hover:text-purple-300'}>
							{'st-yETH'}
							<IconLinkOut className={'ml-2 h-4 w-4'} />
						</div>
					</Link>

				</div>

				<div className={'mt-10 w-full rounded bg-neutral-100/10 py-10 text-neutral-0'}>
					<div className={'mb-4 px-4 md:px-[72px]'}>
						<h2 className={'text-2xl font-bold'}>
							{'LSTs in Pool'}
						</h2>
					</div>

					<div className={'hidden grid-cols-10 gap-10 px-4 md:grid md:px-[72px]'}>
						<div className={'col-span-6'}>
							<p className={'text-xs'}>
								{'Token'}
							</p>
						</div>
						<button
							onClick={(): void => onSort('amount', toggleSortDirection('amount'))}
							className={'group col-span-2 -mr-1.5 flex cursor-pointer flex-row justify-end'}>
							<p className={'text-right text-xs'}>
								{'Amount in pool'}
							</p>
							<span className={'pl-2'}>
								{renderChevron(sortBy === 'amount')}
							</span>
						</button>
						<button
							onClick={(): void => onSort('weight', toggleSortDirection('weight'))}
							className={'group col-span-2 -mr-1.5 flex cursor-pointer flex-row justify-end'}>
							<p className={'text-right text-xs'}>
								{'Target weight bands'}
							</p>
							<span className={'pl-2'}>
								{renderChevron(sortBy === 'weight')}
							</span>
						</button>
					</div>

					<div className={'mt-6 grid divide-y divide-neutral-0/20 md:divide-y-0'}>
						{lst
							.sort((a, b): number => {
								if (sortBy === 'amount') {
									return sortDirection === 'desc' ? Number(b.virtualPoolSupply.normalized) - Number(a.virtualPoolSupply.normalized) : Number(a.virtualPoolSupply.normalized) - Number(b.virtualPoolSupply.normalized);
								}
								if (sortBy === 'weight') {
									return sortDirection === 'desc' ? Number(b.targetWeight.normalized) - Number(a.targetWeight.normalized) : Number(a.targetWeight.normalized) - Number(b.targetWeight.normalized);
								}
								return 0;
							}).map((token): ReactElement => {
								return (
									<Link key={token.address} href={`https://etherscan.io/address/${token.address}`} target={'_blank'}>
										<div
											className={'grid grid-cols-6 gap-2 px-4 py-6 hover:bg-neutral-100/10 md:grid-cols-10 md:gap-10 md:px-[72px] md:py-3'}>

											<div className={'col-span-6 flex flex-row items-center'}>
												<div className={'h-10 w-10 min-w-[40px]'}>
													<ImageWithFallback
														alt={token.name}
														unoptimized
														src={token.logoURI}
														width={40}
														height={40} />
												</div>
												<p className={'pl-6'}>{token.symbol}</p>
											</div>

											<div className={'col-span-6 flex w-full flex-row items-center justify-between md:col-span-2 md:justify-end'}>
												<div className={'flex md:hidden'}>
													<p className={'text-xs text-neutral-0/60'}>{'Amount in pool'}</p>
												</div>
												<div className={'font-number text-right'}>
													<b suppressHydrationWarning>
														{`${formatAmount(Number(token?.virtualPoolSupply?.normalized || 0), 4, 4)}%`}
													</b>
													<p suppressHydrationWarning>{formatAmount(token?.poolSupply?.normalized || 0, 6, 6)}</p>
												</div>
											</div>


											<div className={'col-span-6 flex w-full flex-row items-center justify-between md:col-span-2 md:justify-end'}>
												<div className={'flex md:hidden'}>
													<p className={'text-xs text-neutral-0/60'}>{'Target Weight Bands'}</p>
												</div>
												<div
													suppressHydrationWarning
													className={'font-number flex items-center justify-end text-right'}>
													{formatAmount(token?.targetWeight?.normalized || 0, 6, 6)}
												</div>
											</div>

										</div>
									</Link>
								);
							})}

					</div>
				</div>
			</div>
		</div>
	);
}

export default LSTInPool;
