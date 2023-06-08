import React, {useCallback, useState} from 'react';
import Image from 'next/image';
import AddressInput from 'components/common/AddressInput';
import useBootstrap from 'contexts/useBootstrap';
import {useTimer} from 'hooks/useTimer';
import {customVariants} from 'utils';
import {motion} from 'framer-motion';
import {isZeroAddress} from '@yearn-finance/web-lib/utils/address';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {ReactElement} from 'react';
import type {TAddress} from '@yearn-finance/web-lib/types';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {whitelistEnd} = periods || {};
	const time = useTimer({endTime: (Number(whitelistEnd?.result) * 1000 || 0)});
	return <>{time}</>;
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
		<section className={'absolute inset-0 grid grid-cols-2 pt-10 md:pt-12'}>
			<div>
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
					<p>{'To be part of the action, LSD protocols need to pony up a 1 ETH fee - it\'s non-refundable, but don\'t worry, it turns into yield for st-yETH users.'}</p>
					&nbsp;
					<p>{'After that, protocols fill out a basic form. Think of it as a friendly chat, but on paper. Our Yearn contributors play detective, sifting out the sneaky fraudsters.'}</p>
					&nbsp;
					<p>{'Get through this, and you\'re on the Whitelist for the Bootstrapping phase. Now, it\'s time to step up and show the world what your protocol can do. Let the games begin!'}</p>
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
				className={'flex items-center justify-center pl-10'}
				variants={customVariants(0.06)}
				custom={variant}
				initial={'initial'}
				animate={'move'}
				exit={'exit'}>
				<Image
					loading={'eager'}
					alt={''}
					src={'/hero_yeth.png'}
					width={490}
					height={490} />
			</motion.div>
		</section>
	);
}

export default Phase1;
