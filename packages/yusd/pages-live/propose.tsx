import React, {useCallback, useEffect, useState} from 'react';
import Markdown from 'react-markdown';
import Link from 'next/link';
import assert from 'assert';
import {CID} from 'multiformats';
import {base16} from 'multiformats/bases/base16';
import {create} from 'multiformats/hashes/digest';
import {useAccount, useReadContract} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {cl, toAddress, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {GOVERNOR_ABI} from '@libAbi/governor.abi';
import {VOTE_WEIGHT_ABI} from '@libAbi/voteWeight.abi';
import {useFetch} from '@libHooks/useFetch';
import {useTimer} from '@libHooks/useTimer';
import {onChainProposalSchema, proposalSchema} from '@libUtils/types';
import {multicall, readContract} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {IconLinkOut} from '@yearn-finance/web-lib/icons/IconLinkOut';
import {propose, retract} from '@yUSD/actions';
import {useEpoch} from '@yUSD/hooks/useEpoch';

import type {FormEvent, ReactElement} from 'react';
import type {Hex} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TOnChainProposal, TProposalRoot} from '@libUtils/types';

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

function Timer(): ReactElement {
	const {voteStart, endPeriod, hasVotingStarted} = useEpoch();
	const time = useTimer({endTime: hasVotingStarted ? Number(endPeriod) : Number(voteStart)});

	return (
		<b
			suppressHydrationWarning
			className={'font-number text-accent mt-2 text-3xl leading-10'}>
			{hasVotingStarted ? `Open in ${time}` : `${time}`}
		</b>
	);
}

function Form(props: {canPropose: boolean}): ReactElement {
	const {isActive, provider, address} = useWeb3();
	const [submitStatus, set_submitStatus] = useState<TTxStatus>(defaultTxStatus);
	const [isValid, set_isValid] = useState(false);

	const {data: minWeight} = useReadContract({
		address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
		abi: GOVERNOR_ABI,
		functionName: 'propose_min_weight',
		query: {
			select(data) {
				return toNormalizedBN(toBigInt(data), 18);
			}
		}
	});
	const {data: votePower} = useReadContract({
		abi: VOTE_WEIGHT_ABI,
		address: toAddress(process.env.VOTE_POWER_ADDRESS),
		functionName: 'vote_weight',
		args: [toAddress(address)],
		query: {
			select(data) {
				return toNormalizedBN(toBigInt(data), 18);
			}
		}
	});

	function onCheckValidity(): void {
		const form = document.getElementById('apply-form') as HTMLFormElement;
		if (form) {
			const input = document.getElementById('scriptHex') as HTMLFormElement;
			if (input) {
				if (!input.value.startsWith('0x') && input.value.length > 0) {
					input.setCustomValidity('Please enter a valid hex script');
				} else {
					input.setCustomValidity('');
				}
			}
			set_isValid(form.checkValidity());
		}
	}

	const onSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			assert(isActive, 'Wallet not connected');
			assert(provider, 'Provider not connected');

			// get input values
			const input = document.getElementById('apply-form') as HTMLFormElement;
			const formData = new FormData(input);
			const ipfsPinURI = formData.get('ipfsPinURI') as string;
			const scriptHex = formData.get('scriptHex') as Hex;

			const result = await propose({
				connector: provider,
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				contractAddress: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
				ipfs: ipfsPinURI.replace('ipfs://', ''),
				script: scriptHex || '',
				statusHandler: set_submitStatus
			});
			if (result.isSuccessful) {
				document.getElementById('refresh-proposals')?.click();
			}
		},
		[isActive, provider]
	);

	return (
		<form
			id={'apply-form'}
			onSubmit={onSubmit}
			className={'relative flex-col bg-neutral-100 p-10 md:flex'}>
			<div className={'flex w-full flex-col gap-4'}>
				<div className={'flex w-full flex-col'}>
					<p className={'mb-1 text-sm text-neutral-600'}>{'IPFS pin'}</p>
					<div
						className={cl(
							'grow-1 col-span-7 flex h-10 w-full items-center justify-center rounded-md p-2',
							'bg-neutral-0'
						)}>
						<input
							id={'ipfsPinURI'}
							name={'ipfsPinURI'}
							required
							className={
								'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none'
							}
							type={'text'}
							placeholder={'ipfs://'}
							onChange={onCheckValidity}
						/>
					</div>
				</div>
				<div className={'flex w-full flex-col'}>
					<p className={'mb-1 text-sm text-neutral-600'}>{'Script (optional)'}</p>
					<div
						className={cl(
							'grow-1 col-span-7 flex w-full items-center justify-center rounded-md p-2 py-0',
							'bg-neutral-0'
						)}>
						<textarea
							id={'scriptHex'}
							name={'scriptHex'}
							className={
								'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 font-mono text-sm outline-none'
							}
							rows={10}
							style={{resize: 'none'}}
							placeholder={'A script that executes on-chain if the proposal passes'}
							onChange={onCheckValidity}
						/>
					</div>
				</div>
			</div>
			<div className={'pt-8'}>
				<div className={'mt-24 pt-2'}>
					<Button
						className={'w-48'}
						isBusy={submitStatus.pending}
						isDisabled={
							!isValid || toBigInt(votePower?.raw) < toBigInt(minWeight?.raw) || !props.canPropose
						}>
						{'Submit'}
					</Button>
					<small className={'text-neutral-400'}>
						{`Minimum weight to submit: ${minWeight?.normalized || 0} - Your weight: ${votePower?.normalized || 0}`}
						&nbsp;
					</small>
				</div>
			</div>
		</form>
	);
}

function SnapshotProposal(props: {uri: string; triggerLoaded: () => void}): ReactElement | null {
	const {address} = useAccount();
	const sanitizedURI = props?.uri.replace('ipfs://', 'https://snapshot.4everland.link/ipfs/');
	const {data, isLoading} = useFetch<TProposalRoot>({
		endpoint: sanitizedURI,
		schema: proposalSchema
	});

	useEffect(() => {
		props.triggerLoaded();
	}, [isLoading, props]);

	if (isLoading || !data) {
		return (
			<div className={'flex w-full flex-col gap-2 bg-neutral-200 px-8 py-6'}>
				<div className={'mb-2 h-8 w-1/2 animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-full animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-full animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-3/4 animate-pulse rounded-lg bg-neutral-400/80'} />
			</div>
		);
	}

	if (toAddress(data.address) !== toAddress(address)) {
		return null;
	}

	const isClosed = data?.data.message.end < Date.now() / 1000;
	return (
		<div className={'relative flex w-full flex-col gap-4 bg-neutral-200 px-8 py-6'}>
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

function OnChainProposal(props: {
	proposal: TOnchainProposal;
	canRetract: boolean;
	onRefreshProposals: VoidFunction;
}): ReactElement {
	const {provider} = useWeb3();
	const [retractStatus, set_retractStatus] = useState<TTxStatus>(defaultTxStatus);
	const sanitizedURI = props.proposal.cid.replace('ipfs://', 'https://snapshot.4everland.link/ipfs/');
	const {data, isLoading} = useFetch<TOnChainProposal>({
		endpoint: sanitizedURI,
		schema: onChainProposalSchema
	});

	const onRetract = useCallback(
		async (index: bigint) => {
			const result = await retract({
				connector: provider,
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				contractAddress: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
				index: index,
				statusHandler: set_retractStatus
			});
			if (result.isSuccessful) {
				props.onRefreshProposals();
			}
		},
		[provider, props]
	);

	if (isLoading || !data) {
		return (
			<div className={'flex w-full flex-col gap-2 bg-neutral-200 px-8 py-6'}>
				<div className={'mb-2 h-8 w-1/2 animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-full animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-full animate-pulse rounded-lg bg-neutral-400/80'} />
				<div className={'h-4 w-3/4 animate-pulse rounded-lg bg-neutral-400/80'} />
			</div>
		);
	}

	return (
		<div className={'relative flex w-full flex-col gap-4 bg-neutral-200 px-8 py-6'}>
			<b className={'text-2xl'}>{data.title}</b>
			<div className={'markdown scrollbar-show max-h-60 overflow-y-scroll'}>
				<Markdown>{data.description}</Markdown>
			</div>
			<div>
				<Button
					onClick={async () => onRetract(props.proposal.index)}
					isBusy={retractStatus.pending}
					isDisabled={props.proposal.state >= 2n || !props.canRetract}
					className={'w-48'}>
					{'Retract'}
				</Button>
			</div>
		</div>
	);
}

function OnChainProposals(props: {canRetract: boolean}): ReactElement {
	const {address} = useWeb3();
	const [proposals, set_proposals] = useState<TOnchainProposal[]>([]);

	const refreshProposals = useAsyncTrigger(async () => {
		const proposalsCount = await readContract(retrieveConfig(), {
			abi: GOVERNOR_ABI,
			address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
			chainId: Number(process.env.DEFAULT_CHAIN_ID),
			functionName: 'num_proposals'
		});

		const data = await multicall(retrieveConfig(), {
			contracts: Array.from({length: Number(proposalsCount)}, (_, i) => ({
				abi: GOVERNOR_ABI,
				address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
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
				const multihash = create(18, multihashDigest);
				const v1 = CID.createV1(0x70, multihash);
				const v0 = v1.toV0();
				if (toAddress(typedProposals.author) === toAddress(address)) {
					allProposals.push({...typedProposals, cid: `ipfs://${v0.toString()}`, index});
				}
			}
			index++;
		}

		set_proposals(allProposals);
	}, [address]);

	return (
		<>
			{proposals.map(data => (
				<OnChainProposal
					key={data.cid}
					proposal={data}
					canRetract={props.canRetract}
					onRefreshProposals={refreshProposals}
				/>
			))}
			<button
				id={'refresh-proposals'}
				onClick={refreshProposals}
				className={'pointer-events-none invisible hidden size-0 opacity-0'}>
				{'Refresh'}
			</button>
		</>
	);
}

function Proposals(props: {canRetract: boolean}): ReactElement {
	const [hasProposals, set_hasProposals] = useState<boolean>(false);
	const IPSFProposals = [
		'ipfs://bafkreie4c5gfprk77mm5lsimyidtyv4e22h6u4j2xhiarv4l5supwxscnm',
		'ipfs://bafkreih4otvqjsoixloh5abewegc4jf4tamfdql2ft2wjwl6a2uhn3gpkm',
		'ipfs://bafkreidvowbvbboijf4vdv6e4z3gt5ngd3ismbvvbpdh73fesy5y6uh334',
		'ipfs://bafkreifza5rl2ynyznzvool3yjzhriabx4cmzpwvfltraxnre54imvdvhe',
		'ipfs://bafkreih27yyt4wollwz7fcmzxr3uzjx3d3pi375743d2w35edltgsop7su'
	];

	const checkHasProposals = useCallback(() => {
		const proposalElement = document.getElementById('your proposals');
		if (!proposalElement) {
			return;
		}
		set_hasProposals(Number(proposalElement.childElementCount) > 0);
	}, []);

	return (
		<div>
			<div className={'mb-8 mt-40 flex flex-col justify-center'}>
				<h2 className={'text-2xl font-black md:text-4xl'}>{'Your proposals'}</h2>
			</div>
			<div
				id={'your proposals'}
				className={'grid gap-6'}>
				<OnChainProposals {...props} />
				{IPSFProposals.map((ipfs, index) => (
					<SnapshotProposal
						key={index}
						triggerLoaded={checkHasProposals}
						uri={ipfs}
					/>
				))}
			</div>
			<div id={String(hasProposals)}>
				<p
					style={{
						visibility: hasProposals ? 'hidden' : 'visible'
					}}
					className={'mt-0 text-neutral-500'}>
					{'You have no proposals'}
				</p>
			</div>
		</div>
	);
}

function ProposalWrapper(): ReactElement {
	const {data: isProposeOpen} = useReadContract({
		address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
		abi: GOVERNOR_ABI,
		functionName: 'propose_open'
	});

	return (
		<div className={'bg-neutral-0 relative mx-auto mb-0 flex min-h-screen w-full flex-col pt-20'}>
			<div className={'relative mx-auto mt-6 w-screen max-w-5xl'}>
				<section className={'grid grid-cols-12 gap-0 px-4 pt-10 md:gap-20 md:pt-12'}>
					<div className={'col-span-12 md:col-span-6 md:mb-0'}>
						<div className={'mb-6 flex flex-col justify-center'}>
							<h1 className={'text-3xl font-black md:text-8xl md:leading-[88px]'}>
								{'Submit  proposal'}
							</h1>
						</div>
						<div className={'mb-10'}>
							<Timer />
						</div>

						<div className={'mt-2 text-neutral-700'}>
							<p>
								{
									'Want your LST to be included in yUSD’s basket of tokens? You’ve come to the right place... the Application page. Good job so far. Here’s your next steps.'
								}
							</p>
							&nbsp;
							<p>
								{
									'Applications are checked for obvious scams, but nothing further. Genuine applications will be able to incentivize st-yUSD holders to vote their LST into yUSD. Good luck!'
								}
							</p>
						</div>
					</div>

					<div className={'col-span-12 md:col-span-6'}>
						<Form canPropose={isProposeOpen || false} />
					</div>
				</section>
				<section className={'px-4 pt-10'}>
					<Proposals canRetract={isProposeOpen || false} />
				</section>
			</div>
		</div>
	);
}

export default ProposalWrapper;
