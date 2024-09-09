import React, {useCallback, useMemo, useState} from 'react';
import assert from 'assert';
import {erc20Abi} from 'viem';
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
import {defaultTxStatus, handleTx} from '@builtbymom/web3/utils/wagmi';
import ComboboxAddressInput from '@libComponents/ComboboxAddressInput';
import {useDeepCompareEffect} from '@react-hookz/web';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {ETH_TOKEN} from '@yUSD/tokens';

import {ImageWithFallback} from '../../../../lib/components/ImageWithFallback';

import type {ChangeEvent, Dispatch, ReactElement, SetStateAction} from 'react';
import type {TDict, TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

const possibleTokenAddressesToUse = [
	'0x83F20F44975D03b1b09e64809B757c47f942BEeA',
	'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
	'0xdAC17F958D2ee523a2206206994597C13D831ec7'
];

const possibleTokenAddressesToVoteFor = [
	'0x6B175474E89094C44Da98b954EedeAC495271d0F',
	'0x83F20F44975D03b1b09e64809B757c47f942BEeA',
	'0xdAC17F958D2ee523a2206206994597C13D831ec7'
];

function DepositSelector({refetchLogs}: {refetchLogs: () => void}): ReactElement {
	const {address, isActive, provider} = useWeb3();
	const {safeChainID} = useChainID(Number(process.env.DEFAULT_CHAIN_ID));
	const {getBalance, onRefresh} = useWallet();
	const {currentNetworkTokenList} = useTokenList();
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN | undefined>(undefined);
	const [possibleTokensToUse, set_possibleTokensToUse] = useState<TDict<TToken | undefined>>({});
	const [possibleTokensToVoteFor, set_possibleTokensToVoteFor] = useState<TDict<TToken | undefined>>({});
	const [tokenToVoteFor, set_tokenToVoteFor] = useState<TToken | undefined>();
	const [tokenToUse, set_tokenToUse] = useState<TToken | undefined>();
	const [approvalStatus, set_approvalStatus] = useState<TTxStatus>(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState<TTxStatus>(defaultTxStatus);
	const {data: allowance, refetch: refetchAllowance} = useReadContract({
		abi: erc20Abi,
		address: tokenToUse?.address,
		functionName: 'allowance',
		chainId: 1,
		args: [toAddress(address), toAddress(process.env.DEPOSIT_ADDRESS)]
	});

	const hasAllowance = toBigInt(allowance) >= toBigInt(amountToSend?.raw);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** On mount, fetch the token list from the tokenlistooor.
	 ** Only the tokens in that list will be displayed.
	 **********************************************************************************************/
	useDeepCompareEffect((): void => {
		const possibleDestinationsTokens: TDict<TToken> = {};
		for (const eachAddress of possibleTokenAddressesToUse) {
			if (eachAddress === ETH_TOKEN_ADDRESS) {
				continue;
			}
			if (currentNetworkTokenList[eachAddress]) {
				possibleDestinationsTokens[toAddress(eachAddress)] = currentNetworkTokenList[eachAddress];
			}
		}
		set_possibleTokensToUse(possibleDestinationsTokens);
	}, [currentNetworkTokenList, safeChainID]);

	useDeepCompareEffect((): void => {
		const possibleTokensToVoteFor: TDict<TToken> = {};
		for (const eachAddress of possibleTokenAddressesToVoteFor) {
			if (eachAddress === ETH_TOKEN_ADDRESS) {
				continue;
			}
			if (currentNetworkTokenList[eachAddress]) {
				possibleTokensToVoteFor[toAddress(eachAddress)] = currentNetworkTokenList[eachAddress];
			}
		}
		set_possibleTokensToVoteFor(possibleTokensToVoteFor);
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
	 ** If it is possible to vote for the selected token, set the token to vote for.
	 **********************************************************************************************/
	const onChangeTokenToUse = useCallback((token: TToken | undefined): void => {
		if (!token) {
			return;
		}
		set_tokenToUse(token);

		if (possibleTokenAddressesToVoteFor.find(address => address === token.address)) {
			set_tokenToVoteFor(token);
		}
	}, []);

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
		assert(amountToSend, 'Amount must be set');
		assert(toBigInt(amountToSend?.raw) > 0n, 'Amount must be greater than 0');
		assertAddress(tokenToUse?.address, 'Token to use not selected');

		// const result = await approveERC20({
		// 	connector: provider,
		// 	chainID: 1,
		// 	contractAddress: tokenToUse.address,
		// 	amount: amountToSend.raw,
		// 	statusHandler: set_approvalStatus,
		// 	spenderAddress: toAddress(process.env.DEPOSIT_ADDRESS)
		// });

		const result = await handleTx(
			{
				connector: provider,
				chainID: 1,
				contractAddress: tokenToUse.address,
				statusHandler: set_approvalStatus
			},
			{
				address: toAddress(tokenToUse.address),
				functionName: 'approve',
				abi: erc20Abi,
				confirmation: 1,
				args: [toAddress(process.env.DEPOSIT_ADDRESS), amountToSend.raw]
			}
		);

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
	}, [
		isActive,
		provider,
		amountToSend,
		tokenToUse?.address,
		tokenToUse?.decimals,
		tokenToUse?.name,
		tokenToUse?.symbol,
		refetchAllowance,
		onRefresh
	]);

	const onDeposit = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(toBigInt(amountToSend?.raw) > 0n, 'Amount must be greater than 0');
		assertAddress(tokenToUse?.address, 'Token to use not selected');

		const result = await handleTx(
			{
				connector: provider,
				chainID: 1,
				contractAddress: toAddress(process.env.DEPOSIT_ADDRESS),
				statusHandler: set_depositStatus
			},
			{
				address: toAddress(process.env.DEPOSIT_ADDRESS),
				functionName: 'deposit',
				abi: [
					{
						stateMutability: 'nonpayable',
						type: 'function',
						name: 'deposit',
						inputs: [
							{name: '_asset', type: 'address'},
							{name: '_amount', type: 'uint256'},
							{name: '_vote', type: 'address'}
						],
						outputs: [{name: '', type: 'uint256'}]
					}
				],
				confirmation: 1,
				args: [toAddress(tokenToUse.address), toBigInt(amountToSend?.raw), toAddress(tokenToVoteFor?.address)]
			}
		);
		if (result.isSuccessful) {
			refetchAllowance();
			refetchLogs();
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
		isActive,
		provider,
		amountToSend?.raw,
		tokenToUse?.address,
		tokenToUse?.decimals,
		tokenToUse?.name,
		tokenToUse?.symbol,
		tokenToVoteFor?.address,
		refetchAllowance,
		refetchLogs,
		onRefresh
	]);

	return (
		<div className={'mt-4 grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-4 lg:gap-4'}>
			<div className={'pt-2 md:pt-0'}>
				<p className={'truncate pb-1 text-sm text-neutral-600 md:text-base'}>{'Token you deposit'}</p>
				<ComboboxAddressInput
					value={tokenToUse?.address}
					possibleValues={possibleTokensToUse}
					onAddValue={set_possibleTokensToUse}
					onChangeValue={onChangeTokenToUse as Dispatch<SetStateAction<TToken | undefined>>}
					buttonClassName={'border border-neutral-500'}
				/>
				<p className={'hidden pt-1 text-xs lg:block'}>&nbsp;</p>
			</div>

			<div className={'pt-2 md:pt-0'}>
				<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'Amount'}</p>
				<div
					className={
						'grow-1 bg-neutral-0 flex h-10 w-full items-center justify-center rounded-md border border-neutral-500 p-2'
					}>
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
								'px-2 py-1 text-xs rounded-md border border-accent transition-colors text-accent'
							)}>
							{'MAX'}
						</button>
					</div>
				</div>
				<small
					suppressHydrationWarning
					className={'pl-2 pt-1 text-xs text-neutral-600'}>
					{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${tokenToUse?.symbol || '-'}`}
				</small>
			</div>

			<div>
				<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'Token you vote for'}</p>
				<ComboboxAddressInput
					shouldDisplayBalance={false}
					// isLoading={!isLoaded}
					value={tokenToVoteFor?.address}
					buttonClassName={'border border-neutral-500'}
					possibleValues={possibleTokensToVoteFor}
					onChangeValue={set_tokenToVoteFor}
				/>
				<p className={'hidden pt-1 text-xs lg:block'}>&nbsp;</p>
			</div>

			<div className={'w-full pt-4 md:pt-0'}>
				<p className={'hidden pb-1 text-neutral-600 md:block'}>&nbsp;</p>
				<Button
					onClick={(): unknown => (hasAllowance ? onDeposit() : onApprove())}
					isBusy={hasAllowance ? depositStatus.pending : approvalStatus.pending}
					isDisabled={
						!(hasAllowance ? depositStatus.none : approvalStatus.none) ||
						toBigInt(amountToSend?.raw) === 0n ||
						toBigInt(amountToSend?.raw) > balanceOf.raw ||
						tokenToVoteFor === undefined ||
						isZeroAddress(tokenToUse?.address)
					}
					className={'yearn--button w-full rounded-md !text-sm'}>
					{hasAllowance ? 'Deposit' : 'Approve'}
				</Button>
				<p className={'pl-2 pt-1 text-xs text-neutral-600'}>&nbsp;</p>
			</div>
		</div>
	);
}

export {DepositSelector};