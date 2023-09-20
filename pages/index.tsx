import React, {Fragment, useCallback, useMemo, useState} from 'react';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import IconChevronBoth from 'components/icons/IconChevronBoth';
import ViewDeposit from 'components/views/Deposit';
import ViewStake from 'components/views/Stake';
import ViewSwap from 'components/views/Swap';
import LSTInPool from 'components/views/ViewLSTInPool';
import ViewWithdraw from 'components/views/Withdraw';
import useLST from 'contexts/useLST';
import {UIStepContextApp} from 'contexts/useUI';
import useWallet from 'contexts/useWallet';
import useAPR from 'hooks/useAPR';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {ST_YETH_ABI} from 'utils/abi/styETH.abi';
import {STYETH_TOKEN, YETH_TOKEN} from 'utils/tokens';
import {useContractRead} from 'wagmi';
import {useAnimate} from 'framer-motion';
import {Listbox, Transition} from '@headlessui/react';
import {useMountEffect, useUnmountEffect} from '@react-hookz/web';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {AnimationScope} from 'framer-motion';
import type {Router} from 'next/router';
import type {ReactElement} from 'react';

const tabs = [
	{value: 0, label: 'Deposit', slug: 'deposit'},
	{value: 1, label: 'Withdraw', slug: 'withdraw'},
	{value: 2, label: 'Stake/Unstake', slug: 'stake-unstake'},
	{value: 3, label: 'Swap', slug: 'swap'}
];

const basicTransition = 'duration-200 ease-in-out';
const basicColorTransition = cl(basicTransition, 'text-neutral-900 transition-colors group-hover:text-neutral-0');
const basicLighterColorTransition = cl(basicTransition, 'text-neutral-600 transition-colors group-hover:text-neutral-0');

function Composition(): ReactElement {
	const {lst} = useLST();

	return (
		<div className={'flex flex-col space-y-4'}>
			{lst.map((token, index): ReactElement => {
				return (
					<div key={index} className={'flex flex-row justify-between space-x-4'}>
						<div className={'flex flex-row'}>
							<div className={'h-6 w-6 min-w-[24px]'}>
								<ImageWithFallback
									alt={token.name}
									unoptimized
									src={token.logoURI}
									width={24}
									height={24} />
							</div>
							<p className={cl(basicColorTransition, 'text-sm md:text-base px-2')}>{token.symbol}</p>
						</div>
						<b suppressHydrationWarning className={cl(basicColorTransition, 'text-sm md:text-base')}>
							{`${formatAmount((token?.weightRatio || 0) * 100, 2, 2)}%`}
						</b>
					</div>
				);
			})}
		</div>
	);
}

function useTimer(): number {
	const [time, set_time] = useState<number>(0);

	useMountEffect((): VoidFunction => {
		const interval = setInterval((): void => {
			set_time((prev): number => prev + 1);
		}, 1000);
		return (): void => clearInterval(interval);
	});

	return time;
}

function RenderYETHValue({lockedTokens}: {lockedTokens: bigint}): ReactElement {
	const {balances} = useWallet();
	const timer = useTimer();

	const totalStYEthAmount = useMemo((): bigint => {
		return toBigInt(lockedTokens) + toBigInt(balances?.[STYETH_TOKEN.address]?.raw || 0);
	}, [balances, lockedTokens]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Retrieve the locked st-yETH in the bootstrap contract for the current user
	**********************************************************************************************/
	const {data: yETHValue} = useContractRead({
		abi: ST_YETH_ABI,
		address: toAddress(process.env.STYETH_ADDRESS),
		functionName: 'convertToAssets',
		args: [totalStYEthAmount],
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		watch: true,
		enabled: timer > 0
	});

	return (
		<p
			suppressHydrationWarning
			className={cl('text-sm block md:text-base -mt-2 text-neutral-500 transition-colors group-hover:text-neutral-0')}>
			{`~ ${formatAmount(Number(toNormalizedBN(toBigInt(yETHValue)).normalized), 6, 6)} yETH`}
		</p>
	);

}

function YETHHeading({scope}: {scope: AnimationScope}): ReactElement {
	const {address} = useWeb3();
	const {balances} = useWallet();
	const {TVL} = useLST();
	const APR = useAPR();

	/* 🔵 - Yearn Finance **************************************************************************
	** Retrieve the locked st-yETH in the bootstrap contract for the current user
	**********************************************************************************************/
	const {data: lockedTokens} = useContractRead({
		abi: BOOTSTRAP_ABI,
		address: toAddress(process.env.BOOTSTRAP_ADDRESS),
		functionName: 'deposits',
		args: [toAddress(address)],
		chainId: Number(process.env.DEFAULT_CHAIN_ID)
	});

	const relativeTimeToUnlock = useMemo((): string => {
		const unlockTime = 1699012800;
		const timeToUnlock = unlockTime - Math.floor(Date.now() / 1000);
		const toDays = timeToUnlock / 86400;
		const toHours = timeToUnlock / 3600;
		const toMinutes = timeToUnlock / 60;
		const toSeconds = timeToUnlock;
		if (toDays > 1) {
			return `${Math.floor(toDays)} days from now.`;
		}
		if (toHours > 1) {
			return `${Math.floor(toHours)} hours from now.`;
		}
		if (toMinutes > 1) {
			return `${Math.floor(toMinutes)} minutes from now.`;
		}
		if (toSeconds > 1) {
			return `${Math.floor(toSeconds)} seconds from now.`;
		}
		return 'Soon';
	}, []);

	return (
		<div
			ref={scope}
			id={'yeth-main-heading'}
			className={cl('group', basicTransition)}>
			<div
				id={'title'}
				className={'relative col-span-18 flex items-end py-6 pr-0 md:py-8 md:pr-72'}>
				<div
					id={'yeth-title-explore'}
					className={cl('absolute -left-full top-10 text-neutral-0 opacity-0 transition-all duration-200 ease-in-out group-hover:left-0 group-hover:opacity-100 hidden md:block', basicTransition)}>
					{'Explore >'}
				</div>
				<h1 className={cl('text-5xl md:text-8xl', basicColorTransition)}>
					{'yETH'}
				</h1>
			</div>

			<div
				id={'composition'}
				className={'col-span-12 flex w-full flex-row justify-between py-4 pl-0 transition-colors md:py-8 md:pl-72'}>
				<div className={'flex flex-col space-y-2'}>
					<div>
						<small className={cl('text-xs', basicLighterColorTransition)}>
							{'TVL, USD'}
						</small>
						<b
							suppressHydrationWarning
							className={cl('block text-lg md:text-2xl leading-6 md:leading-10', basicColorTransition)}>
							{formatAmount(TVL, 0, 0)}
						</b>
					</div>

					<div>
						<small className={cl('text-xs text-purple-300 group-hover:text-neutral-0', basicTransition)}>
							{'APR'}
						</small>

						<span className={'tooltip'}>
							<b suppressHydrationWarning className={cl('block text-lg md:text-2xl leading-6 md:leading-10 text-purple-300 group-hover:text-neutral-0', basicTransition)}>
								{`~${formatAmount(APR, 2, 2)}%`}
							</b>
							<span className={'tooltipLight !-inset-x-24 top-full mt-2 !w-auto'}>
								<div
									suppressHydrationWarning
									className={'w-fit rounded-md border border-neutral-700 bg-neutral-900 p-1 px-2 text-center text-xs font-medium text-neutral-0'}>
									{'APY is calculated based on last week\'s yETH yield generated by the protocol, streamed to st-yETH holders this week'}
								</div>
							</span>
						</span>
					</div>

					<div>
						<small className={cl('text-xs', basicLighterColorTransition)}>
							{'Your yETH'}
						</small>
						<b
							suppressHydrationWarning
							className={cl('block text-lg md:text-2xl leading-6 md:leading-10', basicColorTransition)}>
							{formatAmount(balances?.[YETH_TOKEN.address]?.normalized || 0, 6, 6)}
						</b>
					</div>

					<div>
						<small className={cl('text-xs', basicLighterColorTransition)}>
							{'Your st-yETH'}
						</small>
						<span className={'block whitespace-nowrap'}>
							<b
								suppressHydrationWarning
								className={cl('text-lg md:text-2xl leading-6 md:leading-10', basicColorTransition)}>
								{formatAmount(Number(balances?.[STYETH_TOKEN.address]?.normalized || 0), 6, 6)}
							</b>
							{(lockedTokens && lockedTokens >= 0n) ? (
								<span className={'tooltip'}>
									<p
										suppressHydrationWarning
										className={cl('text-sm block md:text-base -mt-2 text-neutral-500 transition-colors group-hover:text-neutral-0')}>
										{`+ ${formatAmount(toNormalizedBN(lockedTokens || 0n).normalized, 6, 6)} locked`}
									</p>
									<span className={'tooltipLight !-inset-x-24 top-full mt-2 !w-auto'}>
										<div
											suppressHydrationWarning
											className={'w-fit rounded-md border border-neutral-700 bg-neutral-900 p-1 px-2 text-center text-xs font-medium text-neutral-0'}>
											{`Your st-yETH from the yETH bootstrap will be unlocked ${relativeTimeToUnlock}`}
										</div>
									</span>
								</span>
							) : (
								<p
									className={cl('text-sm block md:text-base -mt-2 text-neutral-500 transition-colors group-hover:text-neutral-0')}>
										&nbsp;
								</p>
							)}
							<RenderYETHValue lockedTokens={toBigInt(lockedTokens)} />
						</span>
					</div>
				</div>

				<div className={'flex flex-col space-y-2'}>
					<div>
						<small className={cl('text-xs', basicLighterColorTransition)}>
							{'Composition'}
						</small>
					</div>
					<Composition />
				</div>
			</div>
		</div>
	);
}

function YETH({router}: {router: Router}): ReactElement {
	const [tabsCope, animateTabs] = useAnimate();
	const [headingScope, headingAnimate] = useAnimate();
	const [lpPoolScope, lpPoolAnimate] = useAnimate();
	const [currentTab, set_currentTab] = useState<typeof tabs[0]>(tabs[0]);
	const [shouldRenderPool, set_shouldRenderPool] = useState(false);

	useMountEffect((): void => {
		const action = router.asPath.split('?')[1] ?? {};
		if (action?.split) {
			const actionType = action.split('=')[1] ?? '';
			if (actionType && typeof actionType === 'string') {
				const tabLabel = actionType.toLowerCase();
				const tabValue = tabs.findIndex((tab): boolean => tab.slug === tabLabel);
				if (tabValue !== -1) {
					set_currentTab(tabs[tabValue]);
				}
			}
		}
	});

	useUnmountEffect((): void => {
		document.body.classList.remove('lpPoolTheme');
	});

	const triggerPoolView = useCallback((direction: boolean): void => {
		set_shouldRenderPool((prev): boolean => {
			if (direction === prev) {
				return prev;
			}
			if (direction) {
				animateTabs(tabsCope.current, {opacity: 0, y: '100vh'}, {duration: 0.8, ease: 'easeInOut'});
				headingAnimate('#title', {y: -144}, {duration: 0.6, ease: 'easeInOut'});
				headingAnimate('#composition', {opacity: 0, y: -144}, {duration: 0.6, ease: 'easeInOut'});
				lpPoolAnimate(lpPoolScope.current, {opacity: 1, height: 'auto', pointerEvents: 'auto'}, {duration: 0.8, ease: 'easeInOut'});
				document.body.classList.add('lpPoolTheme');
				return true;
			}
			animateTabs(tabsCope.current, {opacity: 1, y: 0}, {duration: 0.8, ease: 'easeInOut'});
			headingAnimate('#title', {opacity: 1, y: 0}, {duration: 0.6, ease: 'easeInOut'});
			headingAnimate('#composition', {opacity: 1, y: 0}, {duration: 0.6, ease: 'easeInOut'});
			lpPoolAnimate(lpPoolScope.current, {height: 0, opacity: 0, pointerEvents: 'none'}, {duration: 0.8, ease: 'easeInOut'});
			document.body.classList.remove('lpPoolTheme');
			return false;
		});
	}, [animateTabs, headingAnimate, lpPoolAnimate, lpPoolScope, tabsCope]);

	function renderTab(): ReactElement {
		switch (currentTab.value) {
			case 0:
				return <ViewDeposit onChangeTab={(): void => set_currentTab(tabs[2])} />;
			case 1:
				return <ViewWithdraw />;
			case 2:
				return <ViewStake />;
			case 3:
				return <ViewSwap />;
			default:
				return <ViewDeposit onChangeTab={(): void => set_currentTab(tabs[2])} />;
		}
	}

	return (
		<div className={'relative mx-auto mt-6 w-screen max-w-5xl'}>
			<div onClick={(): void => triggerPoolView(true)}>
				<YETHHeading scope={headingScope} />
			</div>


			<div className={cl('absolute top-10 text-neutral-0 duration-[600ms] ease-in-out transition-all', shouldRenderPool ? 'left-8 md:left-72 opacity-100 pointer-events-auto' : 'left-0 opacity-0 pointer-events-none')}>
				<button onClick={(): void => triggerPoolView(false)}>
					{'< Back to actions'}
				</button>
			</div>

			<LSTInPool scope={lpPoolScope} />

			<div
				ref={tabsCope}
				className={'relative mt-4'}>
				<div className={'flex w-full flex-col'}>
					<div className={'relative flex w-full flex-row items-center justify-between rounded-t-md bg-neutral-100 px-4 pt-4 md:px-72'}>
						<nav className={'z-30 hidden flex-row items-center space-x-10 md:flex'}>
							{tabs.map((tab): ReactElement => (
								<button
									key={`desktop-${tab.value}`}
									onClick={(): void => {
										set_currentTab(tab);
										router.replace(
											{
												query: {
													...router.query,
													action: tab.slug
												}
											},
											undefined,
											{shallow: true}
										);
									}}>
									<p
										title={tab.label}
										aria-selected={currentTab.value === tab.value}
										className={'hover-fix tab'}>
										{tab.label}
									</p>
								</button>
							))}
						</nav>
						<div className={'relative z-50'}>
							<Listbox
								value={currentTab.label}
								onChange={(value): void => {
									const newTab = tabs.find((tab): boolean => tab.value === Number(value));
									if (!newTab) {
										return;
									}
									set_currentTab(newTab);
								}}>
								{({open}): ReactElement => (
									<>
										<Listbox.Button
											className={'flex h-10 w-40 flex-row items-center border-0 border-b-2 border-neutral-900 bg-neutral-100 p-0 font-bold focus:border-neutral-900 md:hidden'}>
											<div className={'relative flex flex-row items-center'}>
												{currentTab?.label || 'Menu'}
											</div>
											<div className={'absolute right-0'}>
												<IconChevronBoth
													className={`h-6 w-6 transition-transform ${open ? '-rotate-180' : 'rotate-0'}`} />
											</div>
										</Listbox.Button>
										<Transition
											as={Fragment}
											show={open}
											enter={'transition duration-100 ease-out'}
											enterFrom={'transform scale-95 opacity-0'}
											enterTo={'transform scale-100 opacity-100'}
											leave={'transition duration-75 ease-out'}
											leaveFrom={'transform scale-100 opacity-100'}
											leaveTo={'transform scale-95 opacity-0'}>
											<Listbox.Options className={'yearn--listbox-menu'}>
												{tabs.map((tab): ReactElement => (
													<Listbox.Option
														className={'yearn--listbox-menu-item'}
														key={tab.value}
														value={tab.value}>
														{tab.label}
													</Listbox.Option>
												))}
											</Listbox.Options>
										</Transition>
									</>
								)}
							</Listbox>
						</div>
					</div>
					<div className={'z-10 -mt-0.5 h-0.5 w-full bg-neutral-300'} />
					<div className={'relative col-span-12 rounded-b-md bg-neutral-100'}>
						{renderTab()}
					</div>
				</div>
			</div>
		</div>
	);
}

export default function Wrapper({router}: {router: Router}): ReactElement {
	return (
		<div
			id={'yeth-main-page'}
			className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col bg-neutral-0 pt-20'}>
			<UIStepContextApp>
				<YETH router={router} />
			</UIStepContextApp>
		</div>
	);
}
