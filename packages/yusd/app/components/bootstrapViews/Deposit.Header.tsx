import React, {useMemo} from 'react';
import {formatTAmount, toNormalizedBN} from '@builtbymom/web3/utils';
import {Renderable} from '@yearn-finance/web-lib/components/Renderable';
import useBootstrap from '@yUSD/contexts/useBootstrap';

import {Timer} from './Timer';

import type {ReactElement} from 'react';

function DepositHeader(): ReactElement {
	const {
		periods: {depositEnd, depositStatus},
		incentives: {totalDepositedUSD},
		depositHistory: {history}
	} = useBootstrap();

	const userTotalDeposited = useMemo(() => {
		return (
			history?.reduce((acc, current) => {
				const amount = toNormalizedBN(current.stTokenAmount, current.votedAsset.decimals);
				return acc + amount.normalized;
			}, 0) || 0
		);
	}, [history]);

	return (
		<div className={'flex gap-4'}>
			<div className={'mb-10 flex w-full flex-col justify-center'}>
				<h1 className={'text-3xl font-black md:text-8xl'}>{'Bootstrapping'}</h1>
				<Timer
					endTime={Number(depositEnd)}
					status={depositStatus}
				/>
				<div className={'mt-6 flex w-full flex-col items-start gap-4 md:grid-cols-1 md:flex-row md:gap-6'}>
					<div className={'w-full text-neutral-700'}>
						<p>{'Decide how much ETH you want to lock as st-yUSD.'}</p>
						<p>{'Remember this ETH will be locked for 16 weeks, but by holding st-yUSD:'}</p>
						<p className={'mt-4 font-black'}>
							{
								'You’ll receive incentives for voting on which STABLEs will be included in yUSD. Ka-ching.'
							}
						</p>
					</div>
					<div
						className={
							'flex w-full flex-col justify-end space-y-4 pb-2 md:w-auto md:flex-row md:space-x-4 md:space-y-0'
						}>
						<div className={'w-full min-w-[200px] bg-neutral-100 p-4 md:w-fit'}>
							<p className={'whitespace-nowrap pb-2'}>{'Current total deposits, USD'}</p>
							<b
								suppressHydrationWarning
								className={'font-number text-3xl'}>
								<Renderable
									shouldRender={true}
									fallback={'-'}>
									{formatTAmount({value: totalDepositedUSD.normalized, decimals: 2, symbol: '$'})}
								</Renderable>
							</b>
						</div>
						<div className={'w-full min-w-[200px] bg-neutral-100 p-4 md:w-fit'}>
							<p className={'whitespace-nowrap pb-2'}>{'Your total deposits, USD'}</p>
							<b
								suppressHydrationWarning
								className={'font-number text-3xl'}>
								<Renderable
									shouldRender={true}
									fallback={'-'}>
									{formatTAmount({value: userTotalDeposited, decimals: 2, symbol: '$'})}
								</Renderable>
							</b>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export {DepositHeader};
