import React, {useMemo} from 'react';
import useBootstrap from 'contexts/useBootstrap';
import {useTimer} from 'hooks/useTimer';
import {customVariants} from 'utils';
import {motion} from 'framer-motion';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {depositEnd, depositBegin} = periods || {};
	const time = useTimer({endTime: (Number(depositEnd?.result) * 1000 || 0)});
	const hasStarted = useMemo((): boolean => (
		(toBigInt(depositBegin?.result || 0) > 0n) //Not started
		&&
		(Number(depositBegin?.result) * 1000 || 0) < Date.now()
	), [depositBegin]);
	const hasEnded = useMemo((): boolean => ((
		(toBigInt(depositEnd?.result || 0) > 0n) //Not started
		&&
		(Number(depositEnd?.result) * 1000 || 0) < Date.now())
	), [depositEnd]);

	return <>{hasEnded ? 'ended' : hasStarted ? time : 'coming soon'}</>;
}

function Phase2({variant}: {variant: string[]}): ReactElement {
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
						{'Deposit & Bribe'}
					</motion.h1>
					<motion.b
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

export default Phase2;
