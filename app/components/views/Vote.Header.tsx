import React from 'react';
import {useEpoch} from 'app/hooks/useEpoch';
import {useTimer} from 'app/hooks/useTimer';
import {VOTE_WEIGHT_ABI} from 'app/utils/abi/voteWeight.abi';
import {useContractRead} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {formatAmount, toAddress, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import {Renderable} from '@yearn-finance/web-lib/components/Renderable';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	const {voteStart, endPeriod, hasVotingStarted} = useEpoch();
	const time = useTimer({endTime: hasVotingStarted ? Number(endPeriod) : Number(voteStart)});

	return (
		<b
			suppressHydrationWarning
			className={'font-number mt-4 text-4xl leading-10 text-purple-300'}>
			{hasVotingStarted ? `ends in ${time}` : `starts in ${time}`}
		</b>
	);
}

function VoteDecayTimer(): ReactElement {
	const {endPeriod, hasVotingStarted} = useEpoch();
	const onDay = 86400;
	const time = useTimer({endTime: hasVotingStarted ? Number(endPeriod) - onDay : 0});

	return (
		<small
			suppressHydrationWarning
			className={'font-number block pt-4 text-xs'}>
			{hasVotingStarted ? `Will decay in in ${time}` : ``}
		</small>
	);
}

function VoteHeader(): ReactElement {
	const {address} = useWeb3();
	const {data: votePower} = useContractRead({
		abi: VOTE_WEIGHT_ABI,
		address: toAddress(process.env.VOTE_POWER_ADDRESS),
		functionName: 'vote_weight',
		args: [toAddress(address)],
		watch: true,
		select(data) {
			return toNormalizedBN(toBigInt(data), 18);
		}
	});

	return (
		<div className={'mb-10 flex w-full flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>{'Vote'}</h1>
			<Timer />
			<div className={'mt-6 flex w-full flex-col items-start gap-4 md:grid md:grid-cols-2 md:flex-row md:gap-6'}>
				<div className={'w-full'}>
					<p className={'text-neutral-700'}>
						{
							'st-yETH holders are the house, senate, lords, and commons of yETH governance. Holders vote every epoch on yETH composition, accepting new LSTs into yETH, as well as governance proposals and parameter configurations. Vote power is fixed at the start of voting.'
						}
					</p>
					<p className={'pt-4 text-neutral-700'}>
						{
							'With the transition to on-chain governance, voting power now decays in the remaining 24 hours of the voting period, from 100% to 0% at the final block of the epoch.'
						}
					</p>
				</div>
				<div className={'-mt-4 flex w-full justify-end space-x-4 pb-2 md:w-auto'}>
					<div className={'w-full min-w-[300px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'whitespace-nowrap pb-2'}>{'Current voting power this epoch'}</p>
						<b
							suppressHydrationWarning
							className={'font-number text-3xl'}>
							<Renderable
								shouldRender={true}
								fallback={'-'}>
								{formatAmount(votePower?.normalized || 0, 4, 4)}
							</Renderable>
						</b>
						{toBigInt(votePower?.raw) > 0n ? <VoteDecayTimer /> : null}
					</div>
				</div>
			</div>
		</div>
	);
}

export {VoteHeader};
