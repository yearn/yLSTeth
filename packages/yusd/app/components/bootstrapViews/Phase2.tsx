import React from 'react';
import Link from 'next/link';
import {motion} from 'framer-motion';
import HeroAsLottie from '@libComponents/HeroAsLottie';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@radix-ui/react-tooltip';
import {Button} from '@yearn-finance/web-lib/components/Button';
import useBootstrap from '@yUSD/contexts/useBootstrap';
import {customVariants} from '@yUSD/utils';

import {Timer} from './Timer';

import type {ReactElement} from 'react';

type TPhase = 'bootstrap' | 'launch-prep' | 'deployment';

function Phase2(): ReactElement {
	const {
		periods: {depositEnd, depositStatus}
	} = useBootstrap();
	const phases: TPhase[] = ['bootstrap', 'launch-prep', 'deployment'];
	const currentPhase = 'bootstrap';
	const currentPhaseIndex = phases.indexOf(currentPhase);

	const getPhaseDescription = (phase: TPhase): string => {
		switch (phase) {
			case 'bootstrap':
				return 'Deposit and vote on which tokens to launch with, choose from 5-6 whitelisted assets or add your own. No withdrawals allowed.';
			case 'launch-prep':
				return 'Deposits are closed. The top 4 assets are selected and set as the initial pool weights. All other assets are converted into these.';
			case 'deployment':
				return "The pool is initialized, and we're live.";
			default:
				return 'Unknown phase';
		}
	};

	return (
		<section className={'absolute inset-x-0 grid grid-cols-12 gap-0 px-4 pt-10 md:gap-20 md:pt-12'}>
			<div className={'col-span-12 mb-20 md:col-span-6 md:mb-0'}>
				<div className={'mb-10 flex flex-col justify-center'}>
					<motion.h1
						className={'z-10 whitespace-nowrap text-3xl md:text-8xl'}
						variants={customVariants(0.02)}
						custom={'0vw'}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						{'Bootstrapping'}
					</motion.h1>
					<motion.b
						suppressHydrationWarning
						className={'font-number text-3xl md:text-4xl'}
						variants={customVariants(0.04)}
						custom={'0vw'}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						<Timer
							endTime={Number(depositEnd)}
							status={depositStatus}
						/>
					</motion.b>
				</div>
				<div>
					<div className={'flex flex-col'}>
						<div className={'mb-8 w-full'}>
							<div className={'mb-2 flex justify-between'}>
								{phases.map((phase, index) => (
									<TooltipProvider key={phase}>
										<Tooltip delayDuration={100}>
											<TooltipTrigger asChild>
												<div className={'cursor-help text-center'}>
													<div
														className={`mx-auto mb-2 flex size-8 items-center justify-center rounded-full ${index <= currentPhaseIndex ? 'bg-accent' : 'bg-neutral-300'}`}>
														<span className={'font-bold text-white'}>{index + 1}</span>
													</div>
													<p className={'text-sm capitalize'}>{phase.replace('-', ' ')}</p>
												</div>
											</TooltipTrigger>
											<TooltipContent side={'bottom'}>
												<div
													className={
														'max-w-xs border border-neutral-100 bg-white px-4 py-2 text-sm shadow-md'
													}>
													<p>{getPhaseDescription(phase)}</p>
												</div>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								))}
							</div>
							<div className={'h-2 rounded-full bg-neutral-200'}>
								<div
									className={'bg-accent h-full rounded-full transition-all duration-500 ease-in-out'}
									style={{width: `${((currentPhaseIndex + 1) / phases.length) * 100}%`}}
								/>
							</div>
						</div>

						<div className={'mb-6'}>
							<p
								title={'Deposit'}
								className={'pb-4 text-lg font-bold'}>
								{'Deposit'}
							</p>
							<div className={'text-neutral-700'}>
								<p>
									{
										'Depositooooors! Lock ETH in the Bootstrapper contract and recieve st-yETH at a 1:1 rate (nice when the maths is simple eh?)'
									}
								</p>
								&nbsp;
								<p>
									{
										'This ETH is locked for the 16 week duration of the Bootstrapping period in which time you can vote on LSTs to include in yETH in exchange for bri...incentives.'
									}
								</p>
								&nbsp;
								<p>
									{
										'You’ll get incentives from the LSTs that end up in the yETH basket, whether or not you voted from them. So no need for clever games, vote however you want. Plus you’ll be receiving the yield from the LSTs during the lock up period. Win win. '
									}
								</p>
							</div>
							<Link href={'/deposit'}>
								<Button className={'yearn--button mt-6 w-full rounded-md !text-sm md:w-1/2'}>
									{'Deposit'}
								</Button>
							</Link>

							<p
								title={'Incentivize'}
								className={'pb-4 pt-16 text-lg font-bold'}>
								{'Incentivize'}
							</p>
							<div className={'text-neutral-700'}>
								<p>
									{
										'Whitelisted protocols, time to get those incentives ready. Incentives can be posted in any token and in any amount.'
									}
								</p>
								&nbsp;
								<p>
									{
										'If your LST does not get included in yETH (sad), you’ll be able to claim back the full incentive amount (happy).'
									}
								</p>
								&nbsp;
								<p>
									{
										'If your LST is included in yETH, your incentive will be distributed to all st-yETH holders that participated in the voting process, whether they voted for you or not.'
									}
								</p>
							</div>
							<Link href={'/incentivize'}>
								<Button className={'yearn--button mt-6 w-full rounded-md !text-sm md:w-1/2'}>
									{'Incentivize'}
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>

			<motion.div
				className={'relative col-span-12 hidden h-screen md:col-span-6 md:flex'}
				variants={customVariants(0.06)}
				custom={'0vw'}
				initial={'initial'}
				animate={'move'}
				exit={'exit'}>
				<div className={'absolute inset-0 top-20 flex size-full justify-center'}>
					<HeroAsLottie id={'bootstrap'} />
				</div>
			</motion.div>
		</section>
	);
}

export default Phase2;
