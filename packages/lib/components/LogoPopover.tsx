'use client';

import {cloneElement, useEffect, useState} from 'react';
import Link from 'next/link';
import {motion} from 'framer-motion';
import {cl} from '@builtbymom/web3/utils';
import {Popover, Transition} from '@headlessui/react';

import {APPS} from './Apps';

import type {AnimationProps} from 'framer-motion';
import type {ReactElement} from 'react';

type TMotionDiv = {
	animate: AnimationProps['animate'];
	name: string;
	children: ReactElement;
};

const transition = {duration: 0.4, ease: 'easeInOut'};
const variants = {
	initial: {y: -80, opacity: 0, transition},
	enter: {y: 0, opacity: 1, transition},
	exit: {y: -80, opacity: 0, transition}
};
function MotionDiv({animate, name, children}: TMotionDiv): ReactElement {
	return (
		<motion.div
			key={name}
			initial={'initial'}
			animate={animate}
			variants={variants}
			className={'absolute cursor-pointer'}>
			{children}
		</motion.div>
	);
}

export function LogoPopover(): ReactElement {
	const [isShowing, set_isShowing] = useState(false);

	const [isShowingMore, set_isShowingMore] = useState(false);

	useEffect(() => {
		if (!isShowing) {
			setTimeout(() => {
				set_isShowingMore(false);
			}, 500);
		}
	}, [isShowing]);

	return (
		<>
			<Popover
				onMouseEnter={(): void => set_isShowing(true)}
				onMouseLeave={(): void => set_isShowing(false)}>
				<div
					onClick={(): void => set_isShowing(false)}
					onMouseEnter={(): void => set_isShowing(false)}
					className={cl(
						'fixed inset-0 bg-black backdrop-blur-sm transition-opacity',
						!isShowing ? 'opacity-0 pointer-events-none' : 'opacity-0 pointer-events-auto'
					)}
				/>
				<Popover.Button className={'z-20 flex size-8'}>
					<Link href={'/'}>
						<span className={'sr-only'}>{'Back to home'}</span>
						<MotionDiv
							name={'logo'}
							animate={'enter'}>
							{APPS.yETH.icon}
						</MotionDiv>
					</Link>
				</Popover.Button>

				<Transition.Root show={isShowing}>
					<Transition.Child
						as={'div'}
						enter={'transition ease-out duration-200'}
						enterFrom={'opacity-0 translate-y-1'}
						enterTo={'opacity-100 translate-y-0'}
						leave={'transition ease-in duration-150'}
						leaveFrom={'opacity-100 translate-y-0'}
						leaveTo={'opacity-0 translate-y-1'}
						className={'relative z-[9999999]'}>
						<Popover.Panel
							className={
								'absolute left-1/2 z-20 w-[345px] -translate-x-1/2 scale-[115%] bg-transparent px-4 pt-10 sm:px-0'
							}>
							<div className={cl('overflow-hidden shadow-xl', 'pt-0')}>
								<div
									className={cl(
										'relative gap-2 border p-4 rounded-md',
										'border-transparent bg-neutral-0'
									)}>
									<div className={'grid grid-cols-2 gap-2'}>
										{[...Object.values(APPS)]
											.slice(0, 4)
											.map(({name, href, icon}): ReactElement => {
												return (
													<Link
														prefetch={false}
														key={name}
														href={href}
														onClick={(): void => set_isShowing(false)}>
														<div
															onClick={(): void => set_isShowing(false)}
															className={cl(
																'flex cursor-pointer flex-col items-center justify-center transition-colors p-4 rounded-sm',
																'bg-[#EBEBEB] hover:bg-[#c3c3c380]'
															)}>
															<div>
																{cloneElement(icon, {
																	className: 'w-8 h-8 min-w-8 max-w-8 min-h-8 max-h-8'
																})}
															</div>
															<div className={'pt-2 text-center'}>
																<b className={cl('text-black')}>{name}</b>
															</div>
														</div>
													</Link>
												);
											})}
									</div>
									<div className={'mt-2 grid grid-cols-4 gap-2'}>
										{[...Object.values(APPS)]
											.slice(4, isShowingMore ? 10 : 7)
											.map(({name, href, icon}): ReactElement => {
												return (
													<Link
														prefetch={false}
														key={name}
														href={href}
														onClick={(): void => set_isShowing(false)}>
														<div
															onClick={(): void => set_isShowing(false)}
															className={cl(
																'flex cursor-pointer flex-col items-center justify-center transition-colors p-4 rounded-sm',
																'bg-[#EBEBEB] hover:bg-[#c3c3c380]'
															)}>
															<div>
																{cloneElement(icon, {
																	className:
																		'w-[22px] h-[22px] min-w-[22px] max-w-[22px] min-h-[22px] max-h-[22px]'
																})}
															</div>
															<div className={'text-center'}>
																<b className={cl('text-xs', 'text-black')}>{name}</b>
															</div>
														</div>
													</Link>
												);
											})}
										{!isShowingMore && (
											<button
												onClick={(): void => set_isShowingMore(true)}
												className={cl(
													'flex cursor-pointer text-xs flex-col items-center justify-center transition-colors p-4 rounded-sm',
													'bg-[#EBEBEB] hover:bg-[#c3c3c380]'
												)}>
												<b>{'More...'}</b>
											</button>
										)}
									</div>
								</div>
							</div>
						</Popover.Panel>
					</Transition.Child>
				</Transition.Root>
			</Popover>
		</>
	);
}
