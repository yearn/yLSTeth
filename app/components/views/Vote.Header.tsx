import React, {useMemo} from 'react';
import {useEpoch} from 'app/hooks/useEpoch';
import {useTimer} from 'app/hooks/useTimer';
import {erc20ABI, useContractRead} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {formatAmount, toAddress, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import {Renderable} from '@yearn-finance/web-lib/components/Renderable';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';

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

function VoteHeader(): ReactElement {
	const {address} = useWeb3();
	const {data: votePower} = useContractRead({
		abi: erc20ABI,
		address: toAddress(process.env.VOTE_POWER_ADDRESS),
		functionName: 'balanceOf',
		args: [toAddress(address)]
	});
	const votePowerNormalized = useMemo((): TNormalizedBN => toNormalizedBN(toBigInt(votePower), 18), [votePower]);

	return (
		<div className={'mb-10 flex w-full flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>{'Vote'}</h1>
			<Timer />
			<div className={'mt-6 flex w-full flex-col items-start gap-4 md:grid-cols-1 md:flex-row md:gap-6'}>
				<div className={'w-full'}>
					<p className={'text-neutral-700'}>
						{
							'st-yETH holders are the house, senate, lords, and commons of yETH governance. Holders vote every epoch on yETH composition, accepting new LSTs into yETH, as well as governance proposals and parameter configurations. Vote power accrues over time and is snapshotted every Thursday midnight (GMT).'
						}
					</p>
				</div>
				<div className={'flex w-full justify-end space-x-4 pb-2 md:w-auto'}>
					<div className={'pointer-events-none invisible w-full min-w-[100px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'pb-2'}>&nbsp;</p>
						<b
							suppressHydrationWarning
							className={'font-number text-3xl'}>
							{'-'}
						</b>
					</div>
					<div className={'w-full min-w-[300px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'whitespace-nowrap pb-2'}>{'Your vote power, st-yETH'}</p>
						<b
							suppressHydrationWarning
							className={'font-number text-3xl'}>
							<Renderable
								shouldRender={true}
								fallback={'-'}>
								{formatAmount(votePowerNormalized.normalized, 4, 4)}
							</Renderable>
						</b>
					</div>
				</div>
			</div>
		</div>
	);
}

export {VoteHeader};
