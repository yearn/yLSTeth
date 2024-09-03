import React from 'react';
import Link from 'next/link';
import {motion} from 'framer-motion';
import HeroAsLottie from '@libComponents/HeroAsLottie';
import {useTimer} from '@libHooks/useTimer';
import {Button} from '@yearn-finance/web-lib/components/Button';
import useBootstrap from '@yUSD/contexts/useBootstrap';
import {customVariants} from '@yUSD/utils';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {depositBegin, depositEnd, depositStatus} = periods || {};
	const time = useTimer({endTime: depositStatus === 'started' ? Number(depositEnd) : Number(depositBegin)});
	return <>{depositStatus === 'ended' ? 'ended' : depositStatus === 'started' ? time : `in ${time}`}</>;
}

function Phase2Started(): ReactElement {
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
						className={'font-number mt-4 text-3xl text-purple-300 md:text-4xl'}
						variants={customVariants(0.04)}
						custom={'0vw'}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						<Timer />
					</motion.b>
				</div>
				<div>
					<div className={'flex flex-col'}>
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
					<HeroAsLottie id={'bribe'} />
				</div>
			</motion.div>
		</section>
	);
}

function Phase2Ended(): ReactElement {
	return (
		<section className={'absolute inset-x-0 grid grid-cols-12 gap-0 px-4 pt-10 md:gap-20 md:pt-12'}>
			<div className={'col-span-12 mb-20 md:col-span-6 md:mb-0'}>
				<div className={'mb-10 flex flex-col justify-center'}>
					<motion.h1
						className={'text-3xl md:text-8xl'}
						variants={customVariants(0.02)}
						custom={'0vw'}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						{'Bootstrapping'}
					</motion.h1>
					<motion.b
						suppressHydrationWarning
						className={'font-number mt-4 text-4xl leading-10 text-purple-300'}
						variants={customVariants(0.04)}
						custom={'0vw'}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						<Timer />
					</motion.b>
				</div>
				<motion.div
					className={'mb-6 grid w-full grid-cols-1 text-neutral-700'}
					variants={customVariants(0.05)}
					custom={'0vw'}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<p>
						{
							'Good times were shared, laughs were had, financial incentives were posted... but now the bootstrapping phases has ended.'
						}
					</p>
					&nbsp;
					<p>
						{
							'But worry not, that means it’s time to vote on which LSTs you want to see included in yETH. yETH holders - head over to Vote in order to vote and receive incentives for doing so (whether the LST you voted for ends up in yETH or not).'
						}
					</p>
				</motion.div>
				<motion.div
					variants={customVariants(0.06)}
					custom={'0vw'}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<Link href={'/incentivize'}>
						<Button className={'yearn--button w-full rounded-md !text-sm md:w-1/2'}>
							{'Check Incentives'}
						</Button>
					</Link>
				</motion.div>
			</div>
			<motion.div
				className={'relative col-span-12 hidden h-screen md:col-span-6 md:flex'}
				variants={customVariants(0.06)}
				custom={'0vw'}
				initial={'initial'}
				animate={'move'}
				exit={'exit'}>
				<div className={'absolute inset-0 top-20 flex size-full justify-center'}>
					<HeroAsLottie id={'bribe'} />
				</div>
			</motion.div>
		</section>
	);
}

function Phase2(): ReactElement {
	const {periods} = useBootstrap();
	const {depositStatus} = periods || {};

	if (depositStatus === 'ended') {
		return <Phase2Ended />;
	}
	return <Phase2Started />;
}

export default Phase2;
