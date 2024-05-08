import React, {Fragment, useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useBlockNumber, useReadContract} from 'wagmi';
import {useAnimate} from 'framer-motion';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount, toAddress, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import {Listbox, Transition} from '@headlessui/react';
import BOOTSTRAP_ABI from '@libAbi/bootstrap.abi';
import {ST_YETH_ABI} from '@libAbi/styETH.abi';
import {ImageWithFallback} from '@libComponents/ImageWithFallback';
import useAPR from '@libHooks/useAPR';
import IconChevronBoth from '@libIcons/IconChevronBoth';
import {useMountEffect, useUnmountEffect} from '@react-hookz/web';
import ViewDeposit from '@yETH/components/views/Deposit';
import ViewStake from '@yETH/components/views/Stake';
import ViewSwap from '@yETH/components/views/Swap';
import LSTInPool from '@yETH/components/views/ViewLSTInPool';
import ViewWithdraw from '@yETH/components/views/Withdraw';
import useBasket from '@yETH/contexts/useBasket';
import useLST from '@yETH/contexts/useLST';
import {STYETH_TOKEN, YETH_TOKEN} from '@yETH/tokens';

import type {AnimationScope} from 'framer-motion';
import type {Router} from 'next/router';
import type {ReactElement} from 'react';

const tabs = [
	{value: 0, label: 'Deposit LST', slug: 'deposit-lst'},
	{value: 1, label: 'Deposit ETH', slug: 'deposit-eth-leg'},
	{value: 2, label: 'Withdraw', slug: 'withdraw'},
	{value: 3, label: 'Stake/Unstake', slug: 'stake-unstake'},
	{value: 4, label: 'Swap', slug: 'swap'}
];

const basicTransition = 'duration-200 ease-in-out';
const basicColorTransition = cl(basicTransition, 'text-neutral-900 transition-colors group-hover:text-neutral-0');
const basicLighterColorTransition = cl(
	basicTransition,
	'text-neutral-600 transition-colors group-hover:text-neutral-0'
);

function Composition(): ReactElement {
	const {basket, isLoaded} = useBasket();

	return (
		<div className={'col-span-6 flex flex-col space-y-2'}>
			<div>
				<small className={cl('text-xs', basicLighterColorTransition)}>{'Composition'}</small>
			</div>
			<div className={'flex min-h-80 flex-col space-y-4'}>
				{isLoaded ? (
					[...basket]
						.sort((a, b): number => Number(b.weightRatio) - Number(a.weightRatio))
						.map((token, index): ReactElement => {
							return (
								<div
									key={index}
									className={'flex flex-row justify-between space-x-4'}>
									<div className={'flex flex-row'}>
										<div className={'size-6 min-w-[24px]'}>
											<ImageWithFallback
												alt={token.name}
												unoptimized
												src={token.logoURI || ''}
												altSrc={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${token.address}/logo-32.png`}
												width={24}
												height={24}
											/>
										</div>
										<p className={cl(basicColorTransition, 'text-sm md:text-base px-2')}>
											{token.symbol}
										</p>
									</div>
									<b
										suppressHydrationWarning
										className={cl(basicColorTransition, 'text-sm md:text-base')}>
										{`${formatAmount((token?.weightRatio || 0) * 100, 2, 2)}%`}
									</b>
								</div>
							);
						})
				) : (
					<>
						<div className={'flex flex-row items-center justify-between space-x-2'}>
							<div className={'skeleton-full size-6 min-w-[24px]'} />
							<div className={'skeleton-lg h-4 w-full'} />
						</div>
						<div className={'flex flex-row items-center justify-between space-x-2'}>
							<div className={'skeleton-full size-6 min-w-[24px]'} />
							<div className={'skeleton-lg h-4 w-full'} />
						</div>
						<div className={'flex flex-row items-center justify-between space-x-2'}>
							<div className={'skeleton-full size-6 min-w-[24px]'} />
							<div className={'skeleton-lg h-4 w-full'} />
						</div>
						<div className={'flex flex-row items-center justify-between space-x-2'}>
							<div className={'skeleton-full size-6 min-w-[24px]'} />
							<div className={'skeleton-lg h-4 w-full'} />
						</div>
					</>
				)}
			</div>
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

function RenderYETHValue({amount}: {amount: bigint}): ReactElement {
	const timer = useTimer();

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Retrieve the locked st-yETH in the bootstrap contract for the current user
	 **********************************************************************************************/
	const {data: blockNumber} = useBlockNumber({watch: true});
	const {data: yETHValue, refetch} = useReadContract({
		abi: ST_YETH_ABI,
		address: toAddress(process.env.STYETH_ADDRESS),
		functionName: 'convertToAssets',
		args: [amount],
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		query: {
			enabled: timer > 0
		}
	});
	useEffect(() => {
		refetch();
	}, [blockNumber, refetch]);

	return (
		<p
			suppressHydrationWarning
			className={cl(
				'text-sm block md:text-base text-neutral-500 transition-colors group-hover:text-neutral-0 font-number'
			)}>
			{`~ ${formatAmount(Number(toNormalizedBN(toBigInt(yETHValue), 18).normalized), 6, 6)} yETH`}
		</p>
	);
}

function HeadingUserPosition(): ReactElement {
	const {address} = useWeb3();
	const {getBalance, isLoading: isLoadingBalance, balances} = useWallet();

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Retrieve the locked st-yETH in the bootstrap contract for the current user
	 **********************************************************************************************/
	const {data: lockedTokens} = useReadContract({
		abi: BOOTSTRAP_ABI,
		address: toAddress(process.env.BOOTSTRAP_ADDRESS),
		functionName: 'deposits',
		args: [toAddress(address)],
		chainId: Number(process.env.DEFAULT_CHAIN_ID)
	});

	/**********************************************************************************************
	 ** Retrieve the basket balance for the current user
	 **********************************************************************************************/
	const basketTokenBalance = useMemo(
		() => getBalance({address: YETH_TOKEN.address, chainID: YETH_TOKEN.chainID}),
		[getBalance]
	);

	/**********************************************************************************************
	 ** Retrieve the basket staked balance for the current user
	 **********************************************************************************************/
	const basketTokenStBalance = useMemo(
		() => getBalance({address: STYETH_TOKEN.address, chainID: STYETH_TOKEN.chainID}),
		[getBalance]
	);

	return (
		<div className={'divider mt-6 grid grid-cols-1 space-y-2 border-t-2 pt-6'}>
			<div>
				<small className={cl('text-xs', basicLighterColorTransition)}>{'Your yETH'}</small>
				<b
					suppressHydrationWarning
					className={cl('block text-lg md:text-lg leading-6 md:leading-8 font-number', basicColorTransition)}>
					{isLoadingBalance || !balances || Object.keys(balances).length === 0 ? (
						<div className={'py-1'}>
							<div className={'skeleton-lg h-6 w-1/2'} />
						</div>
					) : (
						formatAmount(basketTokenBalance.normalized, 6, 6)
					)}
				</b>
			</div>

			<div>
				<small className={cl('text-xs', basicLighterColorTransition)}>{'Your st-yETH'}</small>
				<span className={'flex w-full items-center justify-between whitespace-nowrap'}>
					{isLoadingBalance || !balances || Object.keys(balances).length === 0 ? (
						<div className={'h-8 w-full py-1'}>
							<div className={'skeleton-lg h-6 w-full'} />
						</div>
					) : (
						<>
							<b
								suppressHydrationWarning
								className={cl(
									'text-lg md:text-lg leading-6 md:leading-8 font-number',
									basicColorTransition
								)}>
								{formatAmount(basketTokenStBalance.normalized, 6, 6)}
							</b>
							<RenderYETHValue amount={basketTokenStBalance.raw} />
						</>
					)}
				</span>
			</div>

			{lockedTokens && lockedTokens >= 0n ? (
				<div>
					<small className={cl('text-xs', basicLighterColorTransition)}>{'Your bootstrap st-yETH'}</small>
					<span className={'flex w-full items-center justify-between whitespace-nowrap'}>
						<b
							suppressHydrationWarning
							className={cl(
								'text-lg md:text-lg leading-6 md:leading-8 font-number',
								basicColorTransition
							)}>
							{formatAmount(toNormalizedBN(lockedTokens || 0n, 18).normalized, 6, 6)}
						</b>
						<RenderYETHValue amount={toBigInt(lockedTokens)} />
					</span>
				</div>
			) : null}
		</div>
	);
}

function HeadingPoolData(): ReactElement {
	const {TVL, TAL, isTVLLoaded} = useLST();
	const {APR, isLoaded: isAPRLoaded} = useAPR();

	return (
		<div className={'col-span-6 flex flex-col space-y-4'}>
			<div>
				<small className={cl('text-xs', basicLighterColorTransition)}>{'TVL, USD'}</small>
				<b
					suppressHydrationWarning
					className={cl('block text-lg md:text-lg leading-6 md:leading-8 font-number', basicColorTransition)}>
					{!isTVLLoaded ? (
						<div className={'py-1'}>
							<div className={'skeleton-lg h-6 w-3/4'} />
						</div>
					) : (
						formatAmount(TVL, 0, 0)
					)}
				</b>
			</div>

			<div>
				<small className={cl('text-xs', basicLighterColorTransition)}>{'TVL, ETH'}</small>
				<b
					suppressHydrationWarning
					className={cl('block text-lg md:text-lg leading-6 md:leading-8 font-number', basicColorTransition)}>
					{!isTVLLoaded ? (
						<div className={'py-1'}>
							<div className={'skeleton-lg h-6 w-3/4'} />
						</div>
					) : (
						formatAmount(TAL.normalized, 4, 4)
					)}
				</b>
			</div>

			<div>
				<small className={cl('text-xs text-purple-300 group-hover:text-neutral-0', basicTransition)}>
					{'APR'}
				</small>

				<span className={'tooltip'}>
					<b
						suppressHydrationWarning
						className={cl(
							'block text-lg md:text-2xl leading-6 md:leading-8 text-purple-300 group-hover:text-neutral-0 font-number',
							basicTransition
						)}>
						{!isAPRLoaded ? (
							<div className={'py-1'}>
								<div className={'skeleton-lg h-6 w-3/4'} />
							</div>
						) : (
							`~${formatAmount(APR, 2, 2)}%`
						)}
					</b>
					<span className={'tooltipLight !-inset-x-24 top-full mt-2 !w-auto'}>
						<div
							suppressHydrationWarning
							className={
								'text-neutral-0 w-fit rounded-md border border-neutral-700 bg-neutral-900 p-1 px-2 text-center text-xs font-medium'
							}>
							{
								"APY is calculated based on last week's yETH yield generated by the protocol, streamed to st-yETH holders this week"
							}
						</div>
					</span>
				</span>
			</div>
		</div>
	);
}

function Heading({scope}: {scope: AnimationScope}): ReactElement {
	return (
		<div
			ref={scope}
			id={'yeth-main-heading'}
			className={cl('group', basicTransition)}>
			<div
				id={'title'}
				className={'col-span-18 relative flex items-end py-6 pr-0 md:py-8 md:pr-72'}>
				<div
					id={'yeth-title-explore'}
					className={cl(
						'absolute -left-full top-10 text-neutral-0 opacity-0 transition-all duration-200 ease-in-out group-hover:left-0 group-hover:opacity-100 hidden md:block',
						basicTransition
					)}>
					{'Explore >'}
				</div>
				<h1 className={cl('text-5xl md:text-8xl font-black', basicColorTransition)}>{'yETH'}</h1>
			</div>

			<div
				id={'composition'}
				className={'col-span-12 flex w-full flex-col py-4 pl-0 transition-colors md:py-8 md:pl-72'}>
				<div className={'grid w-full grid-cols-12 justify-between'}>
					<HeadingPoolData />
					<Composition />
				</div>
				<HeadingUserPosition />
			</div>
		</div>
	);
}

function Index({router}: {router: Router}): ReactElement {
	const [tabsCope, animateTabs] = useAnimate();
	const [headingScope, headingAnimate] = useAnimate();
	const [lpPoolScope, lpPoolAnimate] = useAnimate();
	const [currentTab, set_currentTab] = useState<(typeof tabs)[0]>(tabs[0]);
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

	const triggerPoolView = useCallback(
		(direction: boolean): void => {
			set_shouldRenderPool((prev): boolean => {
				if (direction === prev) {
					return prev;
				}
				if (direction) {
					animateTabs(tabsCope.current, {opacity: 0, y: '100vh'}, {duration: 0.8, ease: 'easeInOut'});
					headingAnimate('#title', {y: -144}, {duration: 0.6, ease: 'easeInOut'});
					headingAnimate('#composition', {opacity: 0, y: -144}, {duration: 0.6, ease: 'easeInOut'});
					lpPoolAnimate(
						lpPoolScope.current,
						{opacity: 1, height: 'auto', pointerEvents: 'auto'},
						{duration: 0.8, ease: 'easeInOut'}
					);
					document.body.classList.add('lpPoolTheme');
					return true;
				}
				animateTabs(tabsCope.current, {opacity: 1, y: 0}, {duration: 0.8, ease: 'easeInOut'});
				headingAnimate('#title', {opacity: 1, y: 0}, {duration: 0.6, ease: 'easeInOut'});
				headingAnimate('#composition', {opacity: 1, y: 0}, {duration: 0.6, ease: 'easeInOut'});
				lpPoolAnimate(
					lpPoolScope.current,
					{height: 0, opacity: 0, pointerEvents: 'none'},
					{duration: 0.8, ease: 'easeInOut'}
				);
				document.body.classList.remove('lpPoolTheme');
				return false;
			});
		},
		[animateTabs, headingAnimate, lpPoolAnimate, lpPoolScope, tabsCope]
	);

	function renderTab(): ReactElement {
		switch (currentTab.value) {
			case 0:
				return <ViewDeposit />;
			case 2:
				return <ViewWithdraw />;
			case 3:
				return <ViewStake />;
			case 4:
				return <ViewSwap />;
			default:
				return <ViewDeposit />;
		}
	}

	return (
		<div className={'relative mx-auto mt-6 w-screen max-w-5xl'}>
			<div onClick={(): void => triggerPoolView(true)}>
				<Heading scope={headingScope} />
			</div>

			<div
				className={cl(
					'absolute top-10 text-neutral-0 duration-500 ease-in-out transition-all',
					shouldRenderPool
						? 'left-8 md:left-72 opacity-100 pointer-events-auto'
						: 'left-0 opacity-0 pointer-events-none'
				)}>
				<button onClick={(): void => triggerPoolView(false)}>{'< Back to actions'}</button>
			</div>

			<LSTInPool scope={lpPoolScope} />

			<div
				ref={tabsCope}
				className={'relative mt-4'}>
				<div className={'flex w-full flex-col'}>
					<div
						className={
							'relative flex w-full flex-row items-center justify-between rounded-t-md bg-neutral-100 px-4 pt-4 md:px-72'
						}>
						<nav className={'z-30 hidden flex-row items-center space-x-10 md:flex'}>
							{tabs.map((tab): ReactElement => {
								if (tab.slug === 'deposit-eth-leg') {
									return (
										<Link
											key={`desktop-${tab.value}`}
											href={'https://swap.cow.fi/#/1/swap/ETH/st-yETH'}
											target={'_blank'}>
											<p
												title={tab.label}
												aria-selected={currentTab.value === tab.value}
												className={'hover-fix tab !cursor-alias'}>
												{tab.label}
											</p>
										</Link>
									);
								}
								return (
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
								);
							})}
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
											className={
												'flex h-10 w-40 flex-row items-center border-0 border-b-2 border-neutral-900 bg-neutral-100 p-0 font-bold focus:border-neutral-900 md:hidden'
											}>
											<div className={'relative flex flex-row items-center'}>
												{currentTab?.label || 'Menu'}
											</div>
											<div className={'absolute right-0'}>
												<IconChevronBoth
													className={`size-6 transition-transform ${
														open ? '-rotate-180' : 'rotate-0'
													}`}
												/>
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
												{tabs.map(
													(tab): ReactElement => (
														<Listbox.Option
															className={'yearn--listbox-menu-item'}
															key={tab.value}
															value={tab.value}>
															{tab.label}
														</Listbox.Option>
													)
												)}
											</Listbox.Options>
										</Transition>
									</>
								)}
							</Listbox>
						</div>
					</div>
					<div className={'z-10 -mt-0.5 h-0.5 w-full bg-neutral-300'} />
					<div className={'relative col-span-12 rounded-b-md bg-neutral-100'}>{renderTab()}</div>
				</div>
			</div>
		</div>
	);
}

export default function Wrapper({router}: {router: Router}): ReactElement {
	return (
		<div
			id={'yeth-main-page'}
			className={'bg-neutral-0 relative mx-auto mb-0 flex min-h-screen w-full flex-col pt-20'}>
			<Index router={router} />
		</div>
	);
}
