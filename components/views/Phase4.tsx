import React from 'react';
import {customVariants} from 'utils';
import {motion} from 'framer-motion';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	return <>{'coming soon'}</>;
}

function Phase4({variant}: {variant: string[]}): ReactElement {
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
						{'Phase IV'}
					</motion.p>
					<motion.h1
						className={'text-3xl md:text-8xl'}
						variants={customVariants(0.02)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						{'Launching!'}
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
					<p>{'Launch phase, folks! The real deal starts now.'}</p>
						&nbsp;
					<p>{'We\'ve voted, we\'ve prepared, and it\'s time to set the yETH machine in motion. Contracts are deployed, 90% of the deposited ETH buys the LSDs we\'ve all chosen.'}</p>
					&nbsp;
					<p>{'And hey, any surplus LSDs? They\'re your yield, st-yETH holders! A little gift from us to you.'}</p>
					&nbsp;
					<p>{'In the end, we deploy a yETH/ETH Curve Pool, request a gauge, and if the stars align, we\'ll get a yETH/ETH Curve yVault.'}</p>
					&nbsp;
					<p>{'Hold tight, we\'re launching!'}</p>
				</motion.div>

			</div>
		</section>
	);
}

export default Phase4;
