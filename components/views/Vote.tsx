import React, {useCallback, useEffect, useMemo, useState} from 'react';
import assert from 'assert';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import IconChevronPlain from 'components/icons/IconChevronPlain';
import IconSpinner from 'components/icons/IconSpinner';
import useBootstrap from 'contexts/useBootstrap';
import {useTimer} from 'hooks/useTimer';
import {handleInputChangeEventValue} from 'utils';
import {vote} from 'utils/actions';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {Modal} from '@yearn-finance/web-lib/components/Modal';
import Renderable from '@yearn-finance/web-lib/components/Renderable';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount, formatPercent} from '@yearn-finance/web-lib/utils/format.number';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {ChangeEvent, ReactElement} from 'react';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

type TSortDirection = '' | 'desc' | 'asc'

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {voteBegin, voteEnd, voteStatus} = periods || {};
	const time = useTimer({endTime: voteStatus === 'started' ? Number(voteEnd?.result) : Number(voteBegin?.result)});
	return <>{voteStatus === 'ended' ? 'ended' : voteStatus === 'started' ? time : `in ${time}`}</>;
}


function VoteConfirmationModal({whitelistedLST, voteToSend, onSuccess, onCancel}: {
	whitelistedLST: TDict<TTokenInfo>,
	voteToSend: TDict<TNormalizedBN>,
	onSuccess: VoidFunction,
	onCancel: VoidFunction
}): ReactElement {
	const {isActive, provider} = useWeb3();
	const [voteStatus, set_voteStatus] = useState<TTxStatus>(defaultTxStatus);

	const protocols = useMemo((): TAddress[] => (
		Object.values(whitelistedLST)
			.filter((lst): boolean => voteToSend[lst.address]?.raw > 0n)
			.map((lst): TAddress => lst.address)
	), [whitelistedLST, voteToSend]);

	const amounts = useMemo((): bigint[] => (
		Object.values(voteToSend)
			.filter((amount): boolean => amount.raw > 0n)
			.map((amount): bigint => amount.raw)
	), [voteToSend]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Web3 action to incentivize a given protocol with a given token and amount.
	**********************************************************************************************/
	const onVote = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');

		const result = await vote({
			connector: provider,
			contractAddress: toAddress(process.env.BOOTSTRAP_ADDRESS),
			protocols: protocols,
			amounts: amounts,
			statusHandler: set_voteStatus
		});
		if (result.isSuccessful) {
			onSuccess();
		}
	}, [isActive, provider, protocols, amounts, onSuccess]);

	return (
		<div className={'w-full max-w-[400px] rounded-sm bg-neutral-0 p-6'}>
			<b className={'text-xl'}>{'Confirm your Voting'}</b>
			<div className={'mt-8 grid grid-cols-1 gap-4'}>
				<div className={'flex flex-row items-center justify-between'}>
					<small className={'text-xs text-neutral-500'}>{'LST'}</small>
					<small className={'text-xs text-neutral-500'}>{'Votes, st-yETH'}</small>
				</div>
				{Object.values(whitelistedLST)
					.filter((lst): boolean => voteToSend[lst.address]?.raw > 0n)
					.map((lst): ReactElement => (
						<div
							key={lst.address}
							className={'flex flex-row items-center justify-between'}>
							<p>{lst.name || truncateHex(lst.address, 6)}</p>
							<b>{formatAmount(voteToSend[lst.address]?.normalized, 6, 6)}</b>
						</div>
					))}
			</div>

			<div className={'mt-20'}>
				<Button
					onClick={onVote}
					isBusy={voteStatus.pending}
					isDisabled={
						protocols.length !== amounts.length
						// ||
					}
					className={'yearn--button w-full rounded-md !text-sm'}>
					{'Confirm'}
				</Button>
				<button
					onClick={onCancel}
					className={'mt-2 h-10 w-full text-center text-neutral-500 transition-colors hover:text-neutral-900'}>
					{'Cancel'}
				</button>
			</div>
		</div>
	);
}


type TVoteListItem = {
	item: TTokenInfo
	totalVotesRemaining: TNormalizedBN
	voteToSend: TNormalizedBN
	onChangeAmount: (e: ChangeEvent<HTMLInputElement>, item: TTokenInfo) => void
	updateToMax: (item: TTokenInfo) => void
}
function VoteListItem({
	item,
	totalVotesRemaining,
	voteToSend,
	onChangeAmount,
	updateToMax
}: TVoteListItem): ReactElement {
	const {
		voting: {voteData, isLoadingEvents},
		incentives: [groupIncentiveHistory]
	} = useBootstrap();

	/* 🔵 - Yearn Finance **************************************************************************
	** View function to round the amount and check if it is the max amount.
	**********************************************************************************************/
	const isMax = useMemo((): boolean => {
		const percent = Number(voteToSend?.normalized || 0n) / Number(voteData.votesAvailable.normalized) * 100;
		return (Math.round(percent * 100) / 100) === 100;
	}, [voteToSend?.normalized, voteData.votesAvailable.normalized]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Calculate the current weight of the vote for this protocol.
	**********************************************************************************************/
	const weight = useMemo((): number => {
		const totalVotes = Number(toNormalizedBN(toBigInt(item.extra?.totalVotes)).normalized);
		const itemVotes = Number(toNormalizedBN(toBigInt(item.extra?.votes)).normalized);
		if (totalVotes === 0) {
			return 0;
		}
		return itemVotes / totalVotes * 100;
	}, [item.extra?.totalVotes, item.extra?.votes]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Compute the sum of all incentives for this protocol.
	**********************************************************************************************/
	const sumOfAllIncentives = useMemo((): number => {
		let sum = 0;
		for (const eachIncentive of Object.values(groupIncentiveHistory.protocols)) {
			if (eachIncentive.protocol !== item.address) {
				continue;
			}
			sum += eachIncentive.normalizedSum;
		}
		return sum;
	}, [groupIncentiveHistory, item]);

	return (
		<div className={'mb-4 grid grid-cols-12 gap-4 bg-neutral-100 p-4 md:mb-0 md:gap-10 md:bg-neutral-0 md:px-0'}>
			<div className={'col-span-12 flex w-full flex-row items-center space-x-4 md:col-span-3 md:space-x-6'}>
				<div className={'h-6 w-6 min-w-[24px] md:h-10 md:w-10 md:min-w-[40px]'}>
					<ImageWithFallback
						key={`https://assets.smold.app/api/token/${process.env.BASE_CHAINID}/${item?.address}/logo-128.png`}
						src={`https://assets.smold.app/api/token/${process.env.BASE_CHAINID}/${item?.address}/logo-128.png`}
						alt={''}
						unoptimized
						width={40}
						height={40} />
				</div>
				<div>
					<p className={'whitespace-nowrap'}>
						{item.name || truncateHex(item.address, 6)}
					</p>
				</div>
			</div>

			<div className={'col-span-12 grid grid-cols-12 gap-4 md:col-span-6'}>
				<div className={'col-span-12 flex h-auto items-center justify-between pr-0 md:col-span-4 md:h-10 md:justify-end md:pr-1'}>
					<small className={'block text-neutral-500 md:hidden'}>{'Total incentive'}</small>
					<div className={'text-right'}>
						<b suppressHydrationWarning className={'font-number'}>
							<Renderable shouldRender={true} fallback ={'-'}>
								{`$ ${formatAmount(sumOfAllIncentives, 2, 2)}`}
							</Renderable>
						</b>
						<p suppressHydrationWarning className={'font-number whitespace-nowrap text-xs'}>
							<Renderable shouldRender={true} fallback ={'-'}>
								{`${formatAmount(groupIncentiveHistory.protocols[item.address]?.usdPerStETH || 0, 6, 6)} USD/st-yETH`}
							</Renderable>
						</p>
					</div>
				</div>

				<div className={'col-span-12 flex h-auto items-center justify-between pr-0 md:col-span-2 md:h-10 md:justify-end md:pr-1'}>
					<small className={'block text-neutral-500 md:hidden'}>{'Weight'}</small>
					<p suppressHydrationWarning className={'font-number'}>
						{formatPercent(weight, 2, 2)}
					</p>
				</div>

				<div className={'col-span-12 flex h-auto items-center justify-between pr-0 md:col-span-3 md:h-10 md:justify-end md:pr-1'}>
					<small className={'block text-neutral-500 md:hidden'}>
						{'Total Votes, yETH'}
					</small>
					<p suppressHydrationWarning className={'font-number'}>
						{`${formatAmount(toNormalizedBN(item.extra?.votes || 0).normalized, 6, 6)}`}
					</p>
				</div>

				<div className={'col-span-12 flex h-10 items-center justify-between pr-0 md:col-span-3 md:justify-end md:pr-1'}>
					<small className={'block text-neutral-500 md:hidden'}>{'Your Votes'}</small>
					<p suppressHydrationWarning className={'font-number'}>
						<Renderable shouldRender={!isLoadingEvents} fallback={'-'}>
							{`${formatAmount(voteData.votesUsedPerProtocol[item.address]?.normalized || 0, 6, 6)}`}
						</Renderable>
					</p>
				</div>
			</div>

			<div className={'col-span-12 mt-2 flex justify-between md:col-span-3 md:mt-0 md:justify-end'}>
				<div className={'box-500 grow-1 flex h-10 w-full items-center justify-center p-2'}>
					<input
						id={`vote-for-${item.address}`}
						className={'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none scrollbar-none'}
						type={'number'}
						min={0}
						maxLength={20}
						max={totalVotesRemaining.normalized || 0}
						step={1 / 10 ** 18}
						inputMode={'numeric'}
						placeholder={'0'}
						pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
						value={voteToSend?.normalized || ''}
						onChange={(e): void => onChangeAmount(e, item)} />
					<div className={'ml-2 flex flex-row space-x-1'}>
						<button
							onClick={(): void => updateToMax(item)}
							className={cl('p-1 text-xs rounded-sm border border-purple-300 transition-colors', isMax ? 'bg-purple-300 text-white' : 'text-purple-300 hover:bg-purple-300 hover:text-white')}>
							{'max'}
						</button>

					</div>
				</div>
			</div>
		</div>
	);
}

function VoteList(): ReactElement {
	const {
		voting: {voteData, onUpdate},
		whitelistedLST: {whitelistedLST, isLoading, onUpdate: onUpdateLST}
	} = useBootstrap();
	const [sortBy, set_sortBy] = useState<string>('');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('');
	const [voteToSend, set_voteToSend] = useState<TDict<TNormalizedBN>>({});
	const [isModalOpen, set_isModalOpen] = useState<boolean>(false);
	const [nonce, set_nonce] = useState<number>(0);

	const totalVotesRemaining = useMemo((): TNormalizedBN => {
		const totalVotePower = voteData.votesAvailable.raw;
		const remaining = Object.values(voteToSend).reduce((acc, curr): bigint => acc + curr.raw, 0n);
		return toNormalizedBN(totalVotePower - remaining);
	}, [voteData, voteToSend]);

	const totalVotesUsed = useMemo((): TNormalizedBN => {
		const used = Object.values(voteToSend).reduce((acc, curr): bigint => acc + curr.raw, 0n);
		return toNormalizedBN(used);
	}, [voteToSend]);


	/* 🔵 - Yearn Finance **************************************************************************
	**	Callback method used to sort the vaults list.
	**	The use of useCallback() is to prevent the method from being re-created on every render.
	**********************************************************************************************/
	const onSort = useCallback((newSortBy: string, newSortDirection: string): void => {
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

	/* 🔵 - Yearn Finance **************************************************************************
	** Change the inputed amount when the user types something in the input field.
	**********************************************************************************************/
	const onChangeAmount = useCallback((e: ChangeEvent<HTMLInputElement>, currentLST: TTokenInfo): void => {
		const element = document.getElementById(`vote-for-${currentLST.address}`) as HTMLInputElement;
		const currentAmount = handleInputChangeEventValue(e, 18);
		const totalVotePower = voteData.votesAvailable.raw;
		const remaining = Object.entries(voteToSend)
			.filter(([key]): boolean => key !== currentLST.address)
			.reduce((acc, [, curr]): bigint => acc + curr.raw, 0n);

		if ((remaining + currentAmount.raw) > totalVotePower) {
			const newAmount = toNormalizedBN(totalVotePower - remaining);
			if (element?.value) {
				element.value = formatAmount(newAmount.normalized, 0, 18);
			}
			return set_voteToSend((v): TDict<TNormalizedBN> => ({...v, [currentLST.address]: newAmount}));
		}

		set_voteToSend((v): TDict<TNormalizedBN> => ({...v, [currentLST.address]: currentAmount}));
	}, [voteData.votesAvailable.raw, voteToSend]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Change the inputed amount when the user clicks on the max button to match the maximum
	** remaining voting power.
	**********************************************************************************************/
	const updateToMax = useCallback((currentLST: TTokenInfo): void => {
		const element = document.getElementById(`vote-for-${currentLST.address}`) as HTMLInputElement;
		const totalVotePower = voteData.votesAvailable.raw;
		const remaining = Object.entries(voteToSend)
			.filter(([key]): boolean => key !== currentLST.address)
			.reduce((acc, [, curr]): bigint => acc + curr.raw, 0n);

		const newAmount = toNormalizedBN(totalVotePower - remaining);
		if (element?.value) {
			element.value = formatAmount(newAmount.normalized, 0, 18);
		}
		return set_voteToSend((v): TDict<TNormalizedBN> => ({...v, [currentLST.address]: newAmount}));
	}, [voteData.votesAvailable.raw, voteToSend]);

	const onVoteSuccess = useCallback(async (): Promise<void> => {
		await Promise.all([
			onUpdate(),
			onUpdateLST()
		]);
		performBatchedUpdates((): void => {
			set_isModalOpen(false);
			set_voteToSend({});
			set_nonce((n): number => n + 1);
		});
	}, [onUpdate, onUpdateLST]);

	return (
		<div>
			<div aria-label={'header'} className={'mb-4 hidden grid-cols-12 gap-10 md:grid'}>
				<div className={'col-span-3'}>
					<p className={'text-xs text-neutral-500'}>
						{'LST'}
					</p>
				</div>
				<div className={'col-span-12 grid grid-cols-12 gap-4 md:col-span-6'}>
					<div className={'col-span-4 flex justify-end'}>
						<p
							onClick={(): void => onSort('totalIncentive', toggleSortDirection('totalIncentive'))}
							className={'group flex flex-row text-xs text-neutral-500'}>
							{'Total incentive'}
							<span className={'pl-2'}>
								{renderChevron(sortBy === 'totalIncentive')}
							</span>
						</p>
					</div>
					<div className={'col-span-2 flex justify-end'}>
						<p
							onClick={(): void => onSort('weight', toggleSortDirection('weight'))}
							className={'group flex flex-row text-xs text-neutral-500'}>
							{'Weight'}
							<span className={'pl-2'}>
								{renderChevron(sortBy === 'weight')}
							</span>
						</p>
					</div>
					<div className={'col-span-3 flex justify-end'}>
						<p
							onClick={(): void => onSort('totalVotes', toggleSortDirection('totalVotes'))}
							className={'group flex flex-row text-xs text-neutral-500'}>
							{'Total Votes'}
							<span className={'pl-2'}>
								{renderChevron(sortBy === 'totalVotes')}
							</span>
						</p>
					</div>
					<div className={'col-span-3 flex justify-end'}>
						<p
							onClick={(): void => onSort('yourVotes', toggleSortDirection('yourVotes'))}
							className={'group flex flex-row text-xs text-neutral-500'}>
							{'Your Votes'}
							<span className={'pl-2'}>
								{renderChevron(sortBy === 'yourVotes')}
							</span>
						</p>
					</div>
				</div>
				<div className={'col-span-3 flex justify-start'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>
						{'Vote with your st-yETH'}
					</p>
				</div>
			</div>

			{Object.values(whitelistedLST)
				.map((item, index): ReactElement => (
					<VoteListItem
						key={`${index}_${nonce}`}
						item={item}
						totalVotesRemaining={totalVotesRemaining}
						voteToSend={voteToSend[item.address]}
						onChangeAmount={onChangeAmount}
						updateToMax={updateToMax} />
				))}
			{isLoading && (
				<div className={'mt-6 flex flex-row items-center justify-center'}>
					<IconSpinner className={'!h-6 !w-6 !text-neutral-400'} />
				</div>
			)}

			<div
				aria-label={'footer'}
				className={'mt-4 grid grid-cols-12 gap-4 border-t-2 border-neutral-300 pt-4 md:gap-10'}>
				<div className={'hidden md:col-span-3 md:flex'} />
				<div className={'hidden justify-end md:col-span-1 md:flex'} />
				<div className={'col-span-2 flex h-10 items-center justify-end md:col-span-2'}>
					<b className={'text-neutral-900'}>
						{'Total'}
					</b>
				</div>
				<div className={'col-span-5 flex h-10 items-center justify-end md:col-span-2'}>
					<b className={'font-number text-neutral-900'}>
						{`${formatAmount(totalVotesUsed.normalized, 6, 6)}`}
					</b>
				</div>
				<div className={'col-span-5 flex h-10 justify-start md:col-span-4'}>
					<Button
						onClick={(): void => set_isModalOpen(true)}
						className={'yearn--button w-full rounded-md !text-sm'}>
						{'Vote'}
					</Button>
				</div>
			</div>
			<Modal
				style={{width: 400}}
				isOpen={isModalOpen}
				onClose={(): void => set_isModalOpen(false)}>
				<VoteConfirmationModal
					whitelistedLST={whitelistedLST}
					voteToSend={voteToSend}
					onSuccess={onVoteSuccess}
					onCancel={(): void => set_isModalOpen(false)} />
			</Modal>
		</div>
	);
}

function Vote(): ReactElement {
	const {
		periods: {voteStatus},
		voting: {voteData, isLoading}
	} = useBootstrap();
	const [className, set_className] = useState('pointer-events-none opacity-40');

	const totalVotePowerNormalized = useMemo((): number => {
		return Number(voteData.votesAvailable.normalized) + Number(voteData.votesUsed.normalized);
	}, [voteData]);


	useEffect((): void => {
		if (voteStatus !== 'started') {
			set_className('pointer-events-none opacity-40');
		} else {
			set_className('');
		}

	}, [voteStatus, className]);

	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<div className={'mb-6 flex w-full flex-col justify-center md:w-[52%]'}>
					<h1 className={'text-3xl font-black md:text-8xl'}>
						{'Vote'}
					</h1>
					<b
						suppressHydrationWarning
						className={'font-number mt-4 text-4xl text-purple-300'}>
						<Timer />
					</b>
					<p className={'pt-8 text-neutral-700'}>
						{'Decide how much ETH you want to lock as st-yETH. Remember this ETH will be locked for 16 weeks, during which time period you’ll be able to receive bri... incentives for voting on which LSTs will be included in yETH.'}
					</p>
				</div>
				<div
					key={voteStatus}
					className={className}>
					<div className={'mb-6 grid grid-cols-2 gap-4 md:grid-cols-8'}>
						<div className={'col-span-2 bg-neutral-100 p-4'}>
							<p className={'pb-2'}>{'Total Vote Power'}</p>
							<b suppressHydrationWarning className={'font-number text-3xl'}>
								<Renderable shouldRender={!isLoading} fallback ={'-'}>
									{formatAmount(totalVotePowerNormalized, 6, 6)}
								</Renderable>
							</b>
						</div>
						<div className={'col-span-2 bg-neutral-100 p-4'}>
							<p className={'pb-2'}>{'Remaining Votes'}</p>
							<b suppressHydrationWarning className={'font-number text-3xl'}>
								<Renderable shouldRender={!isLoading} fallback ={'-'}>
									{formatAmount(voteData.votesAvailable.normalized, 6, 6)}
								</Renderable>
							</b>
						</div>
						<div className={'col-span-2 bg-neutral-100 p-4'}>
							<p className={'pb-2'}>{'Used Votes'}</p>
							<b suppressHydrationWarning className={'font-number text-3xl'}>
								<Renderable shouldRender={!isLoading} fallback ={'-'}>
									{formatAmount(voteData.votesUsed.normalized, 6, 6)}
								</Renderable>
							</b>
						</div>
					</div>
					<div className={'w-full border-t-2 border-neutral-300 pb-4 pt-6'}>
						<VoteList />
					</div>
				</div>
			</div>
		</section>
	);
}

export default Vote;
