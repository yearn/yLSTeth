import React from 'react';
import {customVariants} from 'utils';
import {motion} from 'framer-motion';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	return <>{'coming soon'}</>;
}

function Phase4({variant}: {variant: string[]}): ReactElement {
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
					className={'grid w-full grid-cols-1 text-neutral-700 md:w-1/2'}
					variants={customVariants(0.05)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<p>{'Aaaaaah, we’re launchingggggg.'}</p>
					&nbsp;
					<p>{'The votes have been counted, the basket has been constructed, contracts are deployed and the deposited ETH has been swapped for the constituent LSTs.'}</p>
					&nbsp;
					<p>{'yETH, a basket of risk adjusted epically yielding LSTs is ready for lift off.'}</p>
					&nbsp;
					<p>{'One token, multiple benefits. LFG.'}</p>
				</motion.div>

			</div>
		</section>
	);
}

export default Phase4;
