import React, {Fragment, useState} from 'react';
import {useRouter} from 'next/router';
import Phase1 from 'components/bootstrapViews/Phase1';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import {RenderAmount} from 'components/common/RenderAmount';
import IconChevronBoth from 'components/icons/IconChevronBoth';
import ViewDeposit from 'components/views/Deposit';
import ViewStake from 'components/views/Stake';
import ViewSwap from 'components/views/Swap';
import ViewWithdraw from 'components/views/Withdraw';
import useLST from 'contexts/useLST';
import {UIStepContextApp} from 'contexts/useUI';
import {Listbox, Transition} from '@headlessui/react';
import {cl} from '@yearn-finance/web-lib/utils/cl';

import type {ReactElement} from 'react';

const tabs = [
	{value: 0, label: 'Deposit', slug: 'deposit'},
	{value: 1, label: 'Withdraw', slug: 'withdraw'},
	{value: 2, label: 'Stake/Unstake', slug: 'stake-unstake'},
	{value: 3, label: 'Swap', slug: 'swap'},
	{value: 4, label: 'LP yETH', slug: 'lp-yeth'}
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
							<p className={cl(basicColorTransition, 'px-2')}>{token.symbol}</p>
						</div>
						<b className={basicColorTransition}>
							<RenderAmount
								value={token.weightRatio}
								symbol={'percent'}
								decimals={6} />
						</b>
					</div>
				);
			})}
		</div>
	);
}

function YETHHeading(): ReactElement {
	return (
		<div className={cl('group grid cursor-pointer grid-cols-30 divide-x-2 divide-neutral-300 rounded-md bg-neutral-100 px-[72px] text-neutral-900 transition-all hover:scale-102 hover:divide-neutral-0/20 hover:bg-purple-300 hover:text-neutral-0', basicTransition)}>

			<div className={'relative col-span-18 flex items-end py-8 pr-[72px]'}>
				<div className={cl('absolute -left-full top-10 text-neutral-0 opacity-0 transition-all duration-200 ease-in-out group-hover:left-0 group-hover:opacity-100', basicTransition)}>
					{'Explore >'}
				</div>
				<h1 className={cl('text-3xl md:text-8xl', basicColorTransition)}>
					{'yETH Pool'}
				</h1>
			</div>

			<div className={'col-span-12 flex w-full flex-row justify-between py-8 pl-[72px] transition-colors'}>
				<div className={'flex flex-col space-y-2'}>
					<div>
						<small className={cl('text-xs', basicLighterColorTransition)}>
							{'Daily Volume, USD'}
						</small>
						<b className={cl('block text-2xl leading-10', basicColorTransition)}>
							{'35 234.05'}
						</b>
					</div>

					<div>
						<small className={cl('text-xs text-purple-300 group-hover:text-neutral-0', basicTransition)}>
							{'Net APY'}
						</small>
						<b className={cl('block text-2xl leading-10 text-purple-300 group-hover:text-neutral-0', basicTransition)}>
							{'37.32 %'}
						</b>
					</div>

					<div>
						<small className={cl('text-xs', basicLighterColorTransition)}>
							{'Swap Fee'}
						</small>
						<b className={cl('block text-2xl leading-10', basicColorTransition)}>
							{'0.69 %'}
						</b>
					</div>

					<div>
						<small className={cl('text-xs', basicLighterColorTransition)}>
							{'Virtual Price, USD'}
						</small>
						<b className={cl('block text-2xl leading-10', basicColorTransition)}>
							{'6348.0185'}
						</b>
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

function YETH(): ReactElement {
	const router = useRouter();
	const [currentTab, set_currentTab] = useState<typeof tabs[0]>(tabs[0]);

	function renderTab(): ReactElement {
		switch (currentTab.value) {
			case 0:
				return <ViewDeposit />;
			case 1:
				return <ViewWithdraw />;
			case 2:
				return <ViewStake />;
			case 3:
				return <ViewSwap />;

			default:
				return <Phase1
					key={'phase-1'}
					variant={[]} />;
		}
	}

	return (
		<div className={'relative mx-auto mt-6 w-screen max-w-5xl'}>
			<YETHHeading />

			<div className={'relative mt-4 !min-h-screen'}>
				<div className={'flex w-full flex-col'}>
					<div className={'relative flex w-full flex-row items-center justify-between rounded-md bg-neutral-100 px-4 pt-4 md:px-[72px]'}>
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
					<div className={'relative col-span-12 bg-neutral-100'}>
						{renderTab()}
					</div>
				</div>
			</div>
		</div>
	);
}

export default function Wrapper(): ReactElement {
	return (
		<div className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col bg-neutral-0 pt-20'}>
			<UIStepContextApp>
				<YETH />
			</UIStepContextApp>
		</div>
	);
}
