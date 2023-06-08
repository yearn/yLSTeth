import React, {useMemo} from 'react';
import useBootstrap from 'contexts/useBootstrap';
import {toBigInt} from 'ethers';
import {useTimer} from 'hooks/useTimer';
import {customVariants} from 'utils';
import {motion} from 'framer-motion';

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
		<section className={'absolute inset-0 grid grid-cols-1 pt-10 md:pt-12'}>
			<div>
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
					className={'grid w-1/2 grid-cols-1 text-neutral-700'}
					variants={customVariants(0.05)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<p>{'You\'ve got your st-yETH, you\'ve checked out the LSD protocols, you\'ve been wooed by the bribes - now, it\'s decision time. Who will get your coveted vote?'}</p>
					&nbsp;
					<p>{'Each vote you cast will help decide the launch composition of yETH. Remember, your voting power equals the amount of st-yETH you hold. You can spread your votes over multiple LSD protocols or put all your votes behind your favorite one - it\'s your choice!'}</p>
					&nbsp;
					<p>{'And don\'t worry, we\'ve made voting easy. Just select your LSD, input your vote amount, and hit confirm. Easy peasy, lemon squeezy!'}</p>
					&nbsp;
					<p>{'So what are you waiting for? It\'s time to exercise your crypto-democratic rights. Let\'s make this vote count!'}</p>
				</motion.div>

			</div>
		</section>
	);
}

export default Phase3;
