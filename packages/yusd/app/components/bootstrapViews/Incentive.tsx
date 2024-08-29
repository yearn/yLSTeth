import React, {useCallback, useEffect, useMemo, useState} from 'react';
import assert from 'assert';
import {isValidAddress} from 'packages/yusdBootstrap/utils';
import {erc20Abi} from 'viem';
import {useContractRead} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {
	assertAddress,
	cl,
	formatAmount,
	formatNumberOver10K,
	formatPercent,
	toAddress,
	toBigInt,
	toNormalizedBN,
	truncateHex,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {ImageWithFallback} from '@libComponents/ImageWithFallback';
import {useTimer} from '@libHooks/useTimer';
import IconChevronPlain from '@libIcons/IconChevronPlain';
import IconSpinner from '@libIcons/IconSpinner';
import {useDeepCompareEffect} from '@react-hookz/web';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {Modal} from '@yearn-finance/web-lib/components/Modal';
import {Renderable} from '@yearn-finance/web-lib/components/Renderable';
import {IconChevronBottom} from '@yearn-finance/web-lib/icons/IconChevronBottom';
import {incentivize} from '@yUSD/actions';
import useBootstrap from '@yUSD/contexts/useBootstrap';
import {ETH_TOKEN} from '@yUSD/tokens';

import type {ChangeEvent, ReactElement} from 'react';
import type {TGroupedIncentives, TIncentivesFor} from '@yUSD/hooks/useBootstrapIncentives';
import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TIncentives, TIndexedTokenInfo, TSortDirection} from '@libUtils/types';
import ComboboxAddressInput from '@libComponents/ComboboxAddressInput';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {incentiveBegin, incentiveEnd, incentiveStatus} = periods || {};
	const time = useTimer({endTime: incentiveStatus === 'started' ? Number(incentiveEnd) : Number(incentiveBegin)});
	return <>{incentiveStatus === 'ended' ? 'ended' : incentiveStatus === 'started' ? time : `in ${time}`}</>;
}

function IncentiveMenuTabs({
	set_currentTab,
	currentTab
}: {
	currentTab: 'all' | 'mine';
	set_currentTab: (tab: 'all' | 'mine') => void;
}): ReactElement {
	return (
		<div className={'relative mb-4'}>
			<button
				onClick={(): void => set_currentTab('all')}
				className={cl(
					'mx-4 mb-2 text-lg transition-colors',
					currentTab === 'all' ? 'text-neutral-900 font-bold' : 'text-neutral-400'
				)}>
				{'All incentives'}
			</button>
			<button
				onClick={(): void => set_currentTab('mine')}
				className={cl(
					'mx-4 mb-2 text-lg transition-colors',
					currentTab === 'mine' ? 'text-neutral-900 font-bold' : 'text-neutral-400'
				)}>
				{'Your incentives'}
			</button>
			<div className={'absolute bottom-0 left-0 flex h-0.5 w-full flex-row bg-neutral-300'}>
				<div
					className={cl(
						'h-full w-fit transition-colors',
						currentTab === 'all' ? 'bg-neutral-900' : 'bg-transparent'
					)}>
					<button className={'pointer-events-none invisible h-0 px-4 text-lg opacity-0'}>
						{'All incentives'}
					</button>
				</div>
				<div
					className={cl(
						'h-full w-fit transition-colors',
						currentTab === 'mine' ? 'bg-neutral-900' : 'bg-transparent'
					)}>
					<button className={'pointer-events-none invisible h-0 px-4 text-lg opacity-0'}>
						{'Your incentives'}
					</button>
				</div>
			</div>
		</div>
	);
}

function IncentiveGroupBreakdownItem({item}: {item: TIncentives}): ReactElement {
	return (
		<div
			aria-label={'content'}
			className={'grid w-full grid-cols-8 py-2 md:w-[52%]'}>
			<div className={'col-span-2 flex w-full flex-row items-center space-x-2'}>
				<div className={'size-6 min-w-[24px]'}>
					<ImageWithFallback
						src={item.incentiveToken?.logoURI || ''}
						alt={''}
						unoptimized
						width={24}
						height={24}
					/>
				</div>
				<div>
					<p className={'text-xs'}>{item?.incentiveToken?.symbol || truncateHex(item.incentive, 6)}</p>
				</div>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p className={'font-number text-xxs pr-1 md:text-xs'}>
					{`${formatAmount(toNormalizedBN(item.amount, item.incentiveToken?.decimals)?.normalized || 0, 6, 6)}`}
				</p>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p className={'font-number text-xxs pr-1 md:text-xs'}>{`$${formatAmount(item.value, 2, 2)}`}</p>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p className={'font-number text-xxs pr-1 md:text-xs'}>{`${formatPercent(item.estimatedAPR, 2)}`}</p>
			</div>
		</div>
	);
}

function IncentiveGroupBreakdown({incentives}: {incentives: TIncentives[]}): ReactElement {
	const [sortBy, set_sortBy] = useState<string>('');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('');

	/* 🔵 - Yearn Finance **************************************************************************
	 **	Callback method used to sort the vaults list.
	 **	The use of useCallback() is to prevent the method from being re-created on every render.
	 **********************************************************************************************/
	const onSort = useCallback((newSortBy: string, newSortDirection: string): void => {
		set_sortBy(newSortBy);
		set_sortDirection(newSortDirection as TSortDirection);
	}, []);

	/* 🔵 - Yearn Finance **************************************************************************
	 **	Callback method used to toggle the sort direction.
	 **	By default, the sort direction is descending. If the user clicks on the same column again,
	 **	the sort direction will be toggled to ascending. If the user clicks on a different column,
	 **	the sort direction will be set to descending.
	 **********************************************************************************************/
	const toggleSortDirection = (newSortBy: string): TSortDirection => {
		return sortBy === newSortBy
			? sortDirection === ''
				? 'desc'
				: sortDirection === 'desc'
					? 'asc'
					: 'desc'
			: 'desc';
	};

	/* 🔵 - Yearn Finance **************************************************************************
	 **	Callback method used to render the chevron icon.
	 **	The chevron color and direction will change depending on the sort direction.
	 **********************************************************************************************/
	const renderChevron = useCallback(
		(shouldSortBy: boolean): ReactElement => {
			if (shouldSortBy && sortDirection === 'desc') {
				return <IconChevronPlain className={'yearn--sort-chevron transition-all'} />;
			}
			if (shouldSortBy && sortDirection === 'asc') {
				return <IconChevronPlain className={'yearn--sort-chevron rotate-180 transition-all'} />;
			}
			return (
				<IconChevronPlain
					className={'yearn--sort-chevron--off text-neutral-300 transition-all group-hover:text-neutral-500'}
				/>
			);
		},
		[sortDirection]
	);

	return (
		<div className={'border-t border-neutral-300 bg-neutral-100 px-4 pb-2 pt-4'}>
			<div className={'mb-4'}>
				<b className={'text-xs'}>{'Incentives Breakdown'}</b>
			</div>
			<div
				aria-label={'header'}
				className={'mb-2 grid w-full grid-cols-8 md:w-[52%]'}>
				<div className={'col-span-2'}>
					<p className={'text-xs text-neutral-500'}>{'Token used'}</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('amount', toggleSortDirection('amount'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'Amount'}
						<span className={'pl-2'}>{renderChevron(sortBy === 'amount')}</span>
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('usdValue', toggleSortDirection('usdValue'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						<span className={'hidden md:block'}>{'USD Value'}</span>
						<span className={'block md:hidden'}>{'$ Value'}</span>
						<span className={'pl-2'}>{renderChevron(sortBy === 'usdValue')}</span>
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('apr', toggleSortDirection('apr'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'APR'}
						<span className={'pl-2'}>{renderChevron(sortBy === 'apr')}</span>
					</p>
				</div>
			</div>
			{[...incentives]
				.sort((a, b): number => {
					let aValue = 0;
					let bValue = 0;
					if (sortBy === 'amount') {
						aValue = Number(toNormalizedBN(a.amount, a.incentiveToken?.decimals)?.normalized);
						bValue = Number(toNormalizedBN(b.amount, b.incentiveToken?.decimals)?.normalized);
					} else if (sortBy === 'usdValue') {
						aValue = a.value;
						bValue = b.value;
					} else if (sortBy === 'apr') {
						aValue = a.estimatedAPR;
						bValue = b.estimatedAPR;
					}
					return sortDirection === 'desc' ? Number(bValue) - Number(aValue) : Number(aValue) - Number(bValue);
				})
				.map(
					(item, index): ReactElement => (
						<IncentiveGroupBreakdownItem
							key={index}
							item={item}
						/>
					)
				)}
		</div>
	);
}

function IncentiveGroup({item}: {item: TGroupedIncentives}): ReactElement {
	const {safeChainID} = useChainID(Number(process.env.BASE_CHAIN_ID));

	return (
		<details
			aria-label={'content'}
			className={
				'my-0.5 rounded-sm bg-neutral-100/50 transition-colors open:bg-neutral-100 hover:bg-neutral-100'
			}>
			<summary className={'grid grid-cols-12 p-4'}>
				<div className={'col-span-12 flex w-full flex-row items-center space-x-6 md:col-span-5'}>
					<div className={'size-10 min-w-[40px]'}>
						<ImageWithFallback
							src={`https://assets.smold.app/api/token/${safeChainID}/${toAddress(item?.protocol)}/logo-128.png`}
							alt={''}
							unoptimized
							width={40}
							height={40}
						/>
					</div>
					<div className={'flex flex-col'}>
						<p className={'whitespace-nowrap'}>{item?.protocolSymbol || truncateHex(item.protocol, 6)}</p>
						<small className={'whitespace-nowrap text-xs'}>{item.protocolName}</small>
					</div>
				</div>
				<div className={'col-span-12 mt-4 flex justify-between md:col-span-2 md:mt-0 md:justify-end'}>
					<small className={'block text-neutral-500 md:hidden'}>{'Total incentive (USD)'}</small>
					<p
						suppressHydrationWarning
						className={'font-number'}>
						{`$${formatAmount(item.normalizedSum || 0, 2, 2)}`}
					</p>
				</div>
				<div className={'col-span-12 mt-2 flex justify-between md:col-span-2 md:mt-0 md:justify-end'}>
					<small className={'block text-neutral-500 md:hidden'}>{'USD/st-yETH'}</small>
					<p
						suppressHydrationWarning
						className={'font-number'}>
						{`${formatAmount(item.usdPerStETH || 0, 2, 2)}`}
					</p>
				</div>
				<div className={'col-span-12 mt-2 flex justify-between md:col-span-2 md:mt-0 md:justify-end'}>
					<small className={'block text-neutral-500 md:hidden'}>{'st-yETH vAPR'}</small>
					<p
						suppressHydrationWarning
						className={'font-number'}>
						{`${formatPercent(item.estimatedAPR, 2)}`}
					</p>
				</div>
				<div className={'col-span-1 hidden justify-end md:flex'}>
					<IconChevronBottom className={'chev size-6 text-neutral-900'} />
				</div>
			</summary>

			<div>
				<IncentiveGroupBreakdown incentives={item.incentives} />
			</div>
		</details>
	);
}

function IncentiveHistory({isPending, incentives}: {isPending: boolean; incentives: TIncentivesFor}): ReactElement {
	const [currentTab, set_currentTab] = useState<'all' | 'mine'>('all');
	const [sortBy, set_sortBy] = useState<string>('totalIncentive');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('desc');

	/* 🔵 - Yearn Finance **************************************************************************
	 **	Callback method used to sort the vaults list.
	 **	The use of useCallback() is to prevent the method from being re-created on every render.
	 **********************************************************************************************/
	const onSort = useCallback((newSortBy: string, newSortDirection: string): void => {
		set_sortBy(newSortBy);
		set_sortDirection(newSortDirection as TSortDirection);
	}, []);

	const toggleSortDirection = (newSortBy: string): TSortDirection => {
		return sortBy === newSortBy
			? sortDirection === ''
				? 'desc'
				: sortDirection === 'desc'
					? 'asc'
					: 'desc'
			: 'desc';
	};

	const renderChevron = useCallback(
		(shouldSortBy: boolean): ReactElement => {
			if (shouldSortBy && sortDirection === 'desc') {
				return <IconChevronPlain className={'yearn--sort-chevron transition-all'} />;
			}
			if (shouldSortBy && sortDirection === 'asc') {
				return <IconChevronPlain className={'yearn--sort-chevron rotate-180 transition-all'} />;
			}
			return (
				<IconChevronPlain
					className={'yearn--sort-chevron--off text-neutral-300 transition-all group-hover:text-neutral-500'}
				/>
			);
		},
		[sortDirection]
	);

	return (
		<div className={'mt-14'}>
			<IncentiveMenuTabs
				currentTab={currentTab}
				set_currentTab={set_currentTab}
			/>

			<div
				aria-label={'header'}
				className={'mb-4 hidden grid-cols-12 px-4 md:grid'}>
				<div className={'col-span-5'}>
					<p className={'text-xs text-neutral-500'}>{'LST'}</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('totalIncentive', toggleSortDirection('totalIncentive'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'Total incentive (USD)'}
						<span className={'pl-2'}>{renderChevron(sortBy === 'totalIncentive')}</span>
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('usdPerStETH', toggleSortDirection('usdPerStETH'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'USD/st-yETH'}
						<span className={'pl-2'}>{renderChevron(sortBy === 'usdPerStETH')}</span>
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('vapr', toggleSortDirection('vapr'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'st-yETH vAPR'}
						<span className={'pl-2'}>{renderChevron(sortBy === 'vapr')}</span>
					</p>
				</div>
				<div className={'col-span-1 flex justify-end'} />
			</div>

			{[...Object.values(currentTab === 'all' ? incentives.protocols : incentives.user)]
				.filter((e): boolean => Boolean(e))
				.sort((a, b): number => {
					let aValue = 0;
					let bValue = 0;
					if (sortBy === 'totalIncentive') {
						aValue = a.normalizedSum;
						bValue = b.normalizedSum;
					} else if (sortBy === 'vapr') {
						aValue = a.estimatedAPR;
						bValue = b.estimatedAPR;
					} else if (sortBy === 'usdPerStETH') {
						aValue = a.usdPerStETH;
						bValue = b.usdPerStETH;
					}
					return sortDirection === 'desc' ? Number(bValue) - Number(aValue) : Number(aValue) - Number(bValue);
				})
				.map(
					(item, index): ReactElement => (
						<IncentiveGroup
							key={index}
							item={item}
						/>
					)
				)}

			{isPending && (
				<div className={'mt-6 flex flex-row items-center justify-center'}>
					<IconSpinner className={'!h-6 !w-6 !text-neutral-400'} />
				</div>
			)}
		</div>
	);
}

type TIncentiveConfirmationModalProps = {
	lstToIncentive: TIndexedTokenInfo | undefined;
	tokenToUse: TIndexedTokenInfo | undefined;
	amountToSend: TNormalizedBN;
	balanceOf: TNormalizedBN;
	onSuccess: VoidFunction;
	onCancel: VoidFunction;
};
function IncentiveConfirmationModal({
	lstToIncentive,
	tokenToUse,
	amountToSend,
	balanceOf,
	onSuccess,
	onCancel
}: TIncentiveConfirmationModalProps): ReactElement {
	const {isActive, provider} = useWeb3();
	const [incentiveStatus, set_incentiveStatus] = useState<TTxStatus>(defaultTxStatus);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Web3 action to incentivize a given protocol with a given token and amount.
	 **********************************************************************************************/
	const onIncentive = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(amountToSend.raw > 0n, 'Amount must be greater than 0');
		assertAddress(tokenToUse?.address, 'Token to use not selected');
		assertAddress(lstToIncentive?.address, 'LST to incentive not selected');

		const result = await incentivize({
			connector: provider,
			chainID: Number(process.env.BASE_CHAIN_ID),
			contractAddress: toAddress(process.env.BOOTSTRAP_ADDRESS),
			protocolAddress: lstToIncentive.address,
			incentiveAddress: tokenToUse.address,
			amount: amountToSend.raw,
			statusHandler: set_incentiveStatus
		});
		if (result.isSuccessful) {
			onSuccess();
		}
	}, [amountToSend.raw, isActive, lstToIncentive, provider, tokenToUse, onSuccess]);

	return (
		<div className={'bg-neutral-0 w-full max-w-[400px] rounded-sm p-6'}>
			<b className={'text-xl'}>{'Confirm your submission'}</b>
			<div className={'mt-6'}>
				<p className={'pb-1 text-neutral-500'}>{'Incentivize LST'}</p>
				<div className={'flex flex-row rounded-sm border border-neutral-500 p-2'}>
					<div className={'mr-2 size-6 min-w-[24px]'}>
						<ImageWithFallback
							alt={''}
							unoptimized
							key={lstToIncentive?.logoURI || ''}
							src={lstToIncentive?.logoURI || ''}
							width={24}
							height={24}
						/>
					</div>
					<p>{lstToIncentive?.symbol || truncateHex(lstToIncentive?.address, 6)}</p>
				</div>
				<small className={'pl-2 pt-1 text-xs'}>&nbsp;</small>
			</div>
			<div>
				<p className={'pb-1 text-neutral-500'}>{'You give'}</p>
				<div className={'flex flex-row rounded-sm border border-neutral-500 p-2'}>
					<div className={'mr-2 size-6 min-w-[24px]'}>
						<ImageWithFallback
							alt={''}
							unoptimized
							key={tokenToUse?.logoURI || ''}
							src={tokenToUse?.logoURI || ''}
							width={24}
							height={24}
						/>
					</div>
					<p>{tokenToUse?.symbol || truncateHex(tokenToUse?.address, 6)}</p>
				</div>
				<small className={'pl-2 pt-1 text-xs'}>&nbsp;</small>
			</div>
			<div>
				<p className={'pb-1 text-neutral-500'}>{'Amount'}</p>
				<div className={'flex flex-row rounded-sm border border-neutral-500 p-2'}>
					<p>{amountToSend?.normalized || '0'}</p>
				</div>
				<small
					suppressHydrationWarning
					className={'pl-2 pt-1 text-xs text-neutral-600'}>
					{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${tokenToUse?.symbol || '-'}`}
				</small>
			</div>
			<div className={'mt-6'}>
				<Button
					onClick={onIncentive}
					isBusy={incentiveStatus.pending}
					isDisabled={
						amountToSend.raw === 0n ||
						amountToSend.raw > balanceOf.raw ||
						!isValidAddress(lstToIncentive?.address) ||
						!isValidAddress(tokenToUse?.address)
					}
					className={'yearn--button w-full rounded-md !text-sm'}>
					{'Confirm'}
				</Button>
				<button
					onClick={onCancel}
					className={
						'mt-2 h-10 w-full text-center text-neutral-500 transition-colors hover:text-neutral-900'
					}>
					{'Cancel'}
				</button>
			</div>
		</div>
	);
}

function ViewIncentive(): ReactElement {
	const {address, isActive, provider} = useWeb3();
	const {safeChainID} = useChainID(Number(process.env.BASE_CHAIN_ID));
	const {balances, onRefresh} = useWallet();
	const {tokenList} = useTokenList();
	const {
		whitelistedLST,
		periods: {incentiveStatus},
		incentives: {groupIncentiveHistory, isFetchingHistory, refreshIncentives, totalDepositedUSD}
	} = useBootstrap();
	const [isModalOpen, set_isModalOpen] = useState<boolean>(false);
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [possibleTokensToUse, set_possibleTokensToUse] = useState<TDict<TIndexedTokenInfo | undefined>>({});
	const [lstToIncentive, set_lstToIncentive] = useState<TIndexedTokenInfo | undefined>();
	const [tokenToUse, set_tokenToUse] = useState<TIndexedTokenInfo | undefined>();
	const [approvalStatus, set_approvalStatus] = useState<TTxStatus>(defaultTxStatus);
	const [className, set_className] = useState<string>('pointer-events-none opacity-40');
	const {data: allowanceOf, refetch: refetchAllowance} = useContractRead({
		abi: erc20Abi,
		address: tokenToUse?.address,
		functionName: 'allowance',
		args: [toAddress(address), toAddress(process.env.BOOTSTRAP_ADDRESS)]
	});

	useEffect((): void => {
		if (incentiveStatus !== 'started') {
			set_className('pointer-events-none opacity-40');
		} else {
			set_className('');
		}
	}, [incentiveStatus, className]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Calculate the sum of all the incentives for all the protocols.
	 **********************************************************************************************/
	const sumOfAllIncentives = useMemo((): number => {
		let sum = 0;
		for (const eachIncentive of Object.values(groupIncentiveHistory.protocols)) {
			sum += eachIncentive.normalizedSum;
		}
		return sum;
	}, [groupIncentiveHistory]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** On mount, fetch the token list from the tokenlistooor repo.
	 ** Only the tokens in that list will be displayed.
	 **********************************************************************************************/
	useDeepCompareEffect((): void => {
		const possibleDestinationsTokens: TDict<TIndexedTokenInfo> = {};
		for (const eachToken of Object.values(tokenList)) {
			if (eachToken.chainId === safeChainID) {
				possibleDestinationsTokens[toAddress(eachToken.address)] = eachToken;
			}
		}
		set_possibleTokensToUse(possibleDestinationsTokens);
	}, [tokenList, safeChainID]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** On balance or token change, update the balance of the token to use.
	 **********************************************************************************************/
	const balanceOf = useMemo((): TNormalizedBN => {
		if (!tokenToUse) {
			return zeroNormalizedBN;
		}
		return toNormalizedBN(balances?.[tokenToUse.address]?.raw || 0 || 0, tokenToUse.decimals || 18);
	}, [balances, tokenToUse]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Change the inputed amount when the user types something in the input field.
	 **********************************************************************************************/
	const onChangeAmount = useCallback(
		(e: ChangeEvent<HTMLInputElement>): void => {
			if (!tokenToUse) {
				return;
			}
			const element = document.getElementById('amountToSend') as HTMLInputElement;
			const newAmount = handleInputChangeEventValue(e, tokenToUse?.decimals || 18);
			if (newAmount.raw > balances?.[tokenToUse.address]?.raw) {
				if (element?.value) {
					element.value = formatAmount(balances?.[tokenToUse.address]?.normalized, 0, 18);
				}
				return set_amountToSend(
					toNormalizedBN(balances?.[tokenToUse.address]?.raw || 0, tokenToUse.decimals || 18)
				);
			}
			set_amountToSend(newAmount);
		},
		[balances, tokenToUse]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Change the inputed amount when the user select a percentage to set.
	 **********************************************************************************************/
	const updateToPercent = useCallback(
		(percent: number): void => {
			if (!tokenToUse) {
				return;
			}
			const element = document.getElementById('amountToSend') as HTMLInputElement;
			const newAmount = toNormalizedBN((balanceOf.raw * BigInt(percent)) / 100n, tokenToUse.decimals || 18);
			if (newAmount.raw > balances?.[tokenToUse.address]?.raw) {
				if (element?.value) {
					element.value = formatAmount(balances?.[tokenToUse.address]?.normalized, 0, 18);
				}
				return set_amountToSend(
					toNormalizedBN(balances?.[tokenToUse.address]?.raw || 0, tokenToUse.decimals || 18)
				);
			}
			set_amountToSend(newAmount);
		},
		[balanceOf, balances, tokenToUse]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** View function to check if the user has enough allowance for the token/amount to send.
	 **********************************************************************************************/
	const hasAllowance = useMemo((): boolean => {
		return toBigInt(allowanceOf) >= amountToSend.raw;
	}, [allowanceOf, amountToSend.raw]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Web3 action to incentivize a given protocol with a given token and amount.
	 **********************************************************************************************/
	const onIncentiveSuccess = useCallback(async (): Promise<void> => {
		set_amountToSend(zeroNormalizedBN);
		if (!tokenToUse) {
			await Promise.all([refreshIncentives(), refetchAllowance(), onRefresh([{...ETH_TOKEN}])]);
			set_isModalOpen(false);
			return;
		}
		await Promise.all([refreshIncentives(), refetchAllowance(), onRefresh([{...ETH_TOKEN}, {...tokenToUse}])]);
		set_isModalOpen(false);
	}, [onRefresh, refreshIncentives, refetchAllowance, tokenToUse]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Web3 action to incentivize a given protocol with a given token and amount.
	 **********************************************************************************************/
	const onApprove = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(amountToSend.raw > 0n, 'Amount must be greater than 0');
		assertAddress(tokenToUse?.address, 'Token to use not selected');

		const result = await approveERC20({
			connector: provider,
			chainID: Number(process.env.BASE_CHAIN_ID),
			contractAddress: tokenToUse.address,
			spenderAddress: toAddress(process.env.BOOTSTRAP_ADDRESS),
			amount: amountToSend.raw,
			statusHandler: set_approvalStatus
		});
		if (result.isSuccessful) {
			refetchAllowance();
			await onRefresh([{...ETH_TOKEN}, {...tokenToUse}]);
		}
	}, [amountToSend.raw, isActive, provider, onRefresh, tokenToUse, refetchAllowance]);

	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<div className={'mb-10 flex w-full flex-col justify-center'}>
					<h1 className={'text-3xl font-black md:text-8xl'}>{'Incentivize'}</h1>
					<b
						suppressHydrationWarning
						className={'font-number mt-4 text-4xl leading-10 text-purple-300'}>
						<Timer />
					</b>
					<div className={'grid w-full items-center gap-4 md:grid-cols-1 md:gap-6 lg:grid-cols-2'}>
						<div className={'w-full'}>
							<p className={'text-neutral-700'}>
								{
									'Pick which LST you are incentivizing for, and which token you’ll be posting the incentive in. Remember, if your token is not included in the final yETH basket you’ll be refunded the full amount of your incentive.'
								}
							</p>
						</div>
						<div className={'flex justify-end space-x-4'}>
							<div className={'w-full bg-neutral-100 p-4 lg:w-72'}>
								<p className={'pb-2'}>{'Current total deposits, USD'}</p>
								<b
									suppressHydrationWarning
									className={'font-number text-3xl'}>
									<Renderable
										shouldRender={true}
										fallback={'-'}>
										{`$${formatNumberOver10K(totalDepositedUSD)}`}
									</Renderable>
								</b>
							</div>
							<div className={'w-full bg-neutral-100 p-4 lg:w-72'}>
								<p className={'pb-2'}>{'Current total incentives, USD'}</p>
								<b
									suppressHydrationWarning
									className={'font-number text-3xl'}>
									<Renderable
										shouldRender={true}
										fallback={'-'}>
										{`$${formatNumberOver10K(sumOfAllIncentives)}`}
									</Renderable>
								</b>
							</div>
						</div>
					</div>
				</div>

				<div
					key={incentiveStatus}
					className={className}>
					<div
						className={
							'mb-8 grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-4 lg:gap-4'
						}>
						<div>
							<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>
								{'Select LST to incentivize'}
							</p>
							<ComboboxAddressInput
								value={lstToIncentive?.address}
								possibleValues={whitelistedLST.whitelistedLST}
								onChangeValue={set_lstToIncentive}
							/>
							<p className={'hidden pt-1 text-xs lg:block'}>&nbsp;</p>
						</div>

						<div className={'pt-2 md:pt-0'}>
							<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>
								{'Select token to incentivize with'}
							</p>
							<ComboboxAddressInput
								value={tokenToUse?.address}
								possibleValues={possibleTokensToUse}
								onAddValue={set_possibleTokensToUse}
								onChangeValue={set_tokenToUse}
							/>
							<p className={'hidden pt-1 text-xs lg:block'}>&nbsp;</p>
						</div>

						<div className={'pt-2 md:pt-0'}>
							<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'Amount'}</p>
							<div
								className={
									'grow-1 bg-neutral-0 flex h-10 w-full items-center justify-center rounded-md p-2'
								}>
								<div className={'mr-2 size-6 min-w-[24px]'}>
									<ImageWithFallback
										alt={''}
										unoptimized
										key={tokenToUse?.logoURI || ''}
										src={tokenToUse?.logoURI || ''}
										width={24}
										height={24}
									/>
								</div>
								<input
									id={'amountToSend'}
									className={
										'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none'
									}
									type={'number'}
									min={0}
									maxLength={20}
									max={balanceOf?.normalized || 0}
									step={1 / 10 ** (tokenToUse?.decimals || 18)}
									inputMode={'numeric'}
									placeholder={'0'}
									pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
									value={amountToSend?.normalized || ''}
									onChange={onChangeAmount}
								/>
								<div className={'ml-2 flex flex-row space-x-1'}>
									<button
										type={'button'}
										tabIndex={-1}
										onClick={(): void => updateToPercent(100)}
										className={cl(
											'px-2 py-1 text-xs rounded-md border border-purple-300 transition-colors bg-purple-300 text-white'
										)}>
										{'Max'}
									</button>
								</div>
							</div>
							<small
								suppressHydrationWarning
								className={'pl-2 pt-1 text-xs text-neutral-600'}>
								{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${tokenToUse?.symbol || '-'}`}
							</small>
						</div>

						<div className={'w-full pt-4 md:pt-0'}>
							<p className={'hidden pb-1 text-neutral-600 md:block'}>&nbsp;</p>
							<Button
								onClick={(): unknown => (hasAllowance ? set_isModalOpen(true) : onApprove())}
								isBusy={approvalStatus.pending}
								isDisabled={
									!approvalStatus.none ||
									incentiveStatus !== 'started' ||
									amountToSend.raw === 0n ||
									amountToSend.raw > balanceOf.raw ||
									!isValidAddress(lstToIncentive?.address) ||
									!isValidAddress(tokenToUse?.address)
								}
								className={'yearn--button w-full rounded-md !text-sm'}>
								{hasAllowance ? 'Submit' : 'Approve'}
							</Button>
							<p className={'pl-2 pt-1 text-xs text-neutral-600'}>&nbsp;</p>
						</div>
					</div>
					<IncentiveHistory
						isPending={isFetchingHistory}
						incentives={groupIncentiveHistory}
					/>
				</div>
			</div>
			<Modal
				className={'small-modal'}
				isOpen={isModalOpen}
				onClose={(): void => set_isModalOpen(false)}>
				<IncentiveConfirmationModal
					lstToIncentive={lstToIncentive}
					tokenToUse={tokenToUse}
					amountToSend={amountToSend}
					balanceOf={balanceOf}
					onSuccess={onIncentiveSuccess}
					onCancel={(): void => set_isModalOpen(false)}
				/>
			</Modal>
		</section>
	);
}

export default ViewIncentive;
