import React, {useMemo} from 'react';
import useBootstrap from 'contexts/useBootstrap';
import {toBigInt} from 'ethers';
import {useTimer} from 'hooks/useTimer';
import {customVariants} from 'utils';
import {motion} from 'framer-motion';

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
					className={'grid w-3/4 grid-cols-2 gap-[88px]'}
					variants={customVariants(0.05)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<div>
						<b>{'Deposit'}</b>
						<div className={'mt-2 text-neutral-700'}>
							<p>{'Get ready for the Deposit phase, folks! It\'s the time when future yETH users turn their ETH into st-yETH. Remember, it\'s a 1:1 deal, nice and easy.'}</p>
							&nbsp;
							<p>{'But hang on, there\'s a twist! You deposit your ETH in the Bootstrapper contract. The contract keeps a tab on its yETH debt, and your shiny new st-yETH gets locked for 16 weeks. Think of it as a vacation for your tokens.'}</p>
							&nbsp;
							<p>{'When the clock ticks down to zero on the Deposit phase, the Bootstrapper says \'no more\' to deposits and yETH minting.'}</p>
						</div>
					</div>

					<div>
						<b>{'Bribe'}</b>
						<div className={'mt-2 text-neutral-700'}>
							<p>{'You\'ve got your st-yETH and now you\'re ready to influence the yETH\'s launch composition. How do you do it? By enticing voters with a delicious bribe, of course!'}</p>
							&nbsp;
							<p>{'Just pick an LSD protocol you want to support, choose a token from your wallet, decide how much you want to give, and then... boom! You\'ve posted your bribe.'}</p>
							<p>{'And remember, no amount is too small or too big.'}</p>
							&nbsp;
							<p>{'So go on, make some noise and see if you can swing those votes. After all, it\'s all fair in love and blockchain!'}</p>
						</div>
					</div>
				</motion.div>

			</div>
		</section>
	);
}

export default Phase2;
