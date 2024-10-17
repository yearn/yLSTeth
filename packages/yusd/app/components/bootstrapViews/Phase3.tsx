import React from 'react';
import {motion} from 'framer-motion';
import HeroAsLottie from '@libComponents/HeroAsLottie';
import {useTimer} from '@libHooks/useTimer';
import {useEpoch} from '@yUSD/hooks/useEpoch';
import {customVariants} from '@yUSD/utils';

import type {ReactElement} from 'react';

function Timer({isIncentivePeriodClosed}: {isIncentivePeriodClosed: boolean}): ReactElement {
	const {endPeriod} = useEpoch();
	const time = useTimer({endTime: Number(endPeriod - 3 * 24 * 3600)});

	return (
		<>
			<b
				suppressHydrationWarning
				className={'font-number text-accent mt-2 text-3xl leading-10'}>
				{isIncentivePeriodClosed ? 'closed' : `Ends in ${time}`}
			</b>
		</>
	);
}

function Phase3({variant}: {variant: string[]}): ReactElement {
	return (
		<section className={'absolute inset-x-0 grid grid-cols-12 gap-0 px-4 pt-10 md:gap-20 md:pt-12'}>
			<div className={'col-span-12 mb-20 md:col-span-6 md:mb-0'}>
				<div className={'mb-10 flex flex-col justify-center'}>
					<motion.p
						className={'text-lg'}
						variants={customVariants(0)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						{'Phase III'}
					</motion.p>
					<motion.h1
						className={'text-3xl md:text-8xl'}
						variants={customVariants(0.02)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						{'Voting'}
					</motion.h1>
					<motion.b
						suppressHydrationWarning
						className={'font-number mt-4 text-3xl leading-10 text-purple-300 md:text-4xl'}
						variants={customVariants(0.04)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						<Timer isIncentivePeriodClosed={false} />
					</motion.b>
				</div>

				<motion.div
					className={'grid w-full text-neutral-700'}
					variants={customVariants(0.05)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<p>
						{
							'Depositors who locked their ETH for st-yETH can check out the proposals from different LST protocols to be included in yETH.'
						}
					</p>
					&nbsp;
					<p>
						{
							'No need for game theory here, vote for whoever you feel should be in the basket and you’ll receive your share of incentives from the LSTs that are successful, whether your voted for them or not.'
						}
					</p>
					&nbsp;
					<p>
						{
							'Your vote matters anon, as it will help decide the launch composition of yETH. Your voting power is equal to the amount of st-yETH you’re holding and you can spread your votes over multiple protocols or go all in on one. Your vote, your choice.'
						}
					</p>
					&nbsp;
					<p>{'If only regular democracy came with incentives... sigh.'}</p>
				</motion.div>

				<motion.div
					variants={customVariants(0.06)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<div className={'mt-6'}>
						<b>{'Current whitelisted Protocols'}</b>
						<div className={'mt-4 flex flex-row flex-wrap gap-2'}>
							{((process.env.WHITELISTED_PROTOCOLS || []) as string[]).map(
								(protocolName, index): ReactElement => (
									<div
										key={`${protocolName}_${index}`}
										className={
											'text-neutral-0 rounded-full bg-purple-300 px-4 py-2 text-xs font-bold'
										}>
										{protocolName}
									</div>
								)
							)}
						</div>
					</div>
				</motion.div>
			</div>

			<motion.div
				className={'relative col-span-12 hidden h-screen md:col-span-6 md:flex'}
				variants={customVariants(0.06)}
				custom={variant}
				initial={'initial'}
				animate={'move'}
				exit={'exit'}>
				<div className={'absolute inset-0 top-20 flex size-full justify-center'}>
					<HeroAsLottie id={'voting'} />
				</div>
			</motion.div>
		</section>
	);
}

export default Phase3;
