import React, {Fragment} from 'react';
import Link from 'next/link';
import {Dialog, Transition, TransitionChild} from '@headlessui/react';
import IconArrow from '@libIcons/IconArrow';
import {IconClose} from '@libIcons/IconClose';
import {LogoYearn} from '@libIcons/LogoYearn';

import type {ReactElement} from 'react';
import type {Chain} from 'viem';
import type {TMenu} from './Header';

export function FooterNav({nav, onClose}: {nav: TMenu[]; onClose?: () => void}): ReactElement {
	return (
		<div className={'flex flex-col justify-between gap-y-20 md:flex-row md:items-end'}>
			<div className={'flex flex-col gap-y-4'}>
				{nav.map(link => (
					<Link
						className={
							'hover:text-primary flex items-center justify-between gap-x-4 text-3xl text-white transition-colors md:justify-start'
						}
						key={link.path}
						target={link.target}
						href={link.path}
						onClick={() => {
							onClose?.();
						}}>
						<span>{link.label}</span>
						<IconArrow className={'size-4'} />
					</Link>
				))}
			</div>
		</div>
	);
}

type TModalMobileMenu = {
	isOpen: boolean;
	shouldUseWallets: boolean;
	shouldUseNetworks: boolean;
	onClose: () => void;
	supportedNetworks: Chain[];
	nav: TMenu[];
};

export type TModal = {
	isOpen: boolean;
	onClose: () => void;
} & React.ComponentPropsWithoutRef<'div'>;

export function ModalMobileMenu(props: TModalMobileMenu): ReactElement {
	const {isOpen, onClose} = props;

	return (
		<Transition
			show={isOpen}
			as={Fragment}>
			<Dialog
				as={'div'}
				className={'fixed inset-0 overflow-y-auto md:hidden'}
				style={{zIndex: 88}}
				onClose={onClose}>
				<div className={'relative flex min-h-screen items-end justify-end px-0 pb-0 pt-4 text-center'}>
					<TransitionChild
						as={Fragment}
						enter={'ease-out duration-300'}
						enterFrom={'opacity-0'}
						enterTo={'opacity-100'}
						leave={'ease-in duration-200'}
						leaveFrom={'opacity-100'}
						leaveTo={'opacity-0'}>
						<div className={'yearn--modal-overlay'} />
					</TransitionChild>

					<span
						className={'hidden'}
						aria-hidden={'true'}>
						&#8203;
					</span>
					<TransitionChild
						as={Fragment}
						enter={'ease-out duration-200'}
						enterFrom={'opacity-0 translate-y-full'}
						enterTo={'opacity-100 translate-y-0'}
						leave={'ease-in duration-200'}
						leaveFrom={'opacity-100 translate-y-0'}
						leaveTo={'opacity-0 translate-y-full'}>
						<div className={'yearn--modal fixed bottom-0 mb-0 h-full max-w-full'}>
							<div className={'flex items-center justify-between border-b border-[#292929] p-6'}>
								<button onClick={onClose}>
									<IconClose className={'size-8 text-neutral-900'} />
								</button>
								<Link href={'/'}>
									<LogoYearn
										className={'size-10'}
										front={'text-black'}
										back={'text-white'}
									/>
								</Link>
							</div>
							<div
								className={
									'flex h-[calc(100vh-88px)] w-full flex-col justify-end bg-purple-300 px-6 pb-[104px]'
								}>
								<FooterNav
									nav={props.nav}
									onClose={props.onClose}
								/>
							</div>
						</div>
					</TransitionChild>
				</div>
			</Dialog>
		</Transition>
	);
}
