import React, {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {localhost, mainnet} from 'viem/chains';
import {useConnect, usePublicClient} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {truncateHex} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useAccountModal, useChainModal} from '@rainbow-me/rainbowkit';
import {LogoPopover} from '@yearn-finance/web-lib/components/LogoPopover';
import {ModalMobileMenu} from '@yearn-finance/web-lib/components/ModalMobileMenu';
import {IconWallet} from '@yearn-finance/web-lib/icons/IconWallet';

import type {ReactElement} from 'react';
import type {Chain} from 'viem';

type TMenu = {path: string; label: string | ReactElement; target?: string};
type TNavbar = {nav: TMenu[]; currentPathName: string};
type TNetwork = {value: number; label: string};
export type THeader = {
	nav: TMenu[];
	supportedNetworks?: number[];
	currentPathName: string;
};

function Navbar({nav, currentPathName}: TNavbar): ReactElement {
	return (
		<nav className={'yearn--nav'}>
			{nav.map(
				(option): ReactElement => (
					<Link
						key={option.path}
						target={option.target}
						href={option.path}>
						<p className={`yearn--header-nav-item ${currentPathName === option.path ? 'active' : ''}`}>
							{option?.label || 'Unknown'}
						</p>
					</Link>
				)
			)}
		</nav>
	);
}

const toSafeChainID = (chainID: number, fallback: number): number => {
	if (chainID === 1337 || chainID === 31337) {
		return fallback;
	}
	return chainID;
};

function NetworkButton({
	label,
	isDisabled,
	onClick
}: {
	label: string;
	isDisabled?: boolean;
	onClick?: () => void;
}): ReactElement {
	return (
		<button
			disabled={isDisabled}
			onClick={onClick}
			suppressHydrationWarning
			className={
				'yearn--header-nav-item mr-4 hidden !cursor-default flex-row items-center border-0 p-0 text-sm hover:!text-neutral-500 md:flex'
			}>
			<div
				suppressHydrationWarning
				className={'relative flex flex-row items-center'}>
				{label}
			</div>
		</button>
	);
}

export function NetworkSelector({networks}: {networks: number[]}): ReactElement {
	const {onSwitchChain} = useWeb3();
	const publicClient = usePublicClient();
	const {connectors} = useConnect();
	const safeChainID = toSafeChainID(Number(publicClient?.chain.id), Number(process.env.BASE_CHAINID));

	const supportedNetworks = useMemo((): TNetwork[] => {
		connectors; //Hard trigger re-render when connectors change
		const config = retrieveConfig();
		const noFork = config.chains.filter(({id}): boolean => id !== 1337);
		return noFork
			.filter(({id}): boolean => id !== 1337 && ((networks.length > 0 && networks.includes(id)) || true))
			.map((network: Chain): TNetwork => ({value: network.id, label: network.name}));
	}, [connectors, networks]);

	const currentNetwork = useMemo(
		(): TNetwork | undefined => supportedNetworks.find((network): boolean => network.value === safeChainID),
		[safeChainID, supportedNetworks]
	);

	if (publicClient?.chain.id === 1337) {
		return (
			<NetworkButton
				label={'Localhost'}
				isDisabled
			/>
		);
	}
	if (currentNetwork?.value === supportedNetworks[0]?.value) {
		return (
			<NetworkButton
				label={supportedNetworks[0]?.label || 'Ethereum'}
				isDisabled
			/>
		);
	}
	return (
		<NetworkButton
			label={'Invalid Network'}
			onClick={(): void => onSwitchChain(supportedNetworks[0].value)}
		/>
	);
}

function WalletSelector(): ReactElement {
	const {openAccountModal} = useAccountModal();
	const {openChainModal} = useChainModal();
	const {isActive, address, ens, lensProtocolHandle, openLoginModal} = useWeb3();
	const [walletIdentity, set_walletIdentity] = useState<string | undefined>(undefined);

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
					openAccountModal?.();
				} else if (!isActive && address) {
					openChainModal?.();
				} else {
					openLoginModal();
				}
			}}>
			<p
				suppressHydrationWarning
				className={'yearn--header-nav-item !text-xs md:!text-sm'}>
				{walletIdentity ? (
					walletIdentity
				) : (
					<span>
						<IconWallet className={'yearn--header-nav-item mt-0.5 block size-4 md:hidden'} />
						<span
							className={
								'relative hidden h-8 cursor-pointer items-center justify-center rounded border border-transparent bg-neutral-900 px-2 text-xs font-normal text-neutral-0 transition-all hover:bg-neutral-800 md:flex'
							}>
							{'Connect wallet'}
						</span>
					</span>
				)}
			</p>
		</div>
	);
}

const nav: TMenu[] = [
	{path: '/', label: 'yETH'},
	// {path: '/deposit', label: 'Deposit'},
	{path: '/incentivize', label: 'Incentivize'},
	{path: '/vote', label: 'Vote'},
	{path: '/claim', label: 'Claim'},
	{path: '/apply', label: 'Apply'},
	{path: '/propose', label: 'Proposal'},
	{path: 'https://docs.yearn.fi/getting-started/products/yeth/overview', label: 'Docs'}
];

function AppHeader(): ReactElement {
	const {pathname} = useRouter();
	const [isMenuOpen, set_isMenuOpen] = useState<boolean>(false);

	return (
		<div
			id={'head'}
			className={'fixed inset-x-0 top-0 z-50 w-full bg-neutral-0/95'}>
			<div className={'mx-auto max-w-5xl'}>
				<header className={'yearn--header'}>
					<Navbar
						currentPathName={pathname || ''}
						nav={nav}
					/>
					<div className={'flex w-1/3 md:hidden'}>
						<button onClick={(): void => set_isMenuOpen(!isMenuOpen)}>
							<span className={'sr-only'}>{'Open menu'}</span>
							<svg
								className={'text-neutral-500'}
								width={'20'}
								height={'20'}
								viewBox={'0 0 24 24'}
								fill={'none'}
								xmlns={'http://www.w3.org/2000/svg'}>
								<path
									d={
										'M2 2C1.44772 2 1 2.44772 1 3C1 3.55228 1.44772 4 2 4H22C22.5523 4 23 3.55228 23 3C23 2.44772 22.5523 2 22 2H2Z'
									}
									fill={'currentcolor'}
								/>
								<path
									d={
										'M2 8C1.44772 8 1 8.44772 1 9C1 9.55228 1.44772 10 2 10H14C14.5523 10 15 9.55228 15 9C15 8.44772 14.5523 8 14 8H2Z'
									}
									fill={'currentcolor'}
								/>
								<path
									d={
										'M1 15C1 14.4477 1.44772 14 2 14H22C22.5523 14 23 14.4477 23 15C23 15.5523 22.5523 16 22 16H2C1.44772 16 1 15.5523 1 15Z'
									}
									fill={'currentcolor'}
								/>
								<path
									d={
										'M2 20C1.44772 20 1 20.4477 1 21C1 21.5523 1.44772 22 2 22H14C14.5523 22 15 21.5523 15 21C15 20.4477 14.5523 20 14 20H2Z'
									}
									fill={'currentcolor'}
								/>
							</svg>
						</button>
					</div>
					<div className={'flex w-1/3 justify-center'}>
						<LogoPopover />
					</div>
					<div className={'flex w-1/3 items-center justify-end'}>
						<NetworkSelector networks={[]} />
						<WalletSelector />
					</div>
				</header>
			</div>
			<ModalMobileMenu
				shouldUseWallets={true}
				shouldUseNetworks={true}
				isOpen={isMenuOpen}
				onClose={(): void => set_isMenuOpen(false)}
				supportedNetworks={[mainnet, localhost]}>
				{nav?.map(
					(option): ReactElement => (
						<Link
							key={option.path}
							href={option.path}>
							<div
								className={'mobile-nav-item'}
								onClick={(): void => set_isMenuOpen(false)}>
								<p className={'font-bold'}>{option.label}</p>
							</div>
						</Link>
					)
				)}
			</ModalMobileMenu>
		</div>
	);
}

export default AppHeader;
