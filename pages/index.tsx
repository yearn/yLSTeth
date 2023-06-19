import React, {useCallback, useMemo, useState} from 'react';
import IconArrow from 'components/icons/IconArrow';
import Phase1 from 'components/views/Phase1';
import Phase2 from 'components/views/Phase2';
import Phase3 from 'components/views/Phase3';
import Phase4 from 'components/views/Phase4';
import useBootstrap from 'contexts/useBootstrap';
import {UIStepContextApp} from 'contexts/useUI';
import dayjs from 'dayjs';
import {transition} from 'utils';
import {AnimatePresence, motion} from 'framer-motion';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {ReactElement} from 'react';

const TO_RIGHT = 1;
const NO_DIRECTION = 0;

function ProgressBar({page}: {page: number}): ReactElement {
	const {periods} = useBootstrap();

	const activePeriod = (): 'deposit' | 'vote' | 'whitelist' | '' => {
		const now = dayjs().unix();
		if (toBigInt(periods?.depositBegin?.result) > 0n && toBigInt(periods?.depositEnd?.result) > 0n) {
			if (now > Number(periods?.depositBegin?.result) && now < Number(periods?.depositEnd?.result)) {
				return 'deposit';
			}
		}
		if (toBigInt(periods?.incentiveBegin?.result) > 0n && toBigInt(periods?.incentiveEnd?.result) > 0n) {
			if (now > Number(periods?.incentiveBegin?.result) && now < Number(periods?.incentiveEnd?.result)) {
				return 'vote';
			}
		}
		if (toBigInt(periods?.voteBegin?.result) > 0n && toBigInt(periods?.voteEnd?.result) > 0n) {
			if (now > Number(periods?.voteBegin?.result) && now < Number(periods?.voteEnd?.result)) {
				return 'vote';
			}
		}
		if (toBigInt(periods?.whitelistBegin?.result) > 0n && toBigInt(periods?.whitelistEnd?.result) > 0n) {
			if (now > (Number(periods?.whitelistBegin?.result)) && now < (Number(periods?.whitelistEnd?.result))) {
				return 'whitelist';
			}
		}
		return 'whitelist';
	};

	const period = activePeriod();

	function renderPeriod(): ReactElement {
		const activeClassName = 'font-bold text-purple-300';
		const inactiveClassName = 'text-neutral-400';
		const currentPageClassName = 'font-bold text-neutral-900';
		return (
			<div className={'mx-auto grid w-full max-w-6xl grid-cols-7 gap-4'}>
				<p className={page === 0 && period !== 'whitelist' ? currentPageClassName : period === 'whitelist' ? activeClassName : inactiveClassName}>
					{'Whitelisting'}
				</p>
				<p />
				<p className={page === 1 && period !== 'deposit' ? currentPageClassName : period === 'deposit' ? activeClassName : inactiveClassName}>
					{'Deposit & Bribe'}
				</p>
				<p />
				<p className={page === 2 && period !== 'vote' ? currentPageClassName : period === 'vote' ? activeClassName : inactiveClassName}>
					{'Vote'}
				</p>
				<p className={page === 3 && period !== '' ? currentPageClassName : period === '' ? activeClassName : inactiveClassName}>
					{'Launch'}
				</p>
				<p />
			</div>
		);
	}

	function renderWeek(): ReactElement {
		const activeClassName = 'text-xs text-purple-300';
		const inactiveClassName = 'text-neutral-400';
		const currentPageClassName = 'text-neutral-900';
		return (
			<div className={'mx-auto grid w-full max-w-6xl grid-cols-7 gap-4 text-xs'}>
				<small className={page === 0 && period !== 'whitelist' ? currentPageClassName : period === 'whitelist' ? activeClassName : inactiveClassName}>
					{'Week 1'}
				</small>
				<small className={inactiveClassName}>
					{'Week 2'}
				</small>
				<small className={page === 1 && period !== 'deposit' ? currentPageClassName : period === 'deposit' ? activeClassName : inactiveClassName}>
					{'Week 3'}
				</small>
				<small className={inactiveClassName}>
					{'Week 4'}
				</small>
				<small className={page === 2 && period !== 'vote' ? currentPageClassName : period === 'vote' ? activeClassName : inactiveClassName}>
					{'Week 5'}
				</small>
				<small className={page === 3 && period !== '' ? currentPageClassName : period === '' ? activeClassName : inactiveClassName}>
					{'Week 6'}
				</small>
				<small className={inactiveClassName}>
					{'Week 7'}
				</small>
			</div>
		);
	}

	return (
		<div className={'bottom-0 left-0 hidden w-full py-4 md:fixed md:block md:pt-0'}>
			{renderPeriod()}
			<div className={'my-2 h-0.5 w-full bg-neutral-300'}>
				<div className={'relative mx-auto grid w-full max-w-6xl grid-cols-7 gap-4'}>
					<div className={'absolute mx-auto grid w-full max-w-6xl grid-cols-7 gap-4'}>
						<div className={'h-0.5 w-10 bg-purple-300'} />
						<div className={'h-0.5 w-10 bg-neutral-300'} />
						<div className={'h-0.5 w-10 bg-neutral-300'} />
						<div className={'h-0.5 w-10 bg-neutral-300'} />
						<div className={'h-0.5 w-10 bg-neutral-300'} />
						<div className={'h-0.5 w-10 bg-neutral-300'} />
						<div className={'h-0.5 w-10 bg-neutral-300'} />
					</div>
				</div>
			</div>
			{renderWeek()}
		</div>
	);
}

function YETH(): ReactElement {
	const [page, set_page] = useState(0);
	const [direction, set_direction] = useState(NO_DIRECTION);
	const initialPosition = `-${direction * -1 * 100}vw`;
	const toNextPageAnimation = `${direction * 100}vw`;
	const toPreviousPageAnimation = `${-direction * 100}vw`;
	const shouldDisplayNextArrow = useMemo((): boolean => page !== 1.1 && page < 3, [page]);

	const onPrevious = useCallback((prevPage?: number): void => {
		console.log(prevPage);
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
		<div className={'relative mx-auto w-screen max-w-6xl !px-0'}>
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
			<div className={'relative flex flex-row'} style={{height: 'calc(100vh - 80px)'}}>
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
			<ProgressBar page={page} />
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
