import React, {useCallback, useEffect, useState} from 'react';
import Markdown from 'react-markdown';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {CID} from 'multiformats';
import {base16} from 'multiformats/bases/base16';
import {create} from 'multiformats/hashes/digest';
import {useBlockNumber, useReadContract, useReadContracts} from 'wagmi';
import axios from 'axios';
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
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {GOVERNOR_ABI} from '@libAbi/governor.abi';
import {ONCHAIN_VOTE_INCLUSION_ABI} from '@libAbi/onchainVoteInclusion.abi';
import {ONCHAIN_VOTE_WEIGHT_ABI} from '@libAbi/onchainVoteWeight.abi';
import {VOTE_WEIGHT_ABI} from '@libAbi/voteWeight.abi';
import {useFetch} from '@libHooks/useFetch';
import {proposalSchema} from '@libUtils/types';
import {multicall, readContract, readContracts} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {IconLinkOut} from '@yearn-finance/web-lib/icons/IconLinkOut';
import {voteAbstain, voteNay, voteYea} from '@yUSD/actions';
import {VoteCardInclusion} from '@yUSD/components/views/Vote.CardInclusion';
import {VoteCardWeights} from '@yUSD/components/views/Vote.CardWeights';
import {VoteHeader} from '@yUSD/components/views/Vote.Header';
import useBasket from '@yUSD/contexts/useBasket';

import type {ReactElement} from 'react';
import type {Hex} from 'viem';
import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TOnChainProposal, TProposalRoot} from '@libUtils/types';

type TOnchainProposal = {
	cid: string;
	cidV1?: string;
	abstain: bigint;
	author: TAddress;
	epoch: bigint;
	hash: Hex;
	ipfs: Hex;
	nay: bigint;
	state: bigint;
	yea: bigint;
	index: bigint;
};

function Tabs(props: {
	shouldVote: [boolean, boolean, boolean];
	currentTab: 'weight' | 'inclusion' | 'governance';
	set_currentTab: (tab: 'weight' | 'inclusion' | 'governance') => void;
}): ReactElement {
	const router = useRouter();

	useEffect((): void => {
		const urlParams = new URLSearchParams(window.location.search);
		const action = urlParams.get('action');

		if (action && ['weight', 'inclusion', 'governance'].includes(action)) {
			props.set_currentTab(action as 'weight' | 'inclusion' | 'governance');
		} else if (
			router.query?.action &&
			['weight', 'inclusion', 'governance'].includes(router.query.action as string)
		) {
			props.set_currentTab(router.query.action as 'weight' | 'inclusion' | 'governance');
		}
	}, [props.set_currentTab, router.query]);

	return (
		<div className={'overflow-x-e'}>
			<div className={'relative px-4 md:px-[56px]'}>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {action: 'weight'}});
					}}
					className={cl(
						'mx-4 mb-2 text-lg transition-colors relative',
						props.currentTab === 'weight' ? 'text-primary font-bold' : 'text-neutral-400'
					)}>
					{'LST weights'}
					{props.currentTab !== 'weight' && props.shouldVote[0] && (
						<span className={'absolute -right-3 -top-1 z-10 flex size-2.5'}>
							<span
								className={
									'bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-75'
								}
							/>
							<span className={'bg-primary relative inline-flex size-2.5 rounded-full'} />
						</span>
					)}
				</button>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {action: 'inclusion'}});
					}}
					className={cl(
						'mx-4 mb-2 text-lg transition-colors relative',
						props.currentTab === 'inclusion' ? 'text-primary font-bold' : 'text-neutral-400'
					)}>
					{'Inclusion'}
					{props.currentTab !== 'inclusion' && props.shouldVote[1] && (
						<span className={'absolute -right-3 -top-1 z-10 flex size-2.5'}>
							<span
								className={
									'bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-75'
								}
							/>
							<span className={'bg-primary relative inline-flex size-2.5 rounded-full'} />
						</span>
					)}
				</button>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {action: 'governance'}});
					}}
					className={cl(
						'mx-4 mb-2 text-lg transition-colors relative',
						props.currentTab === 'governance' ? 'text-primary font-bold' : 'text-neutral-400'
					)}>
					{'Proposals'}
					{props.currentTab !== 'governance' && props.shouldVote[2] && (
						<span className={'absolute -right-3 -top-1 z-10 flex size-2.5'}>
							<span
								className={
									'bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-75'
								}
							/>
							<span className={'bg-primary relative inline-flex size-2.5 rounded-full'} />
						</span>
					)}
				</button>

				<div className={'absolute bottom-0 left-0 flex h-0.5 w-full flex-row bg-neutral-300 px-4 md:px-[56px]'}>
					<div
						className={cl(
							'h-full transition-colors ml-4 w-fit',
							props.currentTab === 'weight' ? 'bg-primary' : 'bg-transparent'
						)}>
						<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>
							{'LST weights'}
						</button>
					</div>
					<div
						className={cl(
							'h-full transition-colors ml-7 w-fit',
							props.currentTab === 'inclusion' ? 'bg-primary' : 'bg-transparent'
						)}>
						<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>
							{'Inclusion'}
						</button>
					</div>
					<div
						className={cl(
							'h-full w-fit transition-colors ml-7',
							props.currentTab === 'governance' ? 'bg-primary' : 'bg-transparent'
						)}>
						<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>
							{'Proposals'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function SnapshotProposal(props: {uri: string}): ReactElement | null {
	const sanitizedURI = props?.uri.replace('ipfs://', 'https://snapshot.4everland.link/ipfs/');
	const {data, isLoading} = useFetch<TProposalRoot>({
		endpoint: sanitizedURI,
		schema: proposalSchema
	});

	if (isLoading || !data) {
		return (
			<div className={'flex w-full flex-col gap-2 bg-neutral-100 px-8 py-6'}>
				<div className={'mb-2 h-8 w-1/2 animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-full animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-full animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-3/4 animate-pulse rounded-lg bg-neutral-400/80'} />
			</div>
		);
	}

	const isClosed = data?.data.message.end < Date.now() / 1000;
	return (
		<div className={'relative flex w-full flex-col gap-4 bg-neutral-100 px-8 py-6'}>
			<div className={'absolute right-8 top-6'}>
				<Link href={`https://snapshot.org/#/ylsd.eth/proposal/${data.hash}`}>
					<IconLinkOut className={'size-4 text-neutral-400 transition-colors hover:text-neutral-600'} />
				</Link>
			</div>
			<b className={'text-2xl'}>{data?.data.message.title}</b>
			<div className={'markdown scrollbar-show max-h-60 overflow-y-scroll'}>
				<Markdown>{data?.data.message.body}</Markdown>
			</div>
			<div>
				<Button
					disabled={isClosed}
					className={'w-48'}>
					{isClosed ? 'Closed' : 'Retract'}
				</Button>
			</div>
		</div>
	);
}

function SnapshotProposals(): ReactElement {
	const IPSFProposals = [
		'ipfs://bafkreie4c5gfprk77mm5lsimyidtyv4e22h6u4j2xhiarv4l5supwxscnm',
		'ipfs://bafkreih4otvqjsoixloh5abewegc4jf4tamfdql2ft2wjwl6a2uhn3gpkm',
		'ipfs://bafkreidvowbvbboijf4vdv6e4z3gt5ngd3ismbvvbpdh73fesy5y6uh334',
		'ipfs://bafkreifza5rl2ynyznzvool3yjzhriabx4cmzpwvfltraxnre54imvdvhe',
		'ipfs://bafkreih27yyt4wollwz7fcmzxr3uzjx3d3pi375743d2w35edltgsop7su'
	];

	return (
		<>
			{IPSFProposals.map((ipfs, index) => (
				<SnapshotProposal
					key={index}
					uri={ipfs}
				/>
			))}
		</>
	);
}

function OnChainProposal(props: {
	proposal: TOnchainProposal;
	quorum: TNormalizedBN;
	onRefreshProposals: VoidFunction;
}): ReactElement {
	const {address, provider} = useWeb3();
	const [voteYeaStatus, set_voteYeaStatus] = useState<TTxStatus>(defaultTxStatus);
	const [voteNayStatus, set_voteNayStatus] = useState<TTxStatus>(defaultTxStatus);
	const [voteAbstainStatus, set_voteAbstainStatus] = useState<TTxStatus>(defaultTxStatus);
	const [data, set_data] = useState<TOnChainProposal | null>(null);
	const [isLoading, set_isLoading] = useState<boolean>(true);

	useAsyncTrigger(async () => {
		set_isLoading(true);
		const getters = [
			axios.get(props.proposal.cid.replace('ipfs://', 'https://snapshot.4everland.link/ipfs/')),
			axios.get((props.proposal.cidV1 || '').replace('ipfs://', 'https://snapshot.4everland.link/ipfs/'))
		];
		const result = await Promise.allSettled(getters);
		if (result[0].status === 'fulfilled') {
			set_data(result[0].value.data);
		} else if (result[1].status === 'fulfilled') {
			set_data(result[1].value.data);
		}
		set_isLoading(false);
	}, [props.proposal.cid, props.proposal.cidV1]);

	const {data: hasVoted} = useReadContract({
		abi: GOVERNOR_ABI,
		address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
		functionName: 'voted',
		args: [toAddress(address), props.proposal.index],
		query: {
			enabled: !isZeroAddress(address)
		}
	});

	const onVote = useCallback(
		async (index: bigint, decision: bigint) => {
			if (decision === 1n) {
				const result = await voteYea({
					connector: provider,
					chainID: Number(process.env.DEFAULT_CHAIN_ID),
					contractAddress: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
					index: index,
					statusHandler: set_voteYeaStatus
				});
				if (result.isSuccessful) {
					props.onRefreshProposals();
				}
			} else if (decision === 0n) {
				const result = await voteAbstain({
					connector: provider,
					chainID: Number(process.env.DEFAULT_CHAIN_ID),
					contractAddress: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
					index: index,
					statusHandler: set_voteAbstainStatus
				});
				if (result.isSuccessful) {
					props.onRefreshProposals();
				}
			} else if (decision === -1n) {
				const result = await voteNay({
					connector: provider,
					chainID: Number(process.env.DEFAULT_CHAIN_ID),
					contractAddress: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
					index: index,
					statusHandler: set_voteNayStatus
				});
				if (result.isSuccessful) {
					props.onRefreshProposals();
				}
			}
		},
		[provider, props]
	);

	function stateToString(state: bigint): string {
		switch (state) {
			case 0n:
				return 'Absent';
			case 1n:
				return 'Proposed';
			case 2n:
				return 'Passed';
			case 3n:
				return 'Rejected';
			case 4n:
				return 'Retracted';
			case 5n:
				return 'Cancelled';
			case 6n:
				return 'Enacted';
			default:
				return 'Unknown';
		}
	}

	if (isLoading) {
		return (
			<div className={'flex w-full flex-col gap-2 bg-neutral-100 px-8 py-6'}>
				<div className={'mb-2 h-8 w-1/2 animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-full animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-full animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-3/4 animate-pulse rounded-lg bg-neutral-400/80'} />
			</div>
		);
	}

	const totalVotes = props.proposal.yea + props.proposal.nay + props.proposal.abstain;
	const isClosed = props.proposal.state >= 2n;
	if (!data) {
		return (
			<div className={'relative flex w-full flex-col gap-4 bg-neutral-100 px-8 py-6'}>
				<div className={'absolute right-8 top-6'}>
					<div
						className={cl(
							'rounded-xl px-3 py-1.5 text-xs font-bold text-white',
							[3n, 4n, 5n].includes(props.proposal.state)
								? 'bg-red-900'
								: [6n, 2n].includes(props.proposal.state)
									? 'bg-[hsl(135,51%,42%)]'
									: 'bg-primary'
						)}>
						{stateToString(props.proposal.state)}
					</div>
				</div>
				<b className={'text-2xl'}>{props.proposal.ipfs}</b>
				<div className={'markdown scrollbar-show max-h-60 overflow-y-scroll'}>
					<Markdown>{`No description available for this proposal: \n\r-CID: **[${props.proposal.cid}](${props.proposal.cid})** \n\r-Author: **[${props.proposal.author}](https://etherscan.io/address/${props.proposal.author})**`}</Markdown>
				</div>
				<div>
					<dl className={'-mt-4 grid grid-cols-2 gap-0 rounded bg-neutral-200 p-4'}>
						<dt>{'Yea'}</dt>
						<dd className={'text-right'}>
							{`${formatAmount(toNormalizedBN(props.proposal.yea, 18).normalized, 6, 6)} / ${formatAmount(toNormalizedBN(totalVotes, 18).normalized, 6, 6)}`}
						</dd>
						<dt>{'Nay'}</dt>
						<dd className={'text-right'}>
							{`${formatAmount(toNormalizedBN(props.proposal.nay, 18).normalized, 6, 6)} / ${formatAmount(toNormalizedBN(totalVotes, 18).normalized, 6, 6)}`}
						</dd>
						<dt>{'Abstain'}</dt>
						<dd className={'text-right'}>
							{`${formatAmount(toNormalizedBN(props.proposal.abstain, 18).normalized, 6, 6)} / ${formatAmount(toNormalizedBN(totalVotes, 18).normalized, 6, 6)}`}
						</dd>
						<dt>{'Quorum'}</dt>
						<dd className={'text-right'}>{formatAmount(props.quorum.normalized, 6, 6)}</dd>
					</dl>
					<div className={'relative mt-4 h-3 w-full overflow-hidden rounded bg-neutral-200'}>
						<div
							className={'absolute top-0 z-10 h-3 bg-[hsl(135,51%,42%)]'}
							style={{
								width: `${(Number(props.proposal.yea) / Number(totalVotes)) * 100}%`
							}}
						/>
						<div
							className={'absolute top-0 h-3 bg-red-900'}
							style={{
								width: `${(Number(props.proposal.nay) / Number(totalVotes)) * 100}%`,
								left: `${(Number(props.proposal.yea) / Number(totalVotes)) * 100}%`
							}}
						/>
						<div
							className={'absolute top-0 h-3 bg-neutral-300'}
							style={{
								width: `${(Number(props.proposal.abstain) / Number(totalVotes)) * 100}%`,
								left: `${(Number(props.proposal.yea) / Number(totalVotes)) * 100 + (Number(props.proposal.nay) / Number(totalVotes)) * 100}%`
							}}
						/>
						<div
							className={cl(
								'absolute top-0 z-50 h-full w-[2px] bg-black',
								totalVotes === 0n ? 'hidden' : ''
							)}
							style={{
								left: `${(Number(props.quorum.normalized) / Number(totalVotes)) * 100}%`
							}}
						/>
					</div>
				</div>
				<div className={'flex gap-4'}>
					{isClosed ? (
						<Button
							isDisabled
							className={'w-48'}>
							{'Closed'}
						</Button>
					) : (
						<>
							<Button
								onClick={async () => onVote(props.proposal.index, 1n)}
								isBusy={voteYeaStatus.pending}
								isDisabled={hasVoted || props.proposal.state >= 2n}
								className={'w-48'}>
								{'Yea'}
							</Button>
							<Button
								onClick={async () => onVote(props.proposal.index, -1n)}
								isBusy={voteNayStatus.pending}
								isDisabled={hasVoted || props.proposal.state >= 2n}
								className={'w-48'}>
								{'Nay'}
							</Button>
							<Button
								onClick={async () => onVote(props.proposal.index, 0n)}
								isBusy={voteAbstainStatus.pending}
								isDisabled={hasVoted || props.proposal.state >= 2n}
								className={'w-48'}>
								{'Abstain'}
							</Button>
						</>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className={'relative flex w-full flex-col gap-4 bg-neutral-100 px-8 py-6'}>
			<div className={'absolute right-8 top-6 flex gap-4'}>
				{hasVoted ? (
					<div className={cl('rounded-xl px-3 py-1.5 text-xs font-bold text-white', 'bg-[hsl(135,51%,42%)]')}>
						{'Voted ✔'}
					</div>
				) : null}
				<div
					className={cl(
						'rounded-xl px-3 py-1.5 text-xs font-bold text-white',
						[3n, 4n, 5n].includes(props.proposal.state)
							? 'bg-red-900'
							: [6n, 2n].includes(props.proposal.state)
								? 'bg-[hsl(135,51%,42%)]'
								: 'bg-primary'
					)}>
					{stateToString(props.proposal.state)}
				</div>
			</div>
			<b className={'text-2xl'}>{data.title}</b>
			<div className={'markdown scrollbar-show max-h-60 overflow-y-scroll'}>
				<Markdown>{data.description}</Markdown>
			</div>
			<div>
				<dl className={'-mt-4 grid grid-cols-2 gap-0 rounded bg-neutral-200 p-4'}>
					<dt>{'Yea'}</dt>
					<dd className={'text-right'}>
						{`${formatAmount(toNormalizedBN(props.proposal.yea, 18).normalized, 6, 6)} / ${formatAmount(toNormalizedBN(totalVotes, 18).normalized, 6, 6)}`}
					</dd>
					<dt>{'Nay'}</dt>
					<dd className={'text-right'}>
						{`${formatAmount(toNormalizedBN(props.proposal.nay, 18).normalized, 6, 6)} / ${formatAmount(toNormalizedBN(totalVotes, 18).normalized, 6, 6)}`}
					</dd>
					<dt>{'Abstain'}</dt>
					<dd className={'text-right'}>
						{`${formatAmount(toNormalizedBN(props.proposal.abstain, 18).normalized, 6, 6)} / ${formatAmount(toNormalizedBN(totalVotes, 18).normalized, 6, 6)}`}
					</dd>
					<dt>{'Quorum'}</dt>
					<dd className={'text-right'}>{formatAmount(props.quorum.normalized, 6, 6)}</dd>
				</dl>
				<div className={'relative mt-4 h-3 w-full overflow-hidden rounded bg-neutral-200'}>
					<div
						className={'absolute top-0 z-10 h-3 bg-[hsl(135,51%,42%)]'}
						style={{
							width: `${(Number(props.proposal.yea) / Number(totalVotes)) * 100}%`
						}}
					/>
					<div
						className={'absolute top-0 h-3 bg-red-900'}
						style={{
							width: `${(Number(props.proposal.nay) / Number(totalVotes)) * 100}%`,
							left: `${(Number(props.proposal.yea) / Number(totalVotes)) * 100}%`
						}}
					/>
					<div
						className={'absolute top-0 h-3 bg-neutral-300'}
						style={{
							width: `${(Number(props.proposal.abstain) / Number(totalVotes)) * 100}%`,
							left: `${(Number(props.proposal.yea) / Number(totalVotes)) * 100 + (Number(props.proposal.nay) / Number(totalVotes)) * 100}%`
						}}
					/>
					<div
						className={cl('absolute top-0 z-50 h-full w-[2px] bg-black', totalVotes === 0n ? 'hidden' : '')}
						style={{
							left: `${(Number(props.quorum.normalized) / Number(totalVotes)) * 100}%`
						}}
					/>
				</div>
			</div>
			<div className={'flex gap-4'}>
				{isClosed ? (
					<Button
						isDisabled
						className={'w-48'}>
						{'Closed'}
					</Button>
				) : (
					<>
						<Button
							onClick={async () => onVote(props.proposal.index, 1n)}
							isBusy={voteYeaStatus.pending}
							isDisabled={hasVoted || props.proposal.state >= 2n}
							className={'w-48'}>
							{'Yea'}
						</Button>
						<Button
							onClick={async () => onVote(props.proposal.index, -1n)}
							isBusy={voteNayStatus.pending}
							isDisabled={hasVoted || props.proposal.state >= 2n}
							className={'w-48'}>
							{'Nay'}
						</Button>
						<Button
							onClick={async () => onVote(props.proposal.index, 0n)}
							isBusy={voteAbstainStatus.pending}
							isDisabled={hasVoted || props.proposal.state >= 2n}
							className={'w-48'}>
							{'Abstain'}
						</Button>
					</>
				)}
			</div>
		</div>
	);
}

function OnChainProposals(props: {proposals: TOnchainProposal[]; onRefreshProposals: VoidFunction}): ReactElement {
	const {data: quorum} = useReadContract({
		abi: GOVERNOR_ABI,
		address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
		functionName: 'quorum',
		query: {
			select(data) {
				return toNormalizedBN(data, 18);
			}
		}
	});

	return (
		<div>
			{props.proposals.map((data, index) => (
				<OnChainProposal
					key={`${data.cid}_${index}`}
					proposal={data}
					quorum={quorum || zeroNormalizedBN}
					onRefreshProposals={props.onRefreshProposals}
				/>
			))}
		</div>
	);
}

function GovernanceProposals(props: {proposals: TOnchainProposal[]; onRefreshProposals: VoidFunction}): ReactElement {
	return (
		<div className={'grid gap-0 divide-y divide-neutral-300 pt-0'}>
			<OnChainProposals {...props} />
			<SnapshotProposals />
		</div>
	);
}

function LSTWeightsProposal(props: {
	votePower: TNormalizedBN | undefined;
	isVoteOpen: boolean;
	hasVoted: boolean;
}): ReactElement {
	return (
		<div className={'grid gap-0 bg-neutral-100 px-4 pb-10 pt-0 md:px-14'}>
			<div className={'mt-6 pl-4 text-neutral-700'}>
				<p>
					{
						'Per the yUSD YIP, 10% of the weight is redistributed every epoch. The outcome of this vote determines how it is redistributed.'
					}
				</p>
			</div>

			<VoteCardWeights {...props} />
		</div>
	);
}

function InclusionProposals(props: {
	votePower: TNormalizedBN | undefined;
	isVoteOpen: boolean;
	hasVoted: boolean;
}): ReactElement {
	return (
		<div className={'grid gap-0 bg-neutral-100 px-4 pb-10 pt-0 md:px-14'}>
			<div className={'mt-6 pl-4 text-neutral-700'}>
				<p>{'The outcome of this vote will determine which asset will be newly added to the pool.'}</p>
			</div>
			<VoteCardInclusion {...props} />
		</div>
	);
}

function ProposalWrapper(): ReactElement {
	const {address} = useWeb3();
	const {epoch} = useBasket();
	const [currentTab, set_currentTab] = useState<'weight' | 'inclusion' | 'governance'>('weight');
	const [governanceProposals, set_governanceProposals] = useState<TOnchainProposal[]>([]);
	const [shouldVoteForProposals, set_shouldVoteForProposals] = useState<boolean>(false);
	const {data: blockNumber} = useBlockNumber({watch: true});

	/**********************************************************************************************
	 ** In order to display nice little badges on the tabs, we need to check if the user has voted
	 ** for any of the open proposals, weight, inclusion or governance.
	 ** This requires us to fetch a bunch of data prior to rendering the component.
	 **********************************************************************************************/
	const {data, isLoading, refetch} = useReadContracts({
		contracts: [
			{
				abi: VOTE_WEIGHT_ABI,
				address: toAddress(process.env.VOTE_POWER_ADDRESS),
				functionName: 'vote_weight',
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				args: [toAddress(address)]
			},
			{
				abi: ONCHAIN_VOTE_WEIGHT_ABI,
				address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				functionName: 'voted',
				args: [toAddress(address), toBigInt(epoch)]
			},
			{
				abi: ONCHAIN_VOTE_WEIGHT_ABI,
				address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				functionName: 'vote_open'
			},
			{
				abi: ONCHAIN_VOTE_INCLUSION_ABI,
				address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				functionName: 'vote_open'
			},
			{
				abi: ONCHAIN_VOTE_INCLUSION_ABI,
				address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				functionName: 'votes_user',
				args: [toAddress(address), toBigInt(epoch)]
			}
		],
		query: {
			select(data) {
				const votePower = toNormalizedBN(decodeAsBigInt(data[0]), 18);
				const hasVotedForWeight = decodeAsBoolean(data[1]);
				const isWeightOpen = decodeAsBoolean(data[2]);
				const hasVotedForInclusion = decodeAsBigInt(data[3]) > 0n;
				const isInclusionOpen = decodeAsBoolean(data[4]);
				return {votePower, hasVotedForWeight, isWeightOpen, hasVotedForInclusion, isInclusionOpen};
			}
		}
	});

	useEffect(() => {
		refetch();
	}, [blockNumber, refetch]);

	const refreshProposals = useAsyncTrigger(async () => {
		const proposalsCount = await readContract(retrieveConfig(), {
			abi: GOVERNOR_ABI,
			chainId: Number(process.env.DEFAULT_CHAIN_ID),
			address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
			functionName: 'num_proposals'
		});

		const data = await multicall(retrieveConfig(), {
			contracts: Array.from({length: Number(proposalsCount)}, (_, i) => ({
				abi: GOVERNOR_ABI,
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
				functionName: 'proposal',
				args: [i]
			}))
		});

		const allProposals = [];
		let index = 0n;
		for (const proposal of data) {
			if (proposal.status === 'success') {
				const typedProposals = proposal.result as unknown as TOnchainProposal;
				const ipfsWithout0x = typedProposals.ipfs.replace('0x', '');
				const multihashDigest = base16.decode('f' + ipfsWithout0x);

				// Standard method
				const multihash = create(18, multihashDigest);
				const createv1 = CID.createV1(0x70, multihash);
				const v0 = createv1.toV0();

				// Other method
				const multihashAlt = create(18, multihashDigest);
				const createV1Alt = CID.createV1(0x55, multihashAlt);
				const v1 = createV1Alt.toV1();

				allProposals.push({
					...typedProposals,
					cid: `ipfs://${v0.toString()}`,
					cidV1: `ipfs://${v1.toString()}`,
					index
				});
			}
			index++;
		}
		allProposals.reverse();
		set_governanceProposals(allProposals);

		/******************************************************************************************
		 ** If we want to provide a smooth experience, we need to display a badge only if the user
		 ** needs to vote. To do this, we need to check if the user has voted for any of the open
		 ** proposals.
		 ** As this can take a while, we will do this in parallel.
		 ******************************************************************************************/
		const openProposals = allProposals.filter(proposal => proposal.state === 1n);
		if (openProposals.length === 0 || isZeroAddress(address)) {
			set_shouldVoteForProposals(false);
			return;
		}
		const hasVotedForOpenProposals = await readContracts(retrieveConfig(), {
			contracts: openProposals.map(proposal => ({
				abi: GOVERNOR_ABI,
				address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
				functionName: 'voted',
				args: [toAddress(address), proposal.index]
			}))
		});

		//Count the number of proposals the user has voted for
		let votedProposals = 0;
		for (const voted of hasVotedForOpenProposals) {
			if (decodeAsBoolean(voted)) {
				votedProposals++;
			}
		}
		set_shouldVoteForProposals(votedProposals > 0);
	}, [address]);

	/**********************************************************************************************
	 ** Once everything is ready to render, we render
	 **********************************************************************************************/
	const hasOpenProposals = governanceProposals.some(proposal => proposal.state === 1n);
	return (
		<div className={'bg-neutral-0 relative mx-auto mb-0 flex min-h-screen w-full flex-col pt-20'}>
			<div className={'relative mx-auto mt-6 w-screen max-w-5xl'}>
				<VoteHeader
					votePower={data?.votePower}
					isLoading={isLoading}
				/>
				<section className={'py-10'}>
					<div className={'bg-neutral-100 pb-0 pt-4'}>
						<Tabs
							shouldVote={[
								data ? data.isWeightOpen && !data.hasVotedForWeight : false,
								data ? data.isInclusionOpen && !data.hasVotedForInclusion : false,
								hasOpenProposals && shouldVoteForProposals
							]}
							currentTab={currentTab}
							set_currentTab={set_currentTab}
						/>
					</div>
					{currentTab === 'weight' ? (
						<LSTWeightsProposal
							isVoteOpen={data ? data.isWeightOpen : false}
							hasVoted={data ? data.hasVotedForWeight : true}
							votePower={data?.votePower}
						/>
					) : null}
					{currentTab === 'inclusion' ? (
						<InclusionProposals
							isVoteOpen={data ? data.isInclusionOpen : false}
							hasVoted={data ? data.hasVotedForInclusion : true}
							votePower={data?.votePower}
						/>
					) : null}
					{currentTab === 'governance' ? (
						<GovernanceProposals
							proposals={governanceProposals}
							onRefreshProposals={refreshProposals}
						/>
					) : null}
				</section>
			</div>
		</div>
	);
}

export default ProposalWrapper;
