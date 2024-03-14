import React, {useCallback, useState} from 'react';
import {voteWeights} from 'app/actions';
import IconChevronPlain from 'app/components/icons/IconChevronPlain';
import IconSpinner from 'app/components/icons/IconSpinner';
import useLST from 'app/contexts/useLST';
import {ONCHAIN_VOTE_WEIGHT_ABI} from 'app/utils/abi/onchainVoteWeight.abi';
import {NO_CHANGE_LST_LIKE} from 'app/utils/constants';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {
	cl,
	decodeAsBigInt,
	decodeAsBoolean,
	formatAmount,
	formatPercent,
	isZeroAddress,
	toAddress,
	toBigInt,
	truncateHex
} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {readContract, readContracts} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {ImageWithFallback} from '@yearn-finance/web-lib/components/ImageWithFallback';

import type {TLST} from 'app/hooks/useLSTData';
import type {TSortDirection} from 'app/utils/types';
import type {ReactElement} from 'react';
import type {TDict} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

function VoteCardWeights(): ReactElement {
	const {provider, address} = useWeb3();
	const {lst} = useLST();
	const {
		incentives: {groupIncentiveHistory, isFetchingHistory}
	} = useLST();
	const {safeChainID} = useChainID();
	const [sortBy, set_sortBy] = useState<'totalIncentive' | 'weight'>('totalIncentive');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('desc');
	const [votePowerPerLST, set_votePowerPerLST] = useState<TDict<number>>({});
	const [voteWeightStatus, set_voteWeightStatus] = useState<TTxStatus>(defaultTxStatus);
	const [hasAlreadyVoted, set_hasAlreadyVoted] = useState(true);
	const [isVoteOpen, set_isVoteOpen] = useState(false);

	/* 🔵 - Yearn Finance **************************************************************************
	 **	Retrieve the current vote info for the user.
	 **********************************************************************************************/
	const onRefreshVotes = useAsyncTrigger(async () => {
		if (isZeroAddress(address)) {
			return;
		}

		/* 🔵 - Yearn Finance **********************************************************************
		 **	First we need to retrive the current epoch
		 ******************************************************************************************/
		const [_epoch, _voteOpen] = await readContracts({
			contracts: [
				{
					abi: ONCHAIN_VOTE_WEIGHT_ABI,
					address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
					functionName: 'epoch'
				},
				{
					abi: ONCHAIN_VOTE_WEIGHT_ABI,
					address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
					functionName: 'vote_open'
				}
			]
		});
		const epoch = decodeAsBigInt(_epoch);
		const isVoteOpenBool = decodeAsBoolean(_voteOpen);
		set_isVoteOpen(isVoteOpenBool);

		/* 🔵 - Yearn Finance **********************************************************************
		 **	Then we need to check if the user already voted for this epoch
		 ******************************************************************************************/
		const hasAlreadyVoted = await readContract({
			abi: ONCHAIN_VOTE_WEIGHT_ABI,
			address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
			functionName: 'voted',
			args: [toAddress(address), epoch]
		});
		set_hasAlreadyVoted(hasAlreadyVoted);

		/* 🔵 - Yearn Finance **********************************************************************
		 **	If so, we can try to retrieve the vote weight for each LST and display them.
		 ******************************************************************************************/
		if (hasAlreadyVoted) {
			const votesUser = await readContracts({
				contracts: [
					{
						abi: ONCHAIN_VOTE_WEIGHT_ABI,
						address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
						functionName: 'votes',
						args: [toAddress(address), 0]
					},
					...lst.map(e => ({
						abi: ONCHAIN_VOTE_WEIGHT_ABI,
						address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
						functionName: 'votes',
						args: [toAddress(address), e.index]
					}))
				]
			});
			const votes: TDict<number> = {};
			for (const item of lst) {
				votes[item.address] = Number(votesUser[item.index]?.result || 0);
			}
			votes[NO_CHANGE_LST_LIKE.address] = Number(votesUser[0]?.result || 0);
			set_votePowerPerLST(votes);
		}
	}, [address, lst]);

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

	const onVote = useCallback(async (): Promise<void> => {
		const voteScale = 10_000;
		const sumOfVotes = Object.values(votePowerPerLST).reduce((a, b) => a + b, 0);
		const votes = [];
		for (const item of lst) {
			const numberOfVoteForThisLST = votePowerPerLST[item.address] || 0;
			votes[item.index] = Math.floor((numberOfVoteForThisLST / sumOfVotes) * voteScale);
		}
		const numberOfVoteForNoChange = votePowerPerLST[NO_CHANGE_LST_LIKE.address] || 0;
		votes.unshift(Math.floor((numberOfVoteForNoChange / sumOfVotes) * voteScale));

		const totalVotePower = votes.reduce((a, b) => a + b, 0);
		if (totalVotePower < voteScale) {
			votes[0] += voteScale - totalVotePower;
		}

		const result = await voteWeights({
			connector: provider,
			chainID: Number(process.env.BASE_CHAIN_ID),
			contractAddress: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
			weight: votes.map(v => toBigInt(v)),
			statusHandler: set_voteWeightStatus
		});
		if (result.isSuccessful) {
			onRefreshVotes();
		}
	}, [lst, provider, votePowerPerLST, onRefreshVotes]);

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
											disabled={!votePowerPerLST[currentLST.address] || hasAlreadyVoted}
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
												'disabled:opacity-60 disabled:text-neutral-400 disabled:hover:bg-neutral-100'
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
											disabled={hasAlreadyVoted}
											onClick={() =>
												set_votePowerPerLST(p => ({
													...p,
													[currentLST.address]: p[currentLST.address] + 1 || 1
												}))
											}
											className={cl(
												'flex size-8 items-center justify-center rounded-lg bg-neutral-100 transition-colors hover:bg-neutral-200',
												'disabled:opacity-60 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:hover:bg-neutral-100'
											)}>
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
					isBusy={voteWeightStatus.pending}
					isDisabled={
						isFetchingHistory ||
						!isVoteOpen ||
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
