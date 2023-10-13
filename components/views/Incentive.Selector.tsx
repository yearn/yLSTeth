import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/router';
import assert from 'assert';
import ComboboxAddressInput from 'components/common/ComboboxAddressInput';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import useLST from 'contexts/useLST';
import {useTokenList} from 'contexts/useTokenList';
import {useWallet} from 'contexts/useWallet';
import {handleInputChangeEventValue, isValidAddress} from 'utils';
import {approveERC20, depositIncentive} from 'utils/actions';
import {NO_CHANGE_LST_LIKE} from 'utils/constants';
import {getCurrentEpoch} from 'utils/epochs';
import {ETH_TOKEN} from 'utils/tokens';
import {zeroAddress} from 'viem';
import {erc20ABI, useContractRead} from 'wagmi';
import {useDeepCompareEffect} from '@react-hookz/web';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {isZeroAddress, toAddress} from '@yearn-finance/web-lib/utils/address';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {assertAddress} from '@yearn-finance/web-lib/utils/wagmi/utils';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {ChangeEvent, ReactElement} from 'react';
import type {TIndexedTokenInfo} from 'utils/types';
import type {TDict} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

function IncentiveMenuTabs({set_currentTab, currentTab}: {
	currentTab: 'current' | 'potential';
	set_currentTab: (tab: 'current' | 'potential') => void;
}): ReactElement {
	const router = useRouter();

	useEffect((): void => {
		const urlParams = new URLSearchParams(window.location.search);
		const action = urlParams.get('action');

		if (action === 'current' || action === 'potential') {
			set_currentTab(action);
		} else if (router.query?.action === 'current' || router.query?.action === 'potential') {
			set_currentTab(router.query.action);
		}
	}, [set_currentTab, router.query]);


	return (
		<div className={'overflow-hidden'}>
			<div className={'relative -mx-4 px-4 md:px-72 '}>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {action: 'current'}});
					}}
					className={cl('mx-4 mb-2 text-lg transition-colors', currentTab === 'current' ? 'text-purple-300 font-bold' : 'text-neutral-400')}>
					{'Weight votes'}
				</button>
				<button
					onClick={(): void => {
						router.push({pathname: router.pathname, query: {action: 'potential'}});
					}}
					className={cl('mx-4 mb-2 text-lg transition-colors', currentTab === 'potential' ? 'text-purple-300 font-bold' : 'text-neutral-400')}>
					{'Inclusion votes'}
				</button>
				<div className={'absolute bottom-0 left-0 flex h-0.5 w-full flex-row bg-neutral-300 px-4 md:px-72'}>
					<div className={cl('h-full w-fit transition-colors ml-4', currentTab === 'current' ? 'bg-purple-300' : 'bg-transparent')}>
						<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>{'Weight votes'}</button>
					</div>
					<div className={cl('h-full w-fit transition-colors ml-4', currentTab === 'potential' ? 'bg-purple-300' : 'bg-transparent')}>
						<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>{'Inclusion votes'}</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function IncentiveSelector({isIncentivePeriodClosed, possibleLSTs, currentTab, set_currentTab}: {
	isIncentivePeriodClosed: boolean;
	possibleLSTs: TDict<TIndexedTokenInfo>;
	currentTab: 'current' | 'potential';
	set_currentTab: (tab: 'current' | 'potential') => void;
}): ReactElement {
	const {address, isActive, provider} = useWeb3();
	const {safeChainID} = useChainID(Number(process.env.BASE_CHAIN_ID));
	const {balances, refresh} = useWallet();
	const {tokenList} = useTokenList();
	const {incentives: {refreshIncentives}} = useLST();
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [possibleTokensToUse, set_possibleTokensToUse] = useState<TDict<TTokenInfo | undefined>>({});
	const [lstToIncentive, set_lstToIncentive] = useState<TTokenInfo | undefined>();
	const [tokenToUse, set_tokenToUse] = useState<TTokenInfo | undefined>();
	const [approvalStatus, set_approvalStatus] = useState<TTxStatus>(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState<TTxStatus>(defaultTxStatus);

	const {data: allowanceOf, refetch: refetchAllowance} = useContractRead({
		abi: erc20ABI,
		address: tokenToUse?.address,
		functionName: 'allowance',
		args: [toAddress(address), toAddress(process.env.VOTE_ADDRESS)]
	});

	/* 🔵 - Yearn Finance **************************************************************************
	** On mount, fetch the token list from the tokenlistooor.
	** Only the tokens in that list will be displayed.
	**********************************************************************************************/
	useDeepCompareEffect((): void => {
		const possibleDestinationsTokens: TDict<TTokenInfo> = {};
		for (const eachToken of Object.values(tokenList)) {
			if (eachToken.address === ETH_TOKEN_ADDRESS) {
				continue;
			}
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
			return toNormalizedBN(0);
		}
		return toNormalizedBN((balances?.[tokenToUse.address]?.raw || 0) || 0, tokenToUse.decimals || 18);
	}, [balances, tokenToUse]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Change the inputed amount when the user types something in the input field.
	**********************************************************************************************/
	const onChangeAmount = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
		if (!tokenToUse) {
			return;
		}
		const element = document.getElementById('amountToSend') as HTMLInputElement;
		const newAmount = handleInputChangeEventValue(e, tokenToUse?.decimals || 18);
		if (newAmount.raw > balances?.[tokenToUse.address]?.raw) {
			if (element?.value) {
				element.value = formatAmount(balances?.[tokenToUse.address]?.normalized, 0, 18);
			}
			return set_amountToSend(toNormalizedBN(
				balances?.[tokenToUse.address]?.raw || 0,
				tokenToUse.decimals || 18
			));
		}
		set_amountToSend(newAmount);
	}, [balances, tokenToUse]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Change the inputed amount when the user select a percentage to set.
	**********************************************************************************************/
	const updateToPercent = useCallback((percent: number): void => {
		if (!tokenToUse) {
			return;
		}
		const element = document.getElementById('amountToSend') as HTMLInputElement;
		const newAmount = toNormalizedBN(
			(balanceOf.raw * BigInt(percent)) / 100n,
			tokenToUse.decimals || 18
		);
		if (newAmount.raw > balances?.[tokenToUse.address]?.raw) {
			if (element?.value) {
				element.value = formatAmount(
					balances?.[tokenToUse.address]?.normalized, 0, 18);
			}
			return set_amountToSend(toNormalizedBN(
				balances?.[tokenToUse.address]?.raw || 0,
				tokenToUse.decimals || 18
			));
		}
		set_amountToSend(newAmount);
	}, [balanceOf, balances, tokenToUse]);

	/* 🔵 - Yearn Finance **************************************************************************
	** View function to check if the user has enough allowance for the token/amount to send.
	**********************************************************************************************/
	const hasAllowance = useMemo((): boolean => {
		return (toBigInt(allowanceOf) >= amountToSend.raw);
	}, [allowanceOf, amountToSend.raw]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Web3 action to approve the deposit of a given token and amount.
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
			spenderAddress: toAddress(process.env.VOTE_ADDRESS),
			amount: amountToSend.raw,
			statusHandler: set_approvalStatus
		});
		if (result.isSuccessful) {
			refetchAllowance();
			await refresh([
				{...ETH_TOKEN, token: ETH_TOKEN.address},
				{
					decimals: tokenToUse.decimals,
					name: tokenToUse.name,
					symbol: tokenToUse.symbol,
					token: tokenToUse.address
				}
			]);
		}
	}, [amountToSend.raw, isActive, provider, refresh, tokenToUse, refetchAllowance]);


	/* 🔵 - Yearn Finance **************************************************************************
	** Web3 action to incentivize a given protocol with a given token and amount.
	**********************************************************************************************/
	const onDepositIncentive = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(amountToSend.raw > 0n, 'Amount must be greater than 0');
		assertAddress(tokenToUse?.address, 'Token to use not selected');

		const currentEpochData = getCurrentEpoch();
		const voteID = currentTab === 'current' ? currentEpochData.weight.id : currentEpochData.inclusion.id;
		const possibleLST = currentTab === 'current' ? currentEpochData.weight.participants : currentEpochData.inclusion.candidates;
		const indexOfSelectedLST = possibleLST.findIndex((eachLST): boolean => eachLST?.address === lstToIncentive?.address);
		if (!isZeroAddress(lstToIncentive?.address)) {
			assert(indexOfSelectedLST !== -1, 'Selected LST not found in possible LSTs');
		}

		const result = await depositIncentive({
			connector: provider,
			chainID: Number(process.env.BASE_CHAIN_ID),
			contractAddress: toAddress(process.env.VOTE_ADDRESS),
			tokenAsIncentive: tokenToUse.address,
			vote: voteID,
			// Choice is between 1 and X options, where 1 is "Do Nothing / No Change".
			// The options are selected by the index in the array of possible LSTs.
			// As do nothing is not in the array, we need to add 2 to the index to get the correct choice.
			// Aka, array starting at 0 (so +1 to get 1st option), and +1 again to skip the "Do Nothing" option.
			choice: isZeroAddress(lstToIncentive?.address) ? 1n : toBigInt(indexOfSelectedLST) + 2n,
			amount: amountToSend.raw,
			statusHandler: set_depositStatus
		});
		if (result.isSuccessful) {
			refetchAllowance();
			await Promise.all([
				refreshIncentives(),
				refresh([
					{...ETH_TOKEN, token: ETH_TOKEN.address},
					{
						decimals: tokenToUse.decimals,
						name: tokenToUse.name,
						symbol: tokenToUse.symbol,
						token: tokenToUse.address
					}
				])
			]);
			set_amountToSend(toNormalizedBN(0));

		}
	}, [isActive, provider, amountToSend.raw, tokenToUse?.address, tokenToUse?.decimals, tokenToUse?.name, tokenToUse?.symbol, currentTab, lstToIncentive?.address, refetchAllowance, refreshIncentives, refresh]);

	return (
		<div className={'bg-neutral-100 pt-4'}>
			<IncentiveMenuTabs
				currentTab={currentTab}
				set_currentTab={set_currentTab} />
			<div className={'p-4 md:px-72 md:py-10'}>
				<b className={'text-xl font-black'}>{'Select LST to incentivize '}</b>

				<div className={'mt-4 grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-4 lg:gap-4'}>
					<div>
						<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'Select LST'}</p>
						<ComboboxAddressInput
							shouldDisplayBalance={false}
							value={lstToIncentive?.address}
							possibleValues={{[zeroAddress]: NO_CHANGE_LST_LIKE, ...possibleLSTs}}
							onChangeValue={set_lstToIncentive} />
						<p className={'hidden pt-1 text-xs lg:block'}>&nbsp;</p>
					</div>

					<div className={'pt-2 md:pt-0'}>
						<p className={'truncate pb-1 text-sm text-neutral-600 md:text-base'}>{'Select token to incentivize with'}</p>
						<ComboboxAddressInput
							value={tokenToUse?.address}
							possibleValues={possibleTokensToUse}
							onAddValue={set_possibleTokensToUse}
							onChangeValue={set_tokenToUse} />
						<p className={'hidden pt-1 text-xs lg:block'}>&nbsp;</p>
					</div>

					<div className={'pt-2 md:pt-0'}>
						<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'Amount'}</p>
						<div className={'grow-1 flex h-10 w-full items-center justify-center rounded-md bg-neutral-0 p-2'}>
							<div className={'mr-2 h-6 w-6 min-w-[24px]'}>
								<ImageWithFallback
									alt={''}
									unoptimized
									key={tokenToUse?.logoURI || ''}
									src={tokenToUse?.logoURI || ''}
									width={24}
									height={24} />
							</div>
							<input
								id={'amountToSend'}
								className={'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none scrollbar-none'}
								type={'number'}
								min={0}
								maxLength={20}
								max={balanceOf?.normalized || 0}
								step={1 / 10 ** (tokenToUse?.decimals || 18)}
								inputMode={'numeric'}
								placeholder={'0'}
								pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
								value={amountToSend?.normalized || ''}
								onChange={onChangeAmount} />
							<div className={'ml-2 flex flex-row space-x-1'}>
								<button
									type={'button'}
									tabIndex={-1}
									onClick={(): void => updateToPercent(100)}
									className={cl('px-2 py-1 text-xs rounded-md border border-purple-300 transition-colors bg-purple-300 text-white')}>
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
							onClick={(): unknown => hasAllowance ? onDepositIncentive() : onApprove()}
							isBusy={hasAllowance ? depositStatus.pending : approvalStatus.pending}
							isDisabled={
								!(hasAllowance ? depositStatus.none : approvalStatus.none)
									|| isIncentivePeriodClosed
									|| amountToSend.raw === 0n
									|| amountToSend.raw > balanceOf.raw
									|| !(isValidAddress(lstToIncentive?.address) || isZeroAddress(lstToIncentive?.address))
									|| !isValidAddress(tokenToUse?.address)
							}
							className={'yearn--button w-full rounded-md !text-sm'}>
							{hasAllowance ? 'Submit' : 'Approve'}
						</Button>
						<p className={'pl-2 pt-1 text-xs text-neutral-600'}>&nbsp;</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export {IncentiveSelector};
