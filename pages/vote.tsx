import React, {useCallback, useEffect, useState} from 'react';
import Markdown from 'react-markdown';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {voteAbstain, voteNay, voteYea} from 'app/actions';
import {VoteCardWeights} from 'app/components/views/Vote.CardWeights';
import {VoteCardWhitelist} from 'app/components/views/Vote.CardWhitelist';
import {VoteHeader} from 'app/components/views/Vote.Header';
import {useFetch} from 'app/hooks/useFetch';
import {GOVERNOR_ABI} from 'app/utils/abi/governor.abi';
import {onChainProposalSchema, proposalSchema} from 'app/utils/types';
import {CID} from 'multiformats';
import {base16} from 'multiformats/bases/base16';
import {create} from 'multiformats/hashes/digest';
import {useContractRead} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {cl, formatAmount, toAddress, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {multicall, readContract} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {IconLinkOut} from '@yearn-finance/web-lib/icons/IconLinkOut';

import type {TOnChainProposal, TProposalRoot} from 'app/utils/types';
import type {ReactElement} from 'react';
import type {Hex} from 'viem';
import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

type TOnchainProposal = {
	cid: string;
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

function Tabs({
	set_currentTab,
	currentTab
}: {
	currentTab: 'weight' | 'inclusion' | 'governance';
	set_currentTab: (tab: 'weight' | 'inclusion' | 'governance') => void;
}): ReactElement {
	const router = useRouter();

	useEffect((): void => {
		const urlParams = new URLSearchParams(window.location.search);
		const action = urlParams.get('action');

		if (action && ['weight', 'inclusion', 'governance'].includes(action)) {
			set_currentTab(action as 'weight' | 'inclusion' | 'governance');
		} else if (
			router.query?.action &&
			['weight', 'inclusion', 'governance'].includes(router.query.action as string)
		) {
			set_currentTab(router.query.action as 'weight' | 'inclusion' | 'governance');
		}
	}, [set_currentTab, router.query]);

	return (
		<div className={'overflow-hidden'}>
			<div className={'relative -mx-4 px-4 md:px-72'}>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {action: 'weight'}});
					}}
					className={cl(
						'mx-4 mb-2 text-lg transition-colors',
						currentTab === 'weight' ? 'text-purple-300 font-bold' : 'text-neutral-400'
					)}>
					{'LST weights'}
				</button>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {action: 'inclusion'}});
					}}
					className={cl(
						'mx-4 mb-2 text-lg transition-colors',
						currentTab === 'inclusion' ? 'text-purple-300 font-bold' : 'text-neutral-400'
					)}>
					{'Inclusion'}
				</button>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {action: 'governance'}});
					}}
					className={cl(
						'mx-4 mb-2 text-lg transition-colors',
						currentTab === 'governance' ? 'text-purple-300 font-bold' : 'text-neutral-400'
					)}>
					{'Proposals'}
				</button>

				<div className={'absolute bottom-0 left-0 flex h-0.5 w-full flex-row bg-neutral-300 px-4 md:px-72'}>
					<div
						className={cl(
							'h-full w-fit transition-colors ml-4',
							currentTab === 'weight' ? 'bg-purple-300' : 'bg-transparent'
						)}>
						<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>
							{'LST weights'}
						</button>
					</div>
					<div
						className={cl(
							'h-full w-fit transition-colors ml-7',
							currentTab === 'inclusion' ? 'bg-purple-300' : 'bg-transparent'
						)}>
						<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>
							{'Inclusion'}
						</button>
					</div>
					<div
						className={cl(
							'h-full w-fit transition-colors ml-7',
							currentTab === 'governance' ? 'bg-purple-300' : 'bg-transparent'
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
	const {provider} = useWeb3();
	const [voteYeaStatus, set_voteYeaStatus] = useState<TTxStatus>(defaultTxStatus);
	const [voteNayStatus, set_voteNayStatus] = useState<TTxStatus>(defaultTxStatus);
	const [voteAbstainStatus, set_voteAbstainStatus] = useState<TTxStatus>(defaultTxStatus);
	const sanitizedURI = props.proposal.cid.replace('ipfs://', 'https://snapshot.4everland.link/ipfs/');
	const {data, isLoading} = useFetch<TOnChainProposal>({
		endpoint: sanitizedURI,
		schema: onChainProposalSchema
	});

	const onVote = useCallback(
		async (index: bigint, decision: bigint) => {
			if (decision === 1n) {
				const result = await voteYea({
					connector: provider,
					chainID: Number(process.env.BASE_CHAIN_ID),
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
					chainID: Number(process.env.BASE_CHAIN_ID),
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
					chainID: Number(process.env.BASE_CHAIN_ID),
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

	const totalVotes = props.proposal.yea + props.proposal.nay + props.proposal.abstain;
	const isClosed = props.proposal.state >= 2n;
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
								: 'bg-purple-300'
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
							isDisabled={props.proposal.state >= 2n}
							className={'w-48'}>
							{'Yea'}
						</Button>
						<Button
							onClick={async () => onVote(props.proposal.index, -1n)}
							isBusy={voteNayStatus.pending}
							isDisabled={props.proposal.state >= 2n}
							className={'w-48'}>
							{'Nay'}
						</Button>
						<Button
							onClick={async () => onVote(props.proposal.index, 0n)}
							isBusy={voteAbstainStatus.pending}
							isDisabled={props.proposal.state >= 2n}
							className={'w-48'}>
							{'Abstain'}
						</Button>
					</>
				)}
			</div>
		</div>
	);
}

function OnChainProposals(): ReactElement {
	const [proposals, set_proposals] = useState<TOnchainProposal[]>([]);

	const {data: quorum} = useContractRead({
		abi: GOVERNOR_ABI,
		address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
		functionName: 'quorum',
		select(data) {
			return toNormalizedBN(data, 18);
		}
	});

	const refreshProposals = useAsyncTrigger(async () => {
		const proposalsCount = await readContract({
			abi: GOVERNOR_ABI,
			address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
			functionName: 'num_proposals'
		});

		const data = await multicall({
			contracts: Array.from({length: Number(proposalsCount)}, (_, i) => ({
				abi: GOVERNOR_ABI,
				address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
				functionName: 'proposal',
				args: [i]
			}))
		});

		const allProposals = [];
		let index = 0n;
		for (const proposal of data) {
			if (proposal.status === 'success') {
				const typedProposals = proposal.result as TOnchainProposal;
				const ipfsWithout0x = typedProposals.ipfs.replace('0x', '');
				const multihashDigest = base16.decode('f' + ipfsWithout0x);
				const multihash = create(18, multihashDigest);
				const v1 = CID.createV1(0x70, multihash);
				const v0 = v1.toV0();

				allProposals.push({...typedProposals, cid: `ipfs://${v0.toString()}`, index});
			}
			index++;
		}

		set_proposals(allProposals);
	}, []);

	return (
		<div>
			{proposals.map(data => (
				<OnChainProposal
					key={data.cid}
					proposal={data}
					quorum={quorum || zeroNormalizedBN}
					onRefreshProposals={refreshProposals}
				/>
			))}
		</div>
	);
}

function GovernanceProposals(): ReactElement {
	return (
		<div className={'grid gap-0 divide-y divide-neutral-300 pt-0'}>
			<OnChainProposals />
			<SnapshotProposals />
		</div>
	);
}

function LSTWeightsProposal(): ReactElement {
	return (
		<div className={'grid gap-0 bg-neutral-100 px-4 pb-10 pt-0 md:px-14'}>
			<div className={'mt-6 pl-4 text-neutral-700'}>
				<p>
					{
						'Per the yETH YIP, 10% of the weight is redistributed every epoch. The outcome of this vote determines how it is redistributed.'
					}
				</p>
			</div>

			<VoteCardWeights />
		</div>
	);
}

function InclusionProposals(): ReactElement {
	return (
		<div className={'grid gap-0 bg-neutral-100 px-4 pb-10 pt-0 md:px-14'}>
			<div className={'mt-6 pl-4 text-neutral-700'}>
				<p>{'The outcome of this vote will determine which asset will be newly added to the pool.'}</p>
			</div>
			<VoteCardWhitelist />
		</div>
	);
}

function ProposalWrapper(): ReactElement {
	const [currentTab, set_currentTab] = useState<'weight' | 'inclusion' | 'governance'>('weight');
	return (
		<div className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col bg-neutral-0 pt-20'}>
			<div className={'relative mx-auto mt-6 w-screen max-w-5xl'}>
				<VoteHeader />
				<section className={'py-10'}>
					<div className={'bg-neutral-100 pb-0 pt-4'}>
						<Tabs
							currentTab={currentTab}
							set_currentTab={set_currentTab}
						/>
					</div>
					{currentTab === 'weight' ? <LSTWeightsProposal /> : null}
					{currentTab === 'inclusion' ? <InclusionProposals /> : null}
					{currentTab === 'governance' ? <GovernanceProposals /> : null}
				</section>
			</div>
		</div>
	);
}

export default ProposalWrapper;
