import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/router';
import assert from 'assert';
import {erc20Abi, zeroAddress} from 'viem';
import {useReadContract} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {
	assertAddress,
	cl,
	ETH_TOKEN_ADDRESS,
	formatAmount,
	handleInputChangeEventValue,
	isZeroAddress,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import ComboboxAddressInput from '@libComponents/ComboboxAddressInput';
import {useDeepCompareEffect} from '@react-hookz/web';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {depositInclusionIncentive, depositWeightIncentive} from '@yUSD/actions';
import useBasket from '@yUSD/contexts/useBasket';
import useInclusion from '@yUSD/contexts/useInclusion';
import {ETH_TOKEN} from '@yUSD/tokens';
import {NO_CHANGE_LST_LIKE} from '@yUSD/utils/constants';

import {ImageWithFallback} from '../../../../lib/components/ImageWithFallback';

import type {ChangeEvent, ReactElement} from 'react';
import type {TDict, TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

function IncentiveMenuTabs(props: {
	currentTab: 'current' | 'potential';
	set_currentTab: (tab: 'current' | 'potential') => void;
}): ReactElement {
	const router = useRouter();

	useEffect((): void => {
		const urlParams = new URLSearchParams(window.location.search);
		const action = urlParams.get('action');

		if (action === 'current' || action === 'potential') {
			props.set_currentTab(action);
		} else if (router.query?.action === 'current' || router.query?.action === 'potential') {
			props.set_currentTab(router.query.action);
		}
	}, [props.set_currentTab, router.query]);

	return (
		<div className={'overflow-hidden'}>
			<div className={'relative -mx-4 px-4 md:px-72 '}>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {action: 'current'}});
					}}
					className={cl(
						'mx-4 mb-2 text-lg transition-colors',
						props.currentTab === 'current' ? 'text-primary font-bold' : 'text-neutral-400'
					)}>
					{'Weight votes'}
				</button>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {action: 'potential'}});
					}}
					className={cl(
						'mx-4 mb-2 text-lg transition-colors',
						props.currentTab === 'potential' ? 'text-primary font-bold' : 'text-neutral-400'
					)}>
					{'Inclusion votes'}
				</button>
				<div className={'absolute bottom-0 left-0 flex h-0.5 w-full flex-row bg-neutral-300 px-4 md:px-72'}>
					<div
						className={cl(
							'h-full w-fit transition-colors ml-4',
							props.currentTab === 'current' ? 'bg-primary' : 'bg-transparent'
						)}>
						<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>
							{'Weight votes'}
						</button>
					</div>
					<div
						className={cl(
							'h-full w-fit transition-colors ml-4',
							props.currentTab === 'potential' ? 'bg-primary' : 'bg-transparent'
						)}>
						<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>
							{'Inclusion votes'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function WeightIncentiveSelector(props: {isIncentivePeriodOpen: boolean}): ReactElement {
	const {address, isActive, provider} = useWeb3();
	const {safeChainID} = useChainID(Number(process.env.DEFAULT_CHAIN_ID));
	const {getBalance, onRefresh} = useWallet();
	const {basket, isLoaded, refreshIncentives} = useBasket();
	const {currentNetworkTokenList} = useTokenList();
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN | undefined>(undefined);
	const [possibleTokensToUse, set_possibleTokensToUse] = useState<TDict<TToken | undefined>>({});
	const [lstToIncentive, set_lstToIncentive] = useState<TToken | undefined>();
	const [tokenToUse, set_tokenToUse] = useState<TToken | undefined>();
	const [approvalStatus, set_approvalStatus] = useState<TTxStatus>(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState<TTxStatus>(defaultTxStatus);
	const {data: hasAllowance, refetch: refetchAllowance} = useReadContract({
		abi: erc20Abi,
		address: tokenToUse?.address,
		functionName: 'allowance',
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		args: [toAddress(address), toAddress(process.env.WEIGHT_INCENTIVES_ADDRESS)],
		query: {
			select: (data): boolean => toBigInt(data) >= toBigInt(amountToSend?.raw) && false
		}
	});

	/* 🔵 - Yearn Finance **************************************************************************
	 ** On mount, fetch the token list from the tokenlistooor.
	 ** Only the tokens in that list will be displayed.
	 **********************************************************************************************/
	useDeepCompareEffect((): void => {
		const possibleDestinationsTokens: TDict<TToken> = {};
		for (const eachToken of Object.values(currentNetworkTokenList)) {
			if (eachToken.address === ETH_TOKEN_ADDRESS) {
				continue;
			}
			if (eachToken.chainID === safeChainID) {
				possibleDestinationsTokens[toAddress(eachToken.address)] = eachToken;
			}
		}
		set_possibleTokensToUse(possibleDestinationsTokens);
	}, [currentNetworkTokenList, safeChainID]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** On balance or token change, update the balance of the token to use.
	 **********************************************************************************************/
	const balanceOf = useMemo((): TNormalizedBN => {
		if (!tokenToUse) {
			return zeroNormalizedBN;
		}
		return toNormalizedBN(
			getBalance({address: tokenToUse.address, chainID: Number(process.env.DEFAULT_CHAIN_ID)}).raw || 0 || 0,
			tokenToUse.decimals || 18
		);
	}, [tokenToUse, getBalance]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Change the inputed amount when the user types something in the input field.
	 **********************************************************************************************/
	const onChangeAmount = useCallback(
		(e: ChangeEvent<HTMLInputElement>): void => {
			if (!tokenToUse) {
				return;
			}
			const element = document.getElementById('amountToSend') as HTMLInputElement;
			const decimals = tokenToUse.decimals || 18;
			const balance = getBalance({
				address: tokenToUse.address,
				chainID: Number(process.env.DEFAULT_CHAIN_ID)
			});
			let newAmount: TNormalizedBN | undefined = undefined;

			if (e.target.value === '') {
				newAmount = undefined;
				set_amountToSend(newAmount);
			} else {
				const expectedNewValue = handleInputChangeEventValue(e, decimals);
				if (expectedNewValue.raw > toBigInt(balance?.raw)) {
					newAmount = balance;
				} else {
					newAmount = handleInputChangeEventValue(e, decimals);
				}

				if (newAmount.raw > balance.raw) {
					if (element?.value) {
						element.value = formatAmount(balance?.normalized, 0, decimals);
					}
					return set_amountToSend(toNormalizedBN(balance.raw || 0, decimals));
				}
				set_amountToSend(newAmount);
			}
		},
		[tokenToUse, getBalance]
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
			if (
				newAmount.raw >
				getBalance({address: tokenToUse.address, chainID: Number(process.env.DEFAULT_CHAIN_ID)}).raw
			) {
				if (element?.value) {
					element.value = formatAmount(
						getBalance({address: tokenToUse.address, chainID: Number(process.env.DEFAULT_CHAIN_ID)})
							?.normalized,
						0,
						18
					);
				}
				return set_amountToSend(
					toNormalizedBN(
						getBalance({address: tokenToUse.address, chainID: Number(process.env.DEFAULT_CHAIN_ID)}).raw ||
							0,
						tokenToUse.decimals || 18
					)
				);
			}
			set_amountToSend(newAmount);
		},
		[balanceOf, getBalance, tokenToUse]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Web3 action to approve the deposit of a given token and amount.
	 **********************************************************************************************/
	const onApprove = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(toBigInt(amountToSend?.raw) > 0n, 'Amount must be greater than 0');
		assertAddress(tokenToUse?.address, 'Token to use not selected');

		const result = await approveERC20({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: tokenToUse.address,
			spenderAddress: toAddress(process.env.WEIGHT_INCENTIVES_ADDRESS),
			amount: toBigInt(0),
			statusHandler: set_approvalStatus
		});
		if (result.isSuccessful) {
			refetchAllowance();
			await onRefresh([
				ETH_TOKEN,
				{
					decimals: tokenToUse.decimals,
					name: tokenToUse.name,
					symbol: tokenToUse.symbol,
					address: tokenToUse.address,
					chainID: Number(process.env.DEFAULT_CHAIN_ID)
				}
			]);
		}
	}, [amountToSend?.raw, isActive, provider, onRefresh, tokenToUse, refetchAllowance]);

	const onDepositWeightIncentives = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(toBigInt(amountToSend?.raw) > 0n, 'Amount must be greater than 0');
		assertAddress(tokenToUse?.address, 'Token to use not selected');

		const indexOfSelectedLST = [NO_CHANGE_LST_LIKE, ...basket].findIndex(
			({address}): boolean => address === lstToIncentive?.address
		);
		const result = await depositWeightIncentive({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: toAddress(process.env.WEIGHT_INCENTIVES_ADDRESS),
			tokenAsIncentive: tokenToUse.address,
			choice: toBigInt(indexOfSelectedLST),
			amount: toBigInt(amountToSend?.raw),
			statusHandler: set_depositStatus
		});
		if (result.isSuccessful) {
			refetchAllowance();
			refreshIncentives();
			onRefresh([
				ETH_TOKEN,
				{
					decimals: tokenToUse.decimals,
					name: tokenToUse.name,
					symbol: tokenToUse.symbol,
					address: tokenToUse.address,
					chainID: Number(process.env.DEFAULT_CHAIN_ID)
				}
			]);
			set_amountToSend(zeroNormalizedBN);
		}
	}, [
		amountToSend?.raw,
		basket,
		isActive,
		lstToIncentive?.address,
		onRefresh,
		refreshIncentives,
		provider,
		refetchAllowance,
		tokenToUse
	]);

	return (
		<div className={'p-4 md:px-72 md:py-10'}>
			<b className={'text-xl font-black'}>{'Select LST to incentivize '}</b>

			<div className={'mt-4 grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-4 lg:gap-4'}>
				<div>
					<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'Select LST'}</p>
					<ComboboxAddressInput
						shouldDisplayBalance={false}
						isLoading={!isLoaded}
						value={lstToIncentive?.address}
						possibleValues={{
							[zeroAddress]: NO_CHANGE_LST_LIKE,
							...basket.reduce(
								(acc, eachLST): TDict<TToken> => ({
									...acc,
									[eachLST.address]: eachLST
								}),
								{}
							)
						}}
						onChangeValue={set_lstToIncentive}
					/>
					<p className={'hidden pt-1 text-xs lg:block'}>&nbsp;</p>
				</div>

				<div className={'pt-2 md:pt-0'}>
					<p className={'truncate pb-1 text-sm text-neutral-600 md:text-base'}>
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
					<div className={'grow-1 bg-neutral-0 flex h-10 w-full items-center justify-center rounded-md p-2'}>
						<div className={'mr-2 size-6 min-w-[24px]'}>
							<ImageWithFallback
								alt={''}
								unoptimized
								key={tokenToUse?.logoURI || ''}
								src={tokenToUse?.logoURI || ''}
								altSrc={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${tokenToUse?.address}/logo-32.png`}
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
							value={amountToSend === undefined ? '' : amountToSend.normalized}
							onChange={onChangeAmount}
						/>
						<div className={'ml-2 flex flex-row space-x-1'}>
							<button
								type={'button'}
								tabIndex={-1}
								onClick={(): void => updateToPercent(100)}
								className={cl(
									'px-2 py-1 text-xs rounded-md border border-primary transition-colors bg-primary text-white'
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
						onClick={(): unknown => (hasAllowance ? onDepositWeightIncentives() : onApprove())}
						isBusy={hasAllowance ? depositStatus.pending : approvalStatus.pending}
						isDisabled={
							!(hasAllowance ? depositStatus.none : approvalStatus.none) ||
							!props.isIncentivePeriodOpen ||
							toBigInt(amountToSend?.raw) === 0n ||
							toBigInt(amountToSend?.raw) > balanceOf.raw ||
							lstToIncentive === undefined ||
							isZeroAddress(tokenToUse?.address)
						}
						className={'yearn--button w-full rounded-md !text-sm'}>
						{hasAllowance ? 'Submit' : 'Approve'}
					</Button>
					<p className={'pl-2 pt-1 text-xs text-neutral-600'}>&nbsp;</p>
				</div>
			</div>
		</div>
	);
}

function InclusionIncentiveSelector(props: {isIncentivePeriodOpen: boolean}): ReactElement {
	const {address, isActive, provider} = useWeb3();
	const {safeChainID} = useChainID(Number(process.env.DEFAULT_CHAIN_ID));
	const {getBalance, onRefresh} = useWallet();
	const {candidates, isLoaded, refreshIncentives} = useInclusion();
	const {currentNetworkTokenList} = useTokenList();
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN | undefined>(undefined);
	const [possibleTokensToUse, set_possibleTokensToUse] = useState<TDict<TToken | undefined>>({});
	const [lstToIncentive, set_lstToIncentive] = useState<TToken | undefined>();
	const [tokenToUse, set_tokenToUse] = useState<TToken | undefined>();
	const [approvalStatus, set_approvalStatus] = useState<TTxStatus>(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState<TTxStatus>(defaultTxStatus);
	const {data: hasAllowance, refetch: refetchAllowance} = useReadContract({
		abi: erc20Abi,
		address: tokenToUse?.address,
		functionName: 'allowance',
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		args: [toAddress(address), toAddress(process.env.INCLUSION_INCENTIVES_ADDRESS)],
		query: {
			select: (data): boolean => toBigInt(data) >= toBigInt(amountToSend?.raw)
		}
	});

	/* 🔵 - Yearn Finance **************************************************************************
	 ** On mount, fetch the token list from the tokenlistooor.
	 ** Only the tokens in that list will be displayed.
	 **********************************************************************************************/
	useDeepCompareEffect((): void => {
		const possibleDestinationsTokens: TDict<TToken> = {};
		for (const eachToken of Object.values(currentNetworkTokenList)) {
			if (eachToken.address === ETH_TOKEN_ADDRESS) {
				continue;
			}
			if (eachToken.chainID === safeChainID) {
				possibleDestinationsTokens[toAddress(eachToken.address)] = eachToken;
			}
		}
		set_possibleTokensToUse(possibleDestinationsTokens);
	}, [currentNetworkTokenList, safeChainID]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** On balance or token change, update the balance of the token to use.
	 **********************************************************************************************/
	const balanceOf = useMemo((): TNormalizedBN => {
		if (!tokenToUse) {
			return zeroNormalizedBN;
		}
		return toNormalizedBN(
			getBalance({address: tokenToUse.address, chainID: Number(process.env.DEFAULT_CHAIN_ID)}).raw || 0 || 0,
			tokenToUse.decimals || 18
		);
	}, [tokenToUse, getBalance]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Change the inputed amount when the user types something in the input field.
	 **********************************************************************************************/
	const onChangeAmount = useCallback(
		(e: ChangeEvent<HTMLInputElement>): void => {
			if (!tokenToUse) {
				return;
			}
			const element = document.getElementById('amountToSend') as HTMLInputElement;
			const decimals = tokenToUse.decimals || 18;
			const balance = getBalance({
				address: tokenToUse.address,
				chainID: Number(process.env.DEFAULT_CHAIN_ID)
			});
			let newAmount: TNormalizedBN | undefined = undefined;

			if (e.target.value === '') {
				newAmount = undefined;
				set_amountToSend(newAmount);
			} else {
				const expectedNewValue = handleInputChangeEventValue(e, decimals);
				if (expectedNewValue.raw > toBigInt(balance?.raw)) {
					newAmount = balance;
				} else {
					newAmount = handleInputChangeEventValue(e, decimals);
				}

				if (newAmount.raw > balance.raw) {
					if (element?.value) {
						element.value = formatAmount(balance?.normalized, 0, decimals);
					}
					return set_amountToSend(toNormalizedBN(balance.raw || 0, decimals));
				}
				set_amountToSend(newAmount);
			}
		},
		[tokenToUse, getBalance]
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
			if (
				newAmount.raw >
				getBalance({address: tokenToUse.address, chainID: Number(process.env.DEFAULT_CHAIN_ID)}).raw
			) {
				if (element?.value) {
					element.value = formatAmount(
						getBalance({address: tokenToUse.address, chainID: Number(process.env.DEFAULT_CHAIN_ID)})
							?.normalized,
						0,
						18
					);
				}
				return set_amountToSend(
					toNormalizedBN(
						getBalance({address: tokenToUse.address, chainID: Number(process.env.DEFAULT_CHAIN_ID)}).raw ||
							0,
						tokenToUse.decimals || 18
					)
				);
			}
			set_amountToSend(newAmount);
		},
		[balanceOf, getBalance, tokenToUse]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Web3 action to approve the deposit of a given token and amount.
	 **********************************************************************************************/
	const onApprove = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(toBigInt(amountToSend?.raw) > 0n, 'Amount must be greater than 0');
		assertAddress(tokenToUse?.address, 'Token to use not selected');

		const result = await approveERC20({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: tokenToUse.address,
			spenderAddress: toAddress(process.env.INCLUSION_INCENTIVES_ADDRESS),
			amount: toBigInt(amountToSend?.raw),
			statusHandler: set_approvalStatus
		});
		if (result.isSuccessful) {
			refetchAllowance();
			await onRefresh([
				ETH_TOKEN,
				{
					decimals: tokenToUse.decimals,
					name: tokenToUse.name,
					symbol: tokenToUse.symbol,
					address: tokenToUse.address,
					chainID: Number(process.env.DEFAULT_CHAIN_ID)
				}
			]);
		}
	}, [amountToSend?.raw, isActive, provider, onRefresh, tokenToUse, refetchAllowance]);

	const onDepositInclusionIncentives = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(toBigInt(amountToSend?.raw) > 0n, 'Amount must be greater than 0');
		assertAddress(tokenToUse?.address, 'Token to use not selected');
		assert(lstToIncentive, 'LST to incentivize not selected');

		const result = await depositInclusionIncentive({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: toAddress(process.env.INCLUSION_INCENTIVES_ADDRESS),
			tokenAsIncentive: tokenToUse.address,
			choice: lstToIncentive.address,
			amount: toBigInt(amountToSend?.raw),
			statusHandler: set_depositStatus
		});
		if (result.isSuccessful) {
			refetchAllowance();
			refreshIncentives();
			onRefresh([
				ETH_TOKEN,
				{
					decimals: tokenToUse.decimals,
					name: tokenToUse.name,
					symbol: tokenToUse.symbol,
					address: tokenToUse.address,
					chainID: Number(process.env.DEFAULT_CHAIN_ID)
				}
			]);
			set_amountToSend(zeroNormalizedBN);
		}
	}, [
		amountToSend?.raw,
		isActive,
		onRefresh,
		provider,
		refetchAllowance,
		refreshIncentives,
		tokenToUse,
		lstToIncentive
	]);

	return (
		<div className={'p-4 md:px-72 md:py-10'}>
			<b className={'text-xl font-black'}>{'Select LST to incentivize '}</b>

			<div className={'mt-4 grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-4 lg:gap-4'}>
				<div>
					<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'Select LST'}</p>
					<ComboboxAddressInput
						shouldDisplayBalance={false}
						isLoading={!isLoaded}
						value={lstToIncentive?.address}
						possibleValues={{
							[zeroAddress]: NO_CHANGE_LST_LIKE,
							...candidates.reduce(
								(acc, eachLST): TDict<TToken> => ({
									...acc,
									[eachLST.address]: eachLST
								}),
								{}
							)
						}}
						onChangeValue={set_lstToIncentive}
					/>
					<p className={'hidden pt-1 text-xs lg:block'}>&nbsp;</p>
				</div>

				<div className={'pt-2 md:pt-0'}>
					<p className={'truncate pb-1 text-sm text-neutral-600 md:text-base'}>
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
					<div className={'grow-1 bg-neutral-0 flex h-10 w-full items-center justify-center rounded-md p-2'}>
						<div className={'mr-2 size-6 min-w-[24px]'}>
							<ImageWithFallback
								alt={''}
								unoptimized
								key={tokenToUse?.logoURI || ''}
								src={tokenToUse?.logoURI || ''}
								altSrc={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${tokenToUse?.address}/logo-32.png`}
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
									'px-2 py-1 text-xs rounded-md border border-primary transition-colors bg-primary text-white'
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
						onClick={(): unknown => (hasAllowance ? onDepositInclusionIncentives() : onApprove())}
						isBusy={hasAllowance ? depositStatus.pending : approvalStatus.pending}
						isDisabled={
							!(hasAllowance ? depositStatus.none : approvalStatus.none) ||
							!props.isIncentivePeriodOpen ||
							toBigInt(amountToSend?.raw) === 0n ||
							toBigInt(amountToSend?.raw) > balanceOf.raw ||
							lstToIncentive === undefined ||
							isZeroAddress(tokenToUse?.address)
						}
						className={'yearn--button w-full rounded-md !text-sm'}>
						{hasAllowance ? 'Submit' : 'Approve'}
					</Button>
					<p className={'pl-2 pt-1 text-xs text-neutral-600'}>&nbsp;</p>
				</div>
			</div>
		</div>
	);
}

function IncentiveSelector(props: {
	incentivePeriodOpen: {
		isWeightIncentiveOpen: boolean;
		isInclusionIncentiveOpen: boolean;
	};
	currentTab: 'current' | 'potential';
	set_currentTab: (tab: 'current' | 'potential') => void;
}): ReactElement {
	return (
		<div className={'bg-neutral-100 pt-4'}>
			<IncentiveMenuTabs
				currentTab={props.currentTab}
				set_currentTab={props.set_currentTab}
			/>
			{props.currentTab === 'current' ? (
				<WeightIncentiveSelector isIncentivePeriodOpen={props.incentivePeriodOpen.isWeightIncentiveOpen} />
			) : (
				<InclusionIncentiveSelector
					isIncentivePeriodOpen={props.incentivePeriodOpen.isInclusionIncentiveOpen}
				/>
			)}
		</div>
	);
}

export {IncentiveSelector};
