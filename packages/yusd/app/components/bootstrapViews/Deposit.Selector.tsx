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
import {approveERC20, defaultTxStatus, handleTx, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import ComboboxAddressInput from '@libComponents/ComboboxAddressInput';
import {ImageWithFallback} from '@libComponents/ImageWithFallback';
import {useDeepCompareEffect} from '@react-hookz/web';
import {waitForTransactionReceipt} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {ETH_TOKEN} from '@yUSD/tokens';
import {possibleTokenAddressesToUse, possibleTokensToVoteFor} from '@yUSD/utils/constants';

import type {ChangeEvent, Dispatch, ReactElement, SetStateAction} from 'react';
import type {TDict, TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

/************************************************************************************************
 ** DepositSelector: Component for selecting and depositing tokens
 ** - Allows users to choose a token to deposit and vote for
 ** - Handles token approval and deposit transactions
 ** - Updates balances and logs after successful transactions
 ** @param {Object} props - Component props
 ** @param {Function} props.refetchLogs - Function to refetch logs after a deposit
 ** @returns {ReactElement} The rendered DepositSelector component
 ************************************************************************************************/
function DepositSelector({refetchLogs}: {refetchLogs: () => void}): ReactElement {
	const {address, isActive, provider} = useWeb3();
	const {safeChainID} = useChainID(Number(process.env.DEFAULT_CHAIN_ID));
	const {getBalance, onRefresh} = useWallet();
	const {currentNetworkTokenList} = useTokenList();
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN | undefined>(undefined);
	const [possibleTokensToUse, set_possibleTokensToUse] = useState<TDict<TToken | undefined>>({});
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

	/************************************************************************************************
	 ** useDeepCompareEffect: Fetches and sets possible tokens to use
	 ** - Filters tokens from the current network token list
	 ** - Updates the possibleTokensToUse state
	 ************************************************************************************************/
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

	/************************************************************************************************
	 ** balanceOf: Memoized balance of the selected token
	 ** - Updates when tokenToUse or getBalance changes
	 ** @returns {TNormalizedBN} The normalized balance of the selected token
	 ************************************************************************************************/
	const balanceOf = useMemo((): TNormalizedBN => {
		if (!tokenToUse) {
			return zeroNormalizedBN;
		}
		return toNormalizedBN(
			getBalance({address: tokenToUse.address, chainID: Number(process.env.DEFAULT_CHAIN_ID)}).raw || 0 || 0,
			tokenToUse.decimals || 18
		);
	}, [tokenToUse, getBalance]);

	/************************************************************************************************
	 ** onChangeTokenToUse: Handles token selection change
	 ** - Updates tokenToUse state with the selected token
	 ** - Sets tokenToVoteFor to the selected token if it's in possibleTokensToVoteFor, otherwise undefined
	 ** - Ensures consistency between deposit token and voting token selection
	 ** @param {TToken | undefined} selectedToken - The newly selected token for deposit
	 ************************************************************************************************/
	const onChangeTokenToUse = useCallback((selectedToken: TToken | undefined): void => {
		if (!selectedToken) {
			return;
		}
		const isTokenVotable = Object.values(possibleTokensToVoteFor).some(t => t.address === selectedToken.address);
		set_tokenToUse(selectedToken);
		set_tokenToVoteFor(isTokenVotable ? selectedToken : undefined);
	}, []);

	/************************************************************************************************
	 ** onChangeAmount: Handles amount input changes
	 ** - Updates amountToSend state based on user input
	 ** - Validates input against token balance
	 ** @param {ChangeEvent<HTMLInputElement>} e - The input change event
	 ************************************************************************************************/
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

	/************************************************************************************************
	 ** updateToPercent: Updates amount based on percentage of balance
	 ** - Calculates new amount based on given percentage
	 ** - Updates amountToSend state
	 ** @param {number} percent - The percentage to set
	 ************************************************************************************************/
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

	/************************************************************************************************
	 ** onApprove: Handles token approval transaction
	 ** - Approves the deposit contract to spend tokens
	 ** - Updates approval status and refreshes allowance
	 ************************************************************************************************/
	const onApprove = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(amountToSend, 'Amount must be set');
		assert(toBigInt(amountToSend?.raw) > 0n, 'Amount must be greater than 0');
		assertAddress(tokenToUse?.address, 'Token to use not selected');

		const result = await approveERC20({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: toAddress(tokenToUse.address),
			spenderAddress: toAddress(process.env.DEPOSIT_ADDRESS),
			amount: amountToSend.raw,
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

	/************************************************************************************************
	 ** onDeposit: Handles token deposit transaction
	 ** - Deposits tokens and updates vote
	 ** - Refreshes allowance, logs, and balances on success
	 ************************************************************************************************/
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

		if (result.isSuccessful && result.receipt?.transactionHash) {
			const receipt = await waitForTransactionReceipt(retrieveConfig(), {
				hash: result.receipt?.transactionHash,
				confirmations: 1
			});
			if (receipt.status === 'success') {
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
					buttonClassName={'border border-neutral-500 rounded-sm'}
				/>
				<p className={'hidden pt-1 text-xs lg:block'}>&nbsp;</p>
			</div>

			<div className={'pt-2 md:pt-0'}>
				<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'Amount'}</p>
				<div
					className={
						'grow-1 bg-neutral-0 flex h-10 w-full items-center justify-center rounded-sm border border-neutral-500 p-2'
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
							'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none '
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
					buttonClassName={'border border-neutral-500 rounded-sm'}
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
