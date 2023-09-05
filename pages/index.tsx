import React, {useCallback, useMemo, useState} from 'react';
import IconArrow from 'components/icons/IconArrow';
import Phase1 from 'components/views/Phase1';
import Phase2 from 'components/views/Phase2';
import Phase3 from 'components/views/Phase3';
import Phase4 from 'components/views/Phase4';
import {UIStepContextApp} from 'contexts/useUI';
import {transition} from 'utils';
import {AnimatePresence, motion} from 'framer-motion';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {TPeriods} from 'hooks/useBootstrapPeriods';
import type {ReactElement} from 'react';

const TO_RIGHT = 1;
const NO_DIRECTION = 0;
const currentPhaseToStep = (): number => {
	const nowBigInt = toBigInt(Math.round(new Date().getTime() / 1000));
	const whitelistEnd = toBigInt((process.env.PERIODS as unknown as TPeriods).WHITELIST_END);
	const incentiveBegin = toBigInt((process.env.PERIODS as unknown as TPeriods).INCENTIVE_BEGIN);
	const voteEnd = toBigInt((process.env.PERIODS as unknown as TPeriods).VOTE_END);

	if (nowBigInt < whitelistEnd) {
		return 0; // whitelist
	}
	if (nowBigInt < incentiveBegin) {
		return 1; // bootstrap
	}
	if (nowBigInt < voteEnd) {
		return 2; // vote
	}
	if (nowBigInt > voteEnd) {
		return 3; // launch
	}
	return 0;
};

function YETH(): ReactElement {
	const [page, set_page] = useState(currentPhaseToStep());
	const [direction, set_direction] = useState(NO_DIRECTION);
	const initialPosition = `-${direction * -1 * 100}vw`;
	const toNextPageAnimation = `${direction * 100}vw`;
	const toPreviousPageAnimation = `${-direction * 100}vw`;
	const shouldDisplayNextArrow = useMemo((): boolean => page !== 1.1 && page < 3, [page]);

	const onPrevious = useCallback((prevPage?: number): void => {
		if (page === 0) {
			return;
		}
		if (prevPage !== undefined) {
			return performBatchedUpdates((): void => {
				set_page(prevPage);
				set_direction(1);
			});
		}
		if (page === 1.1 || page === 1.2) {
			return performBatchedUpdates((): void => {
				set_page(1);
				set_direction(1);
			});
		}
		performBatchedUpdates((): void => {
			set_page((s): number => s - 1);
			set_direction(1);
		});
	}, [page]);

	const onNext = useCallback((nextPage?: number): void => {
		if (page === 3) {
			return;
		}
		if (nextPage !== undefined) {
			return performBatchedUpdates((): void => {
				set_page(nextPage);
				set_direction(-1);
			});
		}
		performBatchedUpdates((): void => {
			set_page((s): number => s + 1);
			set_direction(-1);
		});
	}, [page]);


	function renderElement(): ReactElement {
		switch (page) {
			case 0:
				return <Phase1
					key={'phase-1'}
					variant={[
						direction === TO_RIGHT ? '-100vw' : direction === NO_DIRECTION ? '0vw' : '100vw', // initial
						direction === TO_RIGHT ? '100vw' : '-100vw' // onExit
					]} />;
			case 1:
				return <Phase2
					key={'phase-2'}
					variant={[
						direction === TO_RIGHT ? '-100vw' : direction === NO_DIRECTION ? '0vw' : '100vw', // initial
						direction === TO_RIGHT ? '100vw' : '-100vw' // onExit
					]} />;
			case 2:
				return <Phase3
					key={'phase-3'}
					variant={[
						direction === TO_RIGHT ? '-100vw' : direction === NO_DIRECTION ? '0vw' : '100vw', // initial
						direction === TO_RIGHT ? '100vw' : '-100vw' // onExit
					]} />;

			case 3:
				return <Phase4
					key={'phase-4'}
					variant={[
						direction === TO_RIGHT ? '-100vw' : direction === NO_DIRECTION ? '0vw' : '100vw', // initial
						direction === TO_RIGHT ? '100vw' : '-100vw' // onExit
					]} />;

			default:
				return <Phase1
					key={'phase-1'}
					variant={[initialPosition, direction === -1 ? toNextPageAnimation : toPreviousPageAnimation]} />;
		}
	}

	return (
		<div className={'relative mx-auto w-screen max-w-5xl !px-0'}>
			<motion.div
				transition={transition}
				animate={{x: page > 0 ? '0vw' : '-100vw'}}
				className={'absolute left-0 top-0 z-10 px-4'}>
				<button onClick={(): void => onPrevious()}>
					<IconArrow className={'h-6 w-6 rotate-180 cursor-pointer text-purple-300'} />
				</button>
			</motion.div>
			<motion.div
				transition={transition}
				animate={{x: shouldDisplayNextArrow ? '0vw' : '100vw'}}
				className={'absolute right-0 top-0 z-10 block px-4 md:hidden'}>
				<button onClick={(): void => onNext()}>
					<IconArrow className={'h-6 w-6 cursor-pointer text-purple-300'} />
				</button>
			</motion.div>
			<div
				className={'relative flex flex-row'}
				style={{height: 'calc(100vh - 80px)'}}>
				<AnimatePresence
					mode={'sync'}
					custom={[
						direction === TO_RIGHT ? '-100vw' : direction === NO_DIRECTION ? '0vw' : '100vw', // initial
						direction === TO_RIGHT ? '100vw' : '-100vw' // onExit
					]}>
					{renderElement()}
				</AnimatePresence>
			</div>
			<motion.div
				transition={transition}
				animate={{x: shouldDisplayNextArrow ? '0vw' : '100vw'}}
				className={'fixed inset-y-0 right-4 hidden h-full items-center md:flex'}>
				<button
					onClick={(): void => onNext()}
					className={'flex h-16 w-16 items-center justify-center rounded-full bg-[#DED0FE]/50 backdrop-blur-sm transition-colors hover:bg-[#DED0FE]'}>
					<IconArrow className={'w-6 text-purple-300'} />
				</button>
			</motion.div>
		</div>
	);
}

export default function Wrapper(): ReactElement {
	return (
		<div className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col overflow-x-visible bg-neutral-0 pt-20 md:overflow-y-hidden'}>
			<UIStepContextApp>
				<YETH />
			</UIStepContextApp>
		</div>
	);
}
