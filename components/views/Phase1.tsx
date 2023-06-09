import React, {useCallback, useMemo, useState} from 'react';
import Image from 'next/image';
import AddressInput from 'components/common/AddressInput';
import useBootstrap from 'contexts/useBootstrap';
import {useTimer} from 'hooks/useTimer';
import {customVariants} from 'utils';
import {motion} from 'framer-motion';
import {isZeroAddress} from '@yearn-finance/web-lib/utils/address';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {ReactElement} from 'react';
import type {TAddress} from '@yearn-finance/web-lib/types';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {whitelistEnd, whitelistBegin} = periods || {};
	const time = useTimer({endTime: (Number(whitelistEnd?.result) * 1000 || 0)});
	const hasStarted = useMemo((): boolean => (
		(toBigInt(whitelistBegin?.result || 0) > 0n) //Not started
		&&
		(Number(whitelistBegin?.result) * 1000 || 0) < Date.now()
	), [whitelistBegin]);
	const hasEnded = useMemo((): boolean => ((
		(toBigInt(whitelistEnd?.result || 0) > 0n) //Not started
		&&
		(Number(whitelistEnd?.result) * 1000 || 0) < Date.now())
	), [whitelistEnd]);

	return <>{hasEnded ? 'ended' : hasStarted ? time : 'coming soon'}</>;
}

function Phase1({variant}: {variant: string[]}): ReactElement {
	const {selectedToken, set_selectedToken, updateApplicationStatus} = useBootstrap();
	const [tokenReceiver, set_tokenReceiver] = useState('');
	const [hasBeenConfirmed, set_hasBeenConfirmed] = useState(false);

	const onConfirm = useCallback(async (newReceiver: TAddress): Promise<void> => {
		performBatchedUpdates((): void => {
			set_selectedToken(newReceiver);
			set_tokenReceiver(newReceiver);
			set_hasBeenConfirmed(true);
		});
		const {data, isSuccess} = await updateApplicationStatus();
		const [applied, whitelisted] = data || [];
		const hasValidInput = isSuccess && !isZeroAddress(newReceiver);
		const hasApplied = hasValidInput ? applied?.status === 'success' && applied?.result : false;
		const isWhitelisted = hasValidInput ? whitelisted?.status === 'success' && whitelisted?.result : false;
		console.log({hasApplied, isWhitelisted});
		// onProceed({hasApplied, isWhitelisted});
	}, [set_selectedToken, updateApplicationStatus]);

	return (
		<section className={'absolute inset-x-0 grid grid-cols-12 gap-10 px-4 pt-10 md:gap-20 md:pt-12'}>
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
					<p className={'mb-1 text-neutral-600'}>
						{'My LSD Protocol Address'}
					</p>
					<AddressInput
						value={tokenReceiver as TAddress}
						onChangeValue={set_tokenReceiver}
						shouldBeDisabled={hasBeenConfirmed && tokenReceiver === selectedToken}
						onConfirm={onConfirm} />
					<p className={'mt-1 text-xs text-neutral-600'}>
						{'A 1 ETH fee is required to apply.'}
					</p>
				</motion.div>
			</div>

			<motion.div
				className={'col-span-12 hidden md:col-span-6 md:flex'}
				variants={customVariants(0.06)}
				custom={variant}
				initial={'initial'}
				animate={'move'}
				exit={'exit'}>
				<div className={'flex h-full items-center justify-center'}>
					<Image
						loading={'eager'}
						alt={''}
						src={'/hero_yeth.png'}
						width={420}
						height={420} />
				</div>
			</motion.div>
		</section>
	);
}

export default Phase1;
