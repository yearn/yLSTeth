import React, {Fragment, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import Logo from 'components/icons/Logo';
import {Listbox, Transition} from '@headlessui/react';
import {useMountEffect} from '@react-hookz/web';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChain} from '@yearn-finance/web-lib/hooks/useChain';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import IconChevronBottom from '@yearn-finance/web-lib/icons/IconChevronBottom';
import IconWallet from '@yearn-finance/web-lib/icons/IconWallet';
import {truncateHex} from '@yearn-finance/web-lib/utils/address';

import type {ReactElement} from 'react';

type TMenu = {path: string, label: string | ReactElement, target?: string};
type TNavbar = {nav: TMenu[], currentPathName: string};
type TNetwork = {value: number, label: string};
export type THeader = {
	nav: TMenu[],
	supportedNetworks?: number[],
	currentPathName: string
}

function	Navbar({nav, currentPathName}: TNavbar): ReactElement {
	const [isClient, set_isClient] = useState<boolean>(false);
	useMountEffect((): void => set_isClient(true));

	if (!isClient) {
		return <Fragment />;
	}
	return (
		<nav className={'yearn--nav'}>
			{nav.map((option): ReactElement => (
				<Link
					key={option.path}
					target={option.target}
					href={option.path}>
					<p className={`yearn--header-nav-item ${currentPathName === option.path ? 'active' : '' }`}>
						{option?.label || 'Unknown'}
					</p>
				</Link>
			))}
		</nav>
	);
}

function	NetworkSelector({supportedChainID}: {supportedChainID: number[]}): ReactElement {
	const chains = useChain();
	const {safeChainID} = useChainID(Number(process.env.DEFAULT_CHAINID));
	const {onSwitchChain} = useWeb3();

	const supportedNetworks = useMemo((): TNetwork[] => {
		const	noTestnet = supportedChainID.filter((chainID: number): boolean => chainID !== 1337);
		return noTestnet.map((chainID: number): TNetwork => (
			{value: chainID, label: chains.get(chainID)?.displayName || `Chain ${chainID}`}
		));
	}, [chains, supportedChainID]);

	const	currentNetwork = useMemo((): TNetwork | undefined => (
		supportedNetworks.find((network): boolean => network.value === safeChainID)
	), [safeChainID, supportedNetworks]);

	if (supportedNetworks.length === 1) {
		if (currentNetwork?.value === supportedNetworks[0]?.value) {
			return (
				<button
					disabled
					suppressHydrationWarning
					className={'yearn--header-nav-item mr-4 hidden !cursor-default flex-row items-center border-0 p-0 text-sm hover:!text-neutral-500 md:flex'}>
					<div suppressHydrationWarning className={'relative flex flex-row items-center'}>
						{supportedNetworks[0]?.label || 'Ethereum'}
					</div>
				</button>
			);
		}
		return (
			<button
				suppressHydrationWarning
				onClick={(): void => onSwitchChain(supportedNetworks[0].value)}
				className={'yearn--header-nav-item mr-4 hidden cursor-pointer flex-row items-center border-0 p-0 text-sm hover:!text-neutral-500 md:flex'}>
				<div suppressHydrationWarning className={'relative flex flex-row items-center'}>
					{'Invalid Network'}
				</div>
			</button>
		);
	}

	return (
		<div className={'relative z-50 mr-4'}>
			<Listbox
				value={safeChainID}
				onChange={(value: any): void => onSwitchChain(value.value)}>
				{({open}): ReactElement => (
					<>
						<Listbox.Button
							suppressHydrationWarning
							className={'yearn--header-nav-item flex flex-row items-center border-0 p-0 text-xs md:flex md:text-sm'}>
							<div suppressHydrationWarning className={'relative flex flex-row items-center truncate whitespace-nowrap text-xs md:text-sm'}>
								{currentNetwork?.label || 'Ethereum'}
							</div>
							<div className={'ml-1 md:ml-2'}>
								<IconChevronBottom
									className={`h-3 w-3 transition-transform md:h-5 md:w-4 ${open ? '-rotate-180' : 'rotate-0'}`} />
							</div>
						</Listbox.Button>
						<Transition
							appear
							show={open}
							as={Fragment}>
							<div>
								<Transition.Child
									as={Fragment}
									enter={'ease-out duration-300'}
									enterFrom={'opacity-0'}
									enterTo={'opacity-100'}
									leave={'ease-in duration-200'}
									leaveFrom={'opacity-100'}
									leaveTo={'opacity-0'}>
									<div className={'fixed inset-0 bg-neutral-900/30'} />
								</Transition.Child>
								<Transition.Child
									as={Fragment}
									enter={'transition duration-100 ease-out'}
									enterFrom={'transform scale-95 opacity-0'}
									enterTo={'transform scale-100 opacity-100'}
									leave={'transition duration-75 ease-out'}
									leaveFrom={'transform scale-100 opacity-100'}
									leaveTo={'transform scale-95 opacity-0'}>
									<Listbox.Options className={'yearn--listbox-menu box-0 left-[-80%] -ml-1 !w-max bg-neutral-0'}>
										{supportedNetworks.map((network): ReactElement => (
											<Listbox.Option key={network.value} value={network}>
												{({active}): ReactElement => (
													<div
														data-active={active}
														className={'yearn--listbox-menu-item text-sm'}>
														{network?.label || 'Ethereum'}
													</div>
												)}
											</Listbox.Option>
										))}
									</Listbox.Options>
								</Transition.Child>
							</div>
						</Transition>
					</>
				)}
			</Listbox>
		</div>
	);
}

function	WalletSelector(): ReactElement {
	const	{options, isActive, address, ens, lensProtocolHandle, openLoginModal, onDesactivate, onSwitchChain} = useWeb3();
	const	[walletIdentity, set_walletIdentity] = useState<string | undefined>(undefined);

	useEffect((): void => {
		if (!isActive && address) {
			set_walletIdentity('Invalid Network');
		} else if (ens) {
			set_walletIdentity(ens);
		} else if (lensProtocolHandle) {
			set_walletIdentity(lensProtocolHandle);
		} else if (address) {
			set_walletIdentity(truncateHex(address, 4));
		} else {
			set_walletIdentity(undefined);
		}
	}, [ens, lensProtocolHandle, address, isActive]);
	return (
		<div
			onClick={(): void => {
				if (isActive) {
					onDesactivate();
				} else if (!isActive && address) {
					onSwitchChain(options?.defaultChainID || 1);
				} else {
					openLoginModal();
				}
			}}>
			<p suppressHydrationWarning className={'yearn--header-nav-item !text-xs md:!text-sm'}>
				{walletIdentity ? walletIdentity : (
					<span>
						<IconWallet
							className={'yearn--header-nav-item mt-0.5 block h-4 w-4 md:hidden'} />
						<span className={'relative hidden h-8 cursor-pointer items-center justify-center rounded border border-transparent bg-neutral-900 px-2 text-xs font-normal text-neutral-0 transition-all hover:bg-neutral-800 md:flex'}>
							{'Connect wallet'}
						</span>
					</span>
				)}
			</p>
		</div>
	);
}

function	AppHeader(): ReactElement {
	const	{pathname} = useRouter();
	const	{options} = useWeb3();

	const supportedChainID = useMemo((): number[] => (
		options?.supportedChainID || [1]
	), [options?.supportedChainID]);

	const nav = useMemo((): TMenu[] => {
		const nav: TMenu[] = [
			{path: '/', label: <Logo className={'h-8 text-neutral-900'} />},
			{path: '/apply', label: 'Apply'},
			{path: '/deposit', label: 'Deposit'}
		];
		return nav;
	}, []);

	return (
		<div id={'head'} className={'fixed inset-x-0 top-0 z-50 w-full border-b border-neutral-100 bg-neutral-0/95'}>
			<div className={'mx-auto max-w-5xl'}>
				<header className={'yearn--header'}>
					<Navbar currentPathName={pathname || ''} nav={nav} />
					<div className={'flex w-1/3 items-center justify-center md:hidden'}>
						<Link href={'/'}>
							<Logo className={'h-6 text-neutral-700'} />
						</Link>
					</div>
					<div className={'flex w-1/3 justify-center'}>
					</div>
					<div className={'flex w-1/3 items-center justify-end'}>
						<NetworkSelector supportedChainID={supportedChainID} />
						<WalletSelector />
					</div>
				</header>
			</div>
		</div>
	);
}

export default AppHeader;
