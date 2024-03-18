import React, {useCallback, useMemo, useState} from 'react';
import {voteInclusion} from 'app/actions';
import useInclusion from 'app/contexts/useInclusion';
import {usePrices} from 'app/contexts/usePrices';
import {ONCHAIN_VOTE_INCLUSION_ABI} from 'app/utils/abi/onchainVoteInclusion.abi';
import {NO_CHANGE_LST_LIKE} from 'app/utils/constants';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	cl,
	decodeAsBigInt,
	decodeAsBoolean,
	formatAmount,
	isZeroAddress,
	toAddress,
	toBigInt,
	truncateHex
} from '@builtbymom/web3/utils';
import {defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {readContract, readContracts} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';

import {ImageWithFallback} from '../common/ImageWithFallback';

import type {TIndexedTokenInfo} from 'app/utils/types';
import type {ReactElement} from 'react';
import type {TDict} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

function VoteInclusionRow(props: {
	currentLST: TIndexedTokenInfo;
	votePowerPerLST: TDict<number>;
	set_votePowerPerLST: React.Dispatch<React.SetStateAction<TDict<number>>>;
	hasAlreadyVoted: boolean;
}): ReactElement {
	const {inclusionIncentives} = useInclusion();
	const {getPrice} = usePrices();

	/**************************************************************************
	 ** This method calculates the incentive value
	 *************************************************************************/
	const candidateIncentiveValue = useMemo((): number => {
		let sum = 0;
		for (const incentive of Object.values(inclusionIncentives[props.currentLST.address] || {})) {
			// We don't care about this level for candidates incentives
			for (const eachIncentive of incentive) {
				const price = getPrice({address: eachIncentive.address});
				sum += eachIncentive.amount.normalized * price.normalized;
			}
		}
		return sum;
	}, [inclusionIncentives, getPrice, props.currentLST.address]);

	/**************************************************************************
	 ** Row rendering
	 *************************************************************************/
	return (
		<div
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
						{props.currentLST.symbol || truncateHex(props.currentLST.address, 6)}
					</p>
					<small className={'whitespace-nowrap text-xs'}>{props.currentLST.name}</small>
				</div>
			</div>
			<div className={'col-span-12 mt-4 flex items-center justify-between md:col-span-6 md:mt-0 md:justify-end'}>
				<small className={'block text-neutral-500 md:hidden'}>{'Total incentive (USD)'}</small>
				<p
					suppressHydrationWarning
					className={'font-number'}>
					{`$${formatAmount(candidateIncentiveValue, 2, 2)}`}
				</p>
			</div>
			<div className={'col-span-12 mt-2 flex w-full items-center pl-[40%] md:col-span-3 md:mt-0'}>
				<div className={'grid h-10 w-full grid-cols-4 items-center rounded-lg bg-neutral-0'}>
					<div className={'flex items-center justify-start pl-1'}>
						<button
							disabled={!props.votePowerPerLST[props.currentLST.address]}
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
								!props.votePowerPerLST[props.currentLST.address] ? 'text-neutral-900/30' : ''
							)}>
							{`${formatAmount(
								((props.votePowerPerLST[props.currentLST.address] || 0) /
									Object.values(props.votePowerPerLST).reduce((a, b) => a + b, 0)) *
									100,
								0,
								2
							)}%`}
						</p>
					</div>
					<div className={'flex items-center justify-end pr-1'}>
						<button
							onClick={() =>
								props.set_votePowerPerLST(p => ({
									...p,
									[props.currentLST.address]: p[props.currentLST.address] + 1 || 1
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
}

function VoteCardInclusion(): ReactElement {
	const {provider, address} = useWeb3();
	const [votePowerPerLST, set_votePowerPerLST] = useState<TDict<number>>({});
	const [hasAlreadyVoted, set_hasAlreadyVoted] = useState(true);
	const [isVoteOpen, set_isVoteOpen] = useState(false);
	const [voteWeightStatus, set_voteWeightStatus] = useState<TTxStatus>(defaultTxStatus);
	const {candidates, isLoaded} = useInclusion();

	/**********************************************************************************************
	 **	Retrieve the current vote info for the user.
	 *********************************************************************************************/
	const onRefreshVotes = useAsyncTrigger(async () => {
		if (isZeroAddress(address)) {
			return;
		}

		/******************************************************************************************
		 **	First we need to retrive the current epoch
		 ******************************************************************************************/
		const [_epoch, _voteOpen] = await readContracts(retrieveConfig(), {
			contracts: [
				{
					abi: ONCHAIN_VOTE_INCLUSION_ABI,
					address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
					functionName: 'epoch'
				},
				{
					abi: ONCHAIN_VOTE_INCLUSION_ABI,
					address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
					functionName: 'vote_open'
				}
			]
		});
		const epoch = decodeAsBigInt(_epoch);
		const isVoteOpenBool = decodeAsBoolean(_voteOpen);
		set_isVoteOpen(isVoteOpenBool);

		/******************************************************************************************
		 **	Then we need to check if the user already voted for this epoch
		 ******************************************************************************************/
		const votedWeight = await readContract(retrieveConfig(), {
			abi: ONCHAIN_VOTE_INCLUSION_ABI,
			address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
			functionName: 'votes_user',
			args: [toAddress(address), epoch]
		});
		const hasAlreadyVoted = votedWeight > 0n;
		set_hasAlreadyVoted(hasAlreadyVoted);

		/******************************************************************************************
		 **	If so, we can try to retrieve the vote weight for each LST and display them.
		 ******************************************************************************************/
		if (hasAlreadyVoted) {
			const votesUser = await readContracts(retrieveConfig(), {
				contracts: [
					{
						abi: ONCHAIN_VOTE_INCLUSION_ABI,
						address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
						functionName: 'votes',
						args: [toAddress(address), 0]
					},
					...candidates.map(e => ({
						abi: ONCHAIN_VOTE_INCLUSION_ABI,
						address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
						functionName: 'votes',
						args: [toAddress(address), e.index]
					}))
				]
			});
			const votes: TDict<number> = {};
			for (const item of candidates) {
				votes[item.address] = Number(votesUser[item.index]?.result || 0);
			}
			votes[NO_CHANGE_LST_LIKE.address] = Number(votesUser[0]?.result || 0);
			set_votePowerPerLST(votes);
		}
	}, [address, candidates]);

	/**********************************************************************************************
	 **	Trigger an onchain vote and update the vote weight for each LST.
	 *********************************************************************************************/
	const onVote = useCallback(async (): Promise<void> => {
		const voteScale = 10_000;
		const sumOfVotes = Object.values(votePowerPerLST).reduce((a, b) => a + b, 0);
		const votes = [];
		for (const item of candidates) {
			const numberOfVoteForThisLST = votePowerPerLST[item.address] || 0;
			votes[item.index] = Math.floor((numberOfVoteForThisLST / sumOfVotes) * voteScale);
		}
		const numberOfVoteForNoChange = votePowerPerLST[NO_CHANGE_LST_LIKE.address] || 0;
		votes.unshift(Math.floor((numberOfVoteForNoChange / sumOfVotes) * voteScale));

		const totalVotePower = votes.reduce((a, b) => a + b, 0);
		if (totalVotePower < voteScale) {
			votes[0] += voteScale - totalVotePower;
		}

		const result = await voteInclusion({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
			weight: votes.map(v => toBigInt(v)),
			statusHandler: set_voteWeightStatus
		});
		if (result.isSuccessful) {
			onRefreshVotes();
		}
	}, [candidates, provider, votePowerPerLST, onRefreshVotes]);

	return (
		<div className={'mt-8'}>
			<div
				aria-label={'header'}
				className={'mb-4 hidden grid-cols-12 px-4 md:grid'}>
				<div className={'col-span-3'}>
					<p className={'text-xs text-neutral-500'}>{'LST'}</p>
				</div>
				<div className={'col-span-6 -mr-2 flex justify-end text-right'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'Incentives (USD)'}</p>
				</div>
			</div>

			{candidates.length === 0
				? []
				: [NO_CHANGE_LST_LIKE, ...candidates]
						.filter((e): boolean => Boolean(e))
						.map((currentLST): ReactElement => {
							return (
								<VoteInclusionRow
									key={currentLST.address}
									currentLST={currentLST}
									votePowerPerLST={votePowerPerLST}
									set_votePowerPerLST={set_votePowerPerLST}
									hasAlreadyVoted={hasAlreadyVoted}
								/>
							);
						})}

			{!isLoaded && (
				<div className={'grid'}>
					<div className={'skeleton-lg mb-1 h-[70px] w-full'}></div>
					<div className={'skeleton-lg mb-1 h-[70px] w-full'}></div>
					<div className={'skeleton-lg mb-1 h-[70px] w-full'}></div>
				</div>
			)}

			<div className={cl('mt-auto pt-10', candidates.length === 0 ? 'hidden' : '')}>
				<Button
					onClick={onVote}
					isBusy={voteWeightStatus.pending}
					isDisabled={
						!isLoaded ||
						!isVoteOpen ||
						hasAlreadyVoted ||
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

export {VoteCardInclusion};
