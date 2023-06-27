import React, {useState} from 'react';
import Link from 'next/link';
import HeroAsLottie from 'components/common/HeroAsLottie';
import useBootstrap from 'contexts/useBootstrap';
import {useTimer} from 'hooks/useTimer';
import {customVariants} from 'utils';
import {motion} from 'framer-motion';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {cl} from '@yearn-finance/web-lib/utils/cl';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {depositBegin, depositEnd, depositStatus} = periods || {};
	const time = useTimer({endTime: depositStatus === 'started' ? Number(depositEnd?.result) : Number(depositBegin?.result)});
	return <>{depositStatus === 'ended' ? 'ended' : depositStatus === 'started' ? time : `in ${time}`}</>;
}

function Phase2Started({variant}: {variant: string[]}): ReactElement {
	const [currentTab, set_currentTab] = useState(0);
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
						{'Phase II'}
					</motion.p>
					<motion.h1
						className={'z-10 whitespace-nowrap text-3xl md:text-8xl'}
						variants={customVariants(0.02)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						{'Bootstrapping'}
					</motion.h1>
					<motion.b
						suppressHydrationWarning
						className={'font-number mt-4 text-3xl text-purple-300 md:text-4xl'}
						variants={customVariants(0.04)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						<Timer />
					</motion.b>
				</div>
				<motion.div
					className={'grid w-full'}
					variants={customVariants(0.05)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<div className={'flex flex-col'}>
						<div className={'flex flex-row pb-6'}>
							<button
								onClick={(): void => set_currentTab(0)}
								className={cl('text-lg border-b-2 pb-2 transition-colors px-4', currentTab === 0 ? 'border-neutral-900 text-neutral-900 font-bold' : 'border-neutral-500 text-neutral-500')}>
								<p
									title={'Deposit'}
									className={'hover-fix'}>
									{'Deposit'}
								</p>
							</button>
							<button
								onClick={(): void => set_currentTab(1)}
								className={cl('text-lg border-b-2 pb-2 transition-colors px-4', currentTab === 1 ? 'border-neutral-900 text-neutral-900 font-bold' : 'border-neutral-500 text-neutral-500')}>
								<p
									title={'Incentivize'}
									className={'hover-fix'}>
									{'Incentivize'}
								</p>
							</button>
						</div>
						<div className={'mb-6'}>
							{currentTab === 0 ? (
								<div className={'text-neutral-700'}>
									<p>{'Depositooooors! Lock ETH in the Bootstrapper contract and recieve st-yETH at a 1:1 rate (nice when the maths is simple eh?)'}</p>
									&nbsp;
									<p>{'This ETH is locked for the 16 week duration of the Bootstrapping period in which time you can vote on LSTs to include in yETH in exchange for bri...incentives.'}</p>
									&nbsp;
									<p>{'You’ll get incentives from the LSTs that end up in the yETH basket, whether or not you voted from them. So no need for clever games, vote however you want. Plus you’ll be receiving the yield from the LSTs during the lock up period. Win win. '}</p>
								</div>
							) : (
								<div className={'text-neutral-700'}>
									<p>{'Whitelisted protocols, time to get those incentives ready. Incentives can be posted in any token and in any amount.'}</p>
									&nbsp;
									<p>{'If your LST does not get included in yETH (sad), you’ll be able to claim back the full incentive amount (happy).'}</p>
									&nbsp;
									<p>{'If your LST is included in yETH, your incentive will be distributed to all st-yETH holders that participated in the voting process, whether they voted for you or not.'}</p>
								</div>
							)}
						</div>
						<motion.div
							variants={customVariants(0.06)}
							custom={variant}
							initial={'initial'}
							animate={'move'}
							exit={'exit'}>
							<Link href={currentTab === 0 ? '/deposit' : '/incentive'}>
								<Button
									className={'yearn--button w-full rounded-md !text-sm md:w-1/2'}>
									{currentTab === 0 ? 'Deposit' : 'Incentivize'}
								</Button>
							</Link>
						</motion.div>
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
				<div className={'absolute inset-0 top-20 flex h-full w-full justify-center'}>
					<HeroAsLottie id={'bribe'}/>
				</div>
			</motion.div>
		</section>
	);
}

function Phase2NotStarted({variant}: {variant: string[]}): ReactElement {
	return (
		<section className={'absolute inset-x-0 grid grid-cols-1 px-4 pt-10 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<div className={'mb-10 flex flex-col justify-center'}>
					<motion.p
						className={'text-lg'}
						variants={customVariants(0)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						{'Phase II'}
					</motion.p>
					<motion.h1
						className={'text-3xl md:text-8xl'}
						variants={customVariants(0.02)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						{'Bootstrapping'}
					</motion.h1>
					<motion.b
						suppressHydrationWarning
						className={'font-number mt-4 text-4xl text-purple-300'}
						variants={customVariants(0.04)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						<Timer />
					</motion.b>
				</div>
				<motion.div
					className={'grid w-full grid-cols-1 gap-10 md:w-3/4 md:grid-cols-2 md:gap-[88px]'}
					variants={customVariants(0.05)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<div>
						<b>{'Deposit'}</b>
						<div className={'mt-2 text-neutral-700'}>
							<p>{'Depositooooors! Lock ETH in the Bootstrapper contract and recieve st-yETH at a 1:1 rate (nice when the maths is simple eh?)'}</p>
							&nbsp;
							<p>{'This ETH is locked for the 16 week duration of the Bootstrapping period in which time you can vote on LSTs to include in yETH in exchange for bri…incentives.'}</p>
							&nbsp;
							<p>{'You’ll get incentives from the LSTs that end up in the yETH basket, whether or not you voted from them. So no need for clever games, vote however you want.'}</p>
						</div>
					</div>

					<div>
						<b>{'Bribe'}</b>
						<div className={'mt-2 text-neutral-700'}>
							<p>{'Whitelisted protocols, time to get those incentives ready. Incentives can be posted in any token and in any amount.'}</p>
							&nbsp;
							<p>{'If your LST does not get included in yETH (sad), you’ll be able to claim back the full incentive amount (happy).'}</p>
							&nbsp;
							<p>{'If your LST is included in yETH, your incentive will be distributed to all st-yETH holders that participated in the voting process, whether they voted for you or not.'}</p>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}

function Phase2Ended({variant}: {variant: string[]}): ReactElement {
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
						{'Phase II'}
					</motion.p>
					<motion.h1
						className={'text-3xl md:text-8xl'}
						variants={customVariants(0.02)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						{'Bootstrapping'}
					</motion.h1>
					<motion.b
						suppressHydrationWarning
						className={'font-number mt-4 text-4xl text-purple-300'}
						variants={customVariants(0.04)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						<Timer />
					</motion.b>
				</div>
				<motion.div
					className={'mb-6 grid w-full grid-cols-1 text-neutral-700'}
					variants={customVariants(0.05)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<p>{'Ok folks. So you brib... incentivized some protocols, now it’s time to vote! Ok folks. So you brib... incentivized some protocols, now it’s time to vote! Ok folks. So you brib... incentivized some protocols, now it’s time to vote! Ok folks.'}</p>
					&nbsp;
					<p>{'So you brib... incentivized some protocols, now it’s time to vote! Ok folks. So you brib... incentivized some protocols, now it’s time to vote! Ok folks. So you brib... incentivized some protocols, now it’s time to vote!'}</p>
				</motion.div>
				<motion.div
					variants={customVariants(0.06)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<Link href={'/incentive'}>
						<Button
							className={'yearn--button w-full rounded-md !text-sm md:w-1/2'}>
							{'Check Incentives'}
						</Button>
					</Link>
				</motion.div>
			</div>
			<motion.div
				className={'relative col-span-12 hidden h-screen md:col-span-6 md:flex'}
				variants={customVariants(0.06)}
				custom={variant}
				initial={'initial'}
				animate={'move'}
				exit={'exit'}>
				<div className={'absolute inset-0 top-20 flex h-full w-full justify-center'}>
					<HeroAsLottie id={'bribe'}/>
				</div>
			</motion.div>
		</section>
	);
}

function Phase2({variant}: {variant: string[]}): ReactElement {
	const {periods} = useBootstrap();
	const {depositStatus} = periods || {};

	if (depositStatus === 'ended') {
		return <Phase2Ended variant={variant} />;
	}
	if (depositStatus === 'started') {
		return <Phase2Started variant={variant} />;
	}
	return <Phase2NotStarted variant={variant} />;
}

export default Phase2;
