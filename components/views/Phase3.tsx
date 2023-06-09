import React, {useMemo} from 'react';
import useBootstrap from 'contexts/useBootstrap';
import {useTimer} from 'hooks/useTimer';
import {customVariants} from 'utils';
import {motion} from 'framer-motion';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {voteEnd, voteBegin} = periods || {};
	const time = useTimer({endTime: (Number(voteEnd?.result) * 1000 || 0)});
	const hasStarted = useMemo((): boolean => (
		(toBigInt(voteBegin?.result || 0) > 0n) //Not started
		&&
		(Number(voteBegin?.result) * 1000 || 0) < Date.now()
	), [voteBegin]);
	const hasEnded = useMemo((): boolean => ((
		(toBigInt(voteEnd?.result || 0) > 0n) //Not started
		&&
		(Number(voteEnd?.result) * 1000 || 0) < Date.now())
	), [voteEnd]);

	return <>{hasEnded ? 'ended' : hasStarted ? time : 'coming soon'}</>;
}

function Phase3({variant}: {variant: string[]}): ReactElement {
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
					className={'grid w-full grid-cols-1 text-neutral-700 md:w-1/2'}
					variants={customVariants(0.05)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<p>{'Depositors who locked their ETH for st-yETH can check out the proposals from different LST protocols to be included in yETH.'}</p>
					&nbsp;
					<p>{'No need for game theory here, vote for whoever you feel should be in the basket and you’ll receive your share of incentives from the LSTs that are successful, whether your voted for them or not.'}</p>
					&nbsp;
					<p>{'Your vote matters anon, as it will help decide the launch composition of yETH. Your voting power is equal to the amount of st-yETH you’re holding and you can spread your votes over multiple protocols or go all in on one. Your vote, your choice.'}</p>
					&nbsp;
					<p>{'If only regular democracy came with incentives… sigh.'}</p>
				</motion.div>

			</div>
		</section>
	);
}

export default Phase3;
