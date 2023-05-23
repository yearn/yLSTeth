import React, {useCallback} from 'react';
import ProtocolAppliedView from 'components/views/whitelistingPeriod/ProtocolAppliedView';
import ProtocolApplyView from 'components/views/whitelistingPeriod/ProtocolApplyView';
import ProtocolTokenView from 'components/views/whitelistingPeriod/ProtocolTokenView';
import ProtocolWhitelistClosedView from 'components/views/whitelistingPeriod/ProtocolWhitelistClosedView';
import ProtocolWhitelistedView from 'components/views/whitelistingPeriod/ProtocolWhitelistedView';
import useBootstrap from 'contexts/useBootstrap';
import {Step, UIStepContextApp, useUIStep} from 'contexts/useUI';

import type {ReactElement} from 'react';

function	Home(): ReactElement {
	const {periods} = useBootstrap();
	const {whitelistEnd} = periods || {};
	const hasEnded = whitelistEnd?.status === 'success' && (Number(whitelistEnd.result) * 1000) < Date.now();
	const {currentStep, set_currentStep} = useUIStep();

	const handlePostAction = useCallback((args: {hasApplied: boolean, isWhitelisted: boolean}): void => {
		if (args.isWhitelisted) {
			set_currentStep(Step.WHITELISTED);
		} else if (args.hasApplied) {
			set_currentStep(Step.APPLIED);
		} else if (hasEnded) {
			set_currentStep(Step.CLOSED);
		} else {
			set_currentStep(Step.APPLY);
		}
	}, [set_currentStep, hasEnded]);

	return (
		<div className={'mx-auto grid w-full max-w-4xl pb-96'}>
			<div className={'mb-10 mt-6 flex flex-col justify-center md:mt-20'}>
				<h1 className={'-ml-1 mt-4 text-3xl tracking-tight text-neutral-900 md:mt-6 md:text-5xl'}>
					{'Boot-strap-in for yETH.'}
				</h1>
				<b className={'mt-4 w-3/4 text-base leading-normal text-neutral-500 md:text-lg md:leading-8'}>
					{'Get whitelisted to take part in the yETH bootstrapping period and get your LSD included in yETH.'}
				</b>
			</div>

			<ProtocolTokenView onProceed={handlePostAction} />

			<div
				id={'whitelistView'}
				className={`mt-2 pt-8 transition-opacity ${[Step.APPLY, Step.APPLIED, Step.WHITELISTED, Step.CLOSED].includes(currentStep) ? 'opacity-100' : 'pointer-events-none h-0 overflow-hidden opacity-0'}`}>
				{currentStep === Step.APPLY && <ProtocolApplyView onProceed={handlePostAction} />}
				{currentStep === Step.APPLIED && <ProtocolAppliedView />}
				{currentStep === Step.WHITELISTED && <ProtocolWhitelistedView />}
				{currentStep === Step.CLOSED && <ProtocolWhitelistClosedView />}
			</div>
		</div>
	);
}

export default function Wrapper(): ReactElement {
	return (
		<UIStepContextApp>
			<Home />
		</UIStepContextApp>
	);
}
