import React, {useCallback, useEffect, useState} from 'react';
import Markdown from 'react-markdown';
import Link from 'next/link';
import {useFetch} from 'app/hooks/useFetch';
import {proposalSchema} from 'app/utils/types';
import {useAccount} from 'wagmi';
import {cl, toAddress} from '@builtbymom/web3/utils';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {IconLinkOut} from '@yearn-finance/web-lib/icons/IconLinkOut';

import type {TProposalRoot} from 'app/utils/types';
import type {ReactElement} from 'react';

function Form(): ReactElement {
	const [ipfsPinURI, set_ipfsPinURI] = useState<string | undefined>(undefined);
	const [scriptURI, set_scriptURI] = useState<string | undefined>(undefined);
	const [isValid] = useState(false);

	const onSubmit = useCallback(() => {
		console.log(`submit`);
	}, []);

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
							required
							className={
								'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none scrollbar-none'
							}
							type={'text'}
							placeholder={'ipfs://'}
							value={ipfsPinURI}
							onChange={e => set_ipfsPinURI(e.target.value)}
						/>
					</div>
				</div>
				<div className={'flex w-full flex-col'}>
					<p className={'mb-1 text-sm text-neutral-600'}>{'Script (optional)'}</p>
					<div
						className={cl(
							'grow-1 col-span-7 flex h-10 w-full items-center justify-center rounded-md p-2',
							'bg-neutral-0'
						)}>
						<input
							className={
								'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none scrollbar-none'
							}
							type={'text'}
							placeholder={'A script that executes on-chain if the proposal passes'}
							value={scriptURI}
							onChange={e => set_scriptURI(e.target.value)}
						/>
					</div>
				</div>
			</div>
			<div className={'pt-8'}>
				<div className={'mt-24 pt-2'}>
					<Button
						className={'w-48'}
						isDisabled={!isValid}>
						{'Apply'}
					</Button>
				</div>
			</div>
		</form>
	);
}

function Proposal(props: {uri: string; triggerLoaded: () => void}): ReactElement | null {
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

function Proposals(): ReactElement {
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
				{IPSFProposals.map((ipfs, index) => (
					<Proposal
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
	return (
		<div className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col bg-neutral-0 pt-20'}>
			<div className={'relative mx-auto mt-6 w-screen max-w-5xl'}>
				<section className={'grid grid-cols-12 gap-0 px-4 pt-10 md:gap-20 md:pt-12'}>
					<div className={'col-span-12 md:col-span-6 md:mb-0'}>
						<div className={'mb-10 flex flex-col justify-center'}>
							<h1 className={'text-3xl font-black md:text-8xl md:leading-[88px]'}>
								{'Submit  proposal'}
							</h1>
						</div>

						<div className={'mt-2 text-neutral-700'}>
							<p>
								{
									'Want your LST to be included in yETH’s basket of tokens? You’ve come to the right place... the Application page. Good job so far. Here’s your next steps.'
								}
							</p>
							&nbsp;
							<p>
								{
									'Applications are checked for obvious scams, but nothing further. Genuine applications will be able to incentivize st-yETH holders to vote their LST into yETH. Good luck!'
								}
							</p>
						</div>
					</div>

					<div className={'col-span-12 md:col-span-6'}>
						<Form />
					</div>
				</section>
				<section className={'px-4 pt-10 md:pt-12'}>
					<Proposals />
				</section>
			</div>
		</div>
	);
}

export default ProposalWrapper;
