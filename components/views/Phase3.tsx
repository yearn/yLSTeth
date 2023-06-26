import React from 'react';
import useBootstrap from 'contexts/useBootstrap';
import {useTimer} from 'hooks/useTimer';
import {customVariants} from 'utils';
import {motion} from 'framer-motion';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {voteBegin, voteEnd, voteStatus} = periods || {};
	const time = useTimer({endTime: voteStatus === 'started' ? Number(voteEnd?.result) : Number(voteBegin?.result)});
	return <>{voteStatus === 'ended' ? 'ended' : voteStatus === 'started' ? time : `in ${time}`}</>;
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
					className={'grid w-full grid-cols-1 text-neutral-700 md:w-2/3 lg:w-1/2'}
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

				<motion.div
					variants={customVariants(0.06)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<div className={'mt-6'}>
						<b>{'Current whitelisted Protocols'}</b>
						<div className={'mt-4 flex flex-row flex-wrap gap-2'}>
							{((process.env.WHITELISTED_PROTOCOLS || []) as string[]).map((protocolName, index): ReactElement => (
								<div
									key={`${protocolName}_${index}`}
									className={'rounded-full bg-purple-300 px-4 py-2 text-xs font-bold text-neutral-0'}>
									{protocolName}
								</div>
							))}
						</div>
					</div>
				</motion.div>
			</div>

		</section>
	);
}

export default Phase3;
