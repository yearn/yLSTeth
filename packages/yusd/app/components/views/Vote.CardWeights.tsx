import React, {useCallback, useMemo, useState} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	cl,
	decodeAsBigInt,
	formatAmount,
	formatPercent,
	isZeroAddress,
	toAddress,
	toBigInt,
	truncateHex
} from '@builtbymom/web3/utils';
import {defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {ONCHAIN_VOTE_WEIGHT_ABI} from '@libAbi/onchainVoteWeight.abi';
import {ImageWithFallback} from '@libComponents/ImageWithFallback';
import IconSpinner from '@libIcons/IconSpinner';
import {readContracts} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {voteWeights} from '@yUSD/actions';
import useBasket from '@yUSD/contexts/useBasket';
import {usePrices} from '@yUSD/contexts/usePrices';
import {NO_CHANGE_LST_LIKE} from '@yUSD/utils/constants';

import type {ReactElement} from 'react';
import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TBasketItem, TIndexedTokenInfo} from '@libUtils/types';

/******************************************************************************
 ** This method is used to display the vote weight for each LST.
 *****************************************************************************/
function VoteWeightRow(props: {
	currentLST: TIndexedTokenInfo;
	votePowerPerLST: TDict<number>;
	set_votePowerPerLST: React.Dispatch<React.SetStateAction<TDict<number>>>;
	hasAlreadyVoted: boolean;
	isLoadingVoteData: boolean;
}): ReactElement {
	const {currentVotesForNoChanges, weightIncentives} = useBasket();
	const {getPrice} = usePrices();

	/**************************************************************************
	 ** This method calculates the incentive value
	 *************************************************************************/
	const weigthIncentiveValue = useMemo((): number => {
		let sum = 0;
		for (const incentive of Object.values(weightIncentives[props.currentLST.address] || {})) {
			// We don't care about this level for candidates incentives
			for (const eachIncentive of incentive) {
				const price = getPrice({address: eachIncentive.address});
				sum += eachIncentive.amount.normalized * price.normalized;
			}
		}
		return sum;
	}, [getPrice, props.currentLST.address, weightIncentives]);

	const currentVote = useMemo(() => {
		if (isZeroAddress(props.currentLST.address)) {
			return currentVotesForNoChanges;
		}
		return (props.currentLST as TBasketItem)?.voteForEpoch;
	}, [props.currentLST, currentVotesForNoChanges]);

	/**************************************************************************
	 ** Row rendering
	 *************************************************************************/
	return (
		<div
			key={props.currentLST.address}
			aria-label={'content'}
			className={
				'my-0.5 grid grid-cols-12 rounded-sm bg-neutral-100/50 p-4 transition-colors open:bg-neutral-100 hover:bg-neutral-100'
			}>
			<div className={'col-span-12 flex w-full flex-row items-center space-x-6 md:col-span-3'}>
				<div className={'size-10 min-w-[40px]'}>
					<ImageWithFallback
						src={props.currentLST.logoURI || ''}
						altSrc={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${props.currentLST?.address}/logo-32.png`}
						alt={''}
						unoptimized
						width={40}
						height={40}
					/>
				</div>
				<div className={'flex flex-col'}>
					<p className={'whitespace-nowrap'}>
						{props.currentLST?.symbol || truncateHex(props.currentLST.address, 6)}
					</p>
					<small className={'whitespace-nowrap text-xs'}>{props.currentLST.name}</small>
				</div>
			</div>
			<div className={'col-span-12 mt-4 flex items-center justify-between md:col-span-2 md:mt-0 md:justify-end'}>
				<small className={'block text-neutral-500 md:hidden'}>{'Total incentive (USD)'}</small>
				<p
					suppressHydrationWarning
					className={'font-number'}>
					{`$${formatAmount(weigthIncentiveValue, 2, 2)}`}
				</p>
			</div>

			<div className={'col-span-12 mt-2 flex items-center justify-between md:col-span-2 md:mt-0 md:justify-end'}>
				<small className={'block text-neutral-500 md:hidden'}>{'Current weight'}</small>
				<p
					suppressHydrationWarning
					className={'font-number'}>
					{formatPercent(Number((props.currentLST as TBasketItem)?.weight?.normalized || 0) * 100)}
				</p>
			</div>

			<div
				className={
					'col-span-12 mt-2 flex items-center justify-between md:col-span-2 md:-mr-2 md:mt-0 md:justify-end'
				}>
				<small className={'block text-neutral-500 md:hidden'}>{'Votes'}</small>
				<div className={'relative flex flex-col text-right'}>
					<p
						suppressHydrationWarning
						className={'font-number text-right'}>
						{formatPercent(Number(currentVote.ratio || 0) * 100)}
					</p>
					<small
						suppressHydrationWarning
						className={
							'absolute -bottom-4 right-0 block whitespace-nowrap text-right text-xs text-neutral-400'
						}>
						{`
						${formatAmount(Number(currentVote.vote.normalized || 0))}
						/
						${formatAmount(Number(currentVote.totalVotes.normalized || 0), 0, 0)}`}
					</small>
				</div>
			</div>

			<div className={'col-span-12 mt-10 flex w-full items-center pl-0 md:col-span-3  md:mt-0 md:pl-[40%]'}>
				<div className={'bg-neutral-0 grid h-10 w-full grid-cols-4 items-center rounded-lg'}>
					<div className={'flex items-center justify-start pl-1'}>
						<button
							disabled={!props.votePowerPerLST[props.currentLST.address] || props.hasAlreadyVoted}
							onClick={() =>
								props.set_votePowerPerLST(p => ({
									...p,
									[props.currentLST.address]:
										p[props.currentLST.address] === 0 ? 0 : p[props.currentLST.address] - 1
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
								!props.votePowerPerLST[props.currentLST.address] ? 'text-neutral-900/30' : ''
							)}>
							{props.isLoadingVoteData ? (
								<IconSpinner className={'mx-auto flex size-6 text-center opacity-30'} />
							) : (
								`${formatAmount(
									((props.votePowerPerLST[props.currentLST.address] || 0) /
										Object.values(props.votePowerPerLST).reduce((a, b) => a + b, 0)) *
										100,
									0,
									2
								)}%`
							)}
						</p>
					</div>
					<div className={'flex items-center justify-end pr-1'}>
						<button
							disabled={props.hasAlreadyVoted}
							onClick={() =>
								props.set_votePowerPerLST(p => ({
									...p,
									[props.currentLST.address]: p[props.currentLST.address] + 1 || 1
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
}

function VoteCardWeights(props: {
	votePower: TNormalizedBN | undefined;
	isVoteOpen: boolean;
	hasVoted: boolean;
}): ReactElement {
	const {provider, address} = useWeb3();
	const [votePowerPerLST, set_votePowerPerLST] = useState<TDict<number>>({});
	const [voteWeightStatus, set_voteWeightStatus] = useState<TTxStatus>(defaultTxStatus);
	const [isLoadingVoteData, set_isLoadingVoteData] = useState(false);
	const {basket, isLoaded} = useBasket();

	/**********************************************************************************************
	 **	Retrieve the current vote info for the user.
	 *********************************************************************************************/
	const onRefreshVotes = useAsyncTrigger(async () => {
		if (isZeroAddress(address)) {
			return;
		}

		set_isLoadingVoteData(true);
		/* 🔵 - Yearn Finance **********************************************************************
		 **	First we need to retrive the current epoch
		 ******************************************************************************************/
		const [_epoch] = await readContracts(retrieveConfig(), {
			contracts: [
				{
					abi: ONCHAIN_VOTE_WEIGHT_ABI,
					address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
					chainId: Number(process.env.DEFAULT_CHAIN_ID),
					functionName: 'epoch'
				}
			]
		});
		const epoch = decodeAsBigInt(_epoch);

		/* 🔵 - Yearn Finance **********************************************************************
		 **	If so, we can try to retrieve the vote weight for each LST and display them.
		 ******************************************************************************************/
		if (props.hasVoted) {
			const votesUser = await readContracts(retrieveConfig(), {
				contracts: [
					{
						abi: ONCHAIN_VOTE_WEIGHT_ABI,
						address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
						chainId: Number(process.env.DEFAULT_CHAIN_ID),
						functionName: 'votes_user',
						args: [toAddress(address), epoch, 0]
					},
					...basket.map(e => ({
						abi: ONCHAIN_VOTE_WEIGHT_ABI,
						address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
						chainId: Number(process.env.DEFAULT_CHAIN_ID),
						functionName: 'votes_user',
						args: [toAddress(address), epoch, e.index]
					}))
				]
			});
			const votes: TDict<number> = {};
			for (const item of basket) {
				votes[item.address] = Number(votesUser[item.index]?.result || 0);
			}
			votes[NO_CHANGE_LST_LIKE.address] = Number(votesUser[0]?.result || 0);
			set_votePowerPerLST(votes);
		}
		set_isLoadingVoteData(false);
	}, [address, basket, props.hasVoted]);

	/**********************************************************************************************
	 **	Trigger an onchain vote and update the vote weight for each LST.
	 *********************************************************************************************/
	const onVote = useCallback(async (): Promise<void> => {
		const voteScale = 10_000;
		const sumOfVotes = Object.values(votePowerPerLST).reduce((a, b) => a + b, 0);
		const votes = [];
		for (const item of basket) {
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
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
			weight: votes.map(v => toBigInt(v)),
			statusHandler: set_voteWeightStatus
		});
		if (result.isSuccessful) {
			onRefreshVotes();
		}
	}, [basket, provider, votePowerPerLST, onRefreshVotes]);

	return (
		<div className={'mt-8'}>
			<div
				aria-label={'header'}
				className={'mb-4 hidden grid-cols-12 px-4 md:grid'}>
				<div className={'col-span-3'}>
					<p className={'text-xs text-neutral-500'}>{'LST'}</p>
				</div>
				<div className={'col-span-2 -mr-2 flex justify-end text-right'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'Incentives (USD)'}</p>
				</div>
				<div className={'col-span-2 -mr-2 flex justify-end text-right'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'Current weight'}</p>
				</div>
				<div className={'col-span-2 -mr-2 flex justify-end text-right'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'Votes'}</p>
				</div>
			</div>

			{[NO_CHANGE_LST_LIKE, ...basket]
				.filter((e): boolean => Boolean(e))
				.map((currentLST): ReactElement => {
					return (
						<VoteWeightRow
							key={currentLST.address}
							currentLST={currentLST}
							votePowerPerLST={votePowerPerLST}
							set_votePowerPerLST={set_votePowerPerLST}
							hasAlreadyVoted={props.hasVoted}
							isLoadingVoteData={isLoadingVoteData}
						/>
					);
				})}

			{!isLoaded && (
				<div className={'grid'}>
					<div className={'skeleton-lg mb-1 h-[70px] w-full'}></div>
					<div className={'skeleton-lg mb-1 h-[70px] w-full'}></div>
					<div className={'skeleton-lg mb-1 h-[70px] w-full'}></div>
					<div className={'skeleton-lg mb-1 h-[70px] w-full'}></div>
					<div className={'skeleton-lg mb-1 h-[70px] w-full'}></div>
					<div className={'skeleton-lg mb-1 h-[70px] w-full'}></div>
					<div className={'skeleton-lg mb-1 h-[70px] w-full'}></div>
					<div className={'skeleton-lg mb-1 h-[70px] w-full'}></div>
				</div>
			)}

			<div className={'mt-auto pt-10'}>
				<Button
					onClick={onVote}
					isBusy={voteWeightStatus.pending}
					isDisabled={
						!isLoaded ||
						!props.isVoteOpen ||
						props.hasVoted ||
						Object.values(votePowerPerLST).reduce((a, b) => a + b, 0) === 0 ||
						Object.values(votePowerPerLST).reduce((a, b) => a + b, 0) > 100 ||
						isZeroAddress(address) ||
						toBigInt(props.votePower?.raw) === 0n
					}
					className={'w-full md:w-[264px]'}>
					{'Vote'}
				</Button>
			</div>
		</div>
	);
}

export {VoteCardWeights};
