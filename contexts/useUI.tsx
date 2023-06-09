import React, {createContext, useContext, useMemo, useState} from 'react';
import {useMountEffect, useUpdateEffect} from '@react-hookz/web';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';

import type {Dispatch, SetStateAction} from 'react';

export enum	Step {
	ADDRESS = 'address',
	APPLY = 'apply',
	APPLIED = 'applied',
	WHITELISTED = 'whitelisted',
	CLOSED = 'closed'
}

export type TSelected = {
	currentStep: Step,
	set_currentStep: Dispatch<SetStateAction<Step>>,
}

const	defaultProps: TSelected = {
	currentStep: Step.ADDRESS,
	set_currentStep: (): void => undefined
};


function scrollToTargetAdjusted(element: HTMLElement): void {
	const headerOffset = 81 - 16;
	if (!element) {
		return;
	}
	const elementPosition = element.getBoundingClientRect().top;
	const offsetPosition = elementPosition + window.scrollY - headerOffset;
	window.scrollTo({
		top: Math.round(offsetPosition),
		behavior: 'smooth'
	});
}

const	UIStepContext = createContext<TSelected>(defaultProps);
export const UIStepContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const	{walletType} = useWeb3();
	const	[currentStep, set_currentStep] = useState<Step>(Step.ADDRESS);

	/**********************************************************************************************
	** This effect is used to handle some UI transitions and sections jumps. Once the current step
	** changes, we need to scroll to the correct section.
	** This effect is triggered only on mount to set the initial scroll position.
	**********************************************************************************************/
	useMountEffect((): void => {
		setTimeout((): void => {
			if (currentStep === Step.ADDRESS) {
				document?.getElementById('wallet')?.scrollIntoView({behavior: 'smooth', block: 'start'});
			} else if ([Step.APPLY, Step.APPLIED, Step.WHITELISTED, Step.CLOSED].includes(currentStep)) {
				document?.getElementById('whitelistView')?.scrollIntoView({behavior: 'smooth', block: 'start'});
			}
		}, 0);
	});

	/**********************************************************************************************
	** This effect is used to handle some UI transitions and sections jumps. Once the current step
	** changes, we need to scroll to the correct section.
	** This effect is ignored on mount but will be triggered on every update to set the correct
	** scroll position.
	**********************************************************************************************/
	useUpdateEffect((): void => {
		setTimeout((): void => {
			let currentStepContainer;
			const scalooor = document?.getElementById('scalooor');
			const headerHeight = 96;

			if (currentStep === Step.ADDRESS) {
				currentStepContainer = document?.getElementById('wallet');
			} else if ([Step.APPLY, Step.APPLIED, Step.WHITELISTED, Step.CLOSED].includes(currentStep)) {
				currentStepContainer = document?.getElementById('whitelistView');
			}
			const	currentElementHeight = currentStepContainer?.offsetHeight;
			if (scalooor?.style) {
				scalooor.style.height = `calc(100vh - ${currentElementHeight}px - ${headerHeight}px + 36px)`;
			}
			if (currentStepContainer) {
				scrollToTargetAdjusted(currentStepContainer);
			}
		}, 0);
	}, [currentStep, walletType]);

	const	contextValue = useMemo((): TSelected => ({
		currentStep,
		set_currentStep
	}), [currentStep]);

	return (
		<UIStepContext.Provider value={contextValue}>
			<div className={'mx-auto w-full'}>
				{children}
				<div id={'scalooor'} />
			</div>
		</UIStepContext.Provider>
	);
};

export const useUIStep = (): TSelected => useContext(UIStepContext);
