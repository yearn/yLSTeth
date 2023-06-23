import React from 'react';
import Link from 'next/link';
import HeroAsLottie from 'components/common/HeroAsLottie';
import useBootstrap from 'contexts/useBootstrap';
import {useTimer} from 'hooks/useTimer';
import {customVariants} from 'utils';
import {motion} from 'framer-motion';
import {Button} from '@yearn-finance/web-lib/components/Button';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {whitelistEnd, whitelistStatus} = periods || {};
	const time = useTimer({endTime: Number(whitelistEnd?.result)});
	return <>{whitelistStatus === 'ended' ? 'ended' : whitelistStatus === 'started' ? time : 'coming soon'}</>;
}

function Phase1({variant}: {variant: string[]}): ReactElement {
	const {periods} = useBootstrap();
	const {whitelistStatus} = periods || {};

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
						{'Current Phase'}
					</motion.p>
					<motion.h1
						className={'text-3xl md:text-8xl'}
						variants={customVariants(0.02)}
						custom={variant}
						initial={'initial'}
						animate={'move'}
						exit={'exit'}>
						{'Whitelisting'}
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
					className={'mb-8 text-neutral-700'}
					variants={customVariants(0.05)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<p>{'Want your LST to be included in yETH’s basket of tokens? You’ve come to the right place. Get whitelisted for your LST to take part in yETH Bootstrapping.'}</p>
					&nbsp;
					<ul className={'list-outside list-disc pl-4'}>
						<li className={'font-bold'}>
							{'Pay a non refundable 1 ETH fee (to prevent spam)'}
						</li>
						<li className={'font-bold'}>
							{'Fill in the form.'}
						</li>
						<li className={'font-bold'}>
							{'Wait for the Yearn rug detection unit to check your application.'}
						</li>
					</ul>
					&nbsp;
					<p>{'Applications are checked for obvious scams, but nothing further. Genuine applications will be Whitelisted to take part in the super fun Bootstrapping Incentive Games. Yay.'}</p>
				</motion.div>

				<motion.div
					variants={customVariants(0.06)}
					custom={variant}
					initial={'initial'}
					animate={'move'}
					exit={'exit'}>
					<Link
						href={'/form'}
						target={'_blank'}
						rel={'noopener noreferrer'}>
						<Button
							suppressHydrationWarning
							className={'yearn--button w-full rounded-md !text-sm md:w-1/2'}>
							{whitelistStatus === 'ended' ? 'Check whitelisted projects' : 'Take me to the form'}
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
					<HeroAsLottie />
				</div>
			</motion.div>
		</section>
	);
}

export default Phase1;
