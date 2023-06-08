import React, {useCallback, useState} from 'react';
import DepositView from 'components/views/DepositView';
import ProtocolAppliedView from 'components/views/whitelistingPeriod/ProtocolAppliedView';
import ProtocolApplyView from 'components/views/whitelistingPeriod/ProtocolApplyView';
import ProtocolWhitelistedView from 'components/views/whitelistingPeriod/ProtocolWhitelistedView';

import type {ReactElement} from 'react';


export enum	Step {
	ADDRESS = 'address',
	APPLY = 'apply',
	APPLIED = 'applied',
	WHITELISTED = 'whitelisted'
}

function	Home(): ReactElement {
	const [currentStep, set_currentStep] = useState<Step>(Step.ADDRESS);

	const handlePostAction = useCallback((args: {hasApplied: boolean, isWhitelisted: boolean}): void => {
		if (args.hasApplied) {
			set_currentStep(Step.APPLIED);
		} else if (args.isWhitelisted) {
			set_currentStep(Step.WHITELISTED);
		} else {
			set_currentStep(Step.APPLY);
		}
		setTimeout((): void => {
			document?.getElementById('whitelistView')?.scrollIntoView({behavior: 'smooth', block: 'start'});
		}, 100);
	}, [set_currentStep]);

	return (
		<div className={'mx-auto grid w-full max-w-4xl pb-96'}>
			<div className={'mb-10 mt-6 flex flex-col justify-center md:mt-20'}>
				<h1 className={'-ml-1 mt-4 text-3xl tracking-tight text-neutral-900 md:mt-6 md:text-5xl'}>
					{'Wanna buy some.'}
				</h1>
				<b className={'mt-4 w-3/4 text-base leading-normal text-neutral-500 md:text-lg md:leading-8'}>
					{'We have the best in town. In fact, we have all of them.'}
				</b>
				<span className={'text-base leading-normal text-neutral-500 md:text-lg md:leading-8'}>
					{'Yeah, all of them. All of the LSDs. We have them. All of them. Allll of them.'}
				</span>
			</div>

			<DepositView />

			<div
				id={'whitelistView'}
				className={`mt-2 pt-8 transition-opacity ${[Step.APPLY, Step.APPLIED, Step.WHITELISTED].includes(currentStep) ? 'opacity-100' : 'pointer-events-none h-0 overflow-hidden opacity-0'}`}>
				{currentStep === Step.APPLY && <ProtocolApplyView onProceed={handlePostAction} />}
				{currentStep === Step.APPLIED && <ProtocolAppliedView />}
				{currentStep === Step.WHITELISTED && <ProtocolWhitelistedView />}
			</div>
		</div>
	);
}

export default function Wrapper(): ReactElement {
	return (<Home />);
}

