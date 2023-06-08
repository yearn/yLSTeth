import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useWallet} from 'contexts/useWallet';
import {handleInputChangeEventValue} from 'utils';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {ETH_TOKEN, FTM_TOKEN} from 'utils/tokens';
import {prepareWriteContract, waitForTransaction, writeContract} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {yToast} from '@yearn-finance/web-lib/components/yToast';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {ChangeEvent, FormEvent, ReactElement} from 'react';
import type {BaseError} from 'viem';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

type TFormButtonProps = {
	isDisabled: boolean;
	isBusy: boolean;
	isErrored: boolean;
	errorMessage?: string;
};
function FormButton({isDisabled, isBusy, isErrored, errorMessage}: TFormButtonProps): ReactElement {
	if (isErrored) {
		return (
			<Button
				variant={'error'}
				className={'w-full rounded-md !text-sm'}
				isDisabled>
				{errorMessage || 'Something went wrong'}
			</Button>
		);
	}
	return (
		<Button
			className={'w-full rounded-md !text-sm'}
			isDisabled={isDisabled}
			isBusy={isBusy}>
			{'Lock it up!'}
		</Button>
	);
}

function DepositView(): ReactElement {
	const {isActive, provider} = useWeb3();
	const {balances} = useWallet();
	const {safeChainID} = useChainID(Number(process.env.DEFAULT_CHAINID));
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [tokenToSend, set_tokenToSend] = useState<TTokenInfo>(ETH_TOKEN);
	const [isExecutingTransaction, set_isExecutingTransaction] = useState<TTxStatus>(defaultTxStatus);
	const	{toast} = yToast();

	useEffect((): void => {
		set_tokenToSend(safeChainID === 250 ? FTM_TOKEN : ETH_TOKEN);
	}, [safeChainID]);

	const balanceOf = useMemo((): TNormalizedBN => {
		return toNormalizedBN((balances?.[tokenToSend.address]?.raw || 0) || 0);
	}, [balances, tokenToSend.address]);

	const safeMaxValue = useMemo((): TNormalizedBN => {
		return toNormalizedBN(((balances?.[tokenToSend.address]?.raw || 0n) * 9n / 10n) || 0);
	}, [balances, tokenToSend.address]);

	const onDeposit = useCallback(async (): Promise<void> => {
		if (!isActive || !provider) {
			return;
		}

		try {
			set_isExecutingTransaction({...defaultTxStatus, pending: true});
			const signer = await provider.getWalletClient();
			const chainID = await provider.getChainId();
			const config = await prepareWriteContract({
				address: toAddress(process.env.BOOTSTRAP_ADDRESS),
				abi: BOOTSTRAP_ABI,
				functionName: 'deposit',
				walletClient: signer,
				chainId: chainID,
				value: amountToSend.raw
			});
			const {hash} = await writeContract(config.request);
			await waitForTransaction({chainId: chainID, hash});
			performBatchedUpdates((): void => {
				set_amountToSend(toNormalizedBN(0));
				set_isExecutingTransaction({...defaultTxStatus, success: true});
			});
		} catch (error) {
			const errorAsBaseError = error as BaseError;
			console.error(errorAsBaseError);
			toast({
				type: 'error',
				content: errorAsBaseError?.shortMessage || 'Impossible to submit transaction.'
			});
			set_isExecutingTransaction({
				...defaultTxStatus,
				error: true,
				errorMessage: errorAsBaseError?.shortMessage || ''
			});
		} finally {
			setTimeout((): void => {
				set_isExecutingTransaction({...defaultTxStatus});
			}, 3000);
		}

	}, [amountToSend.raw, isActive, provider, toast]);

	const onChangeAmount = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
		const element = document.getElementById('amountToSend') as HTMLInputElement;
		const newAmount = handleInputChangeEventValue(e, tokenToSend?.decimals || 18);
		if (newAmount.raw > balances?.[tokenToSend.address]?.raw) {
			if (element?.value) {
				element.value = formatAmount(balances?.[tokenToSend.address]?.normalized, 0, 18);
			}
			return set_amountToSend(toNormalizedBN(balances?.[tokenToSend.address]?.raw || 0));
		}
		set_amountToSend(newAmount);
	}, [balances, tokenToSend.address, tokenToSend?.decimals]);

	const onSubmitForm = useCallback(async (e: FormEvent<HTMLFormElement>): Promise<void> => {
		e.preventDefault();
		await onDeposit();
	}, [onDeposit]);

	return (
		<section>
			<div className={'box-0 grid w-full grid-cols-12'}>
				<div className={'col-span-12 flex flex-col p-4 text-neutral-900 md:p-6'}>
					<div className={'w-full md:w-3/4'}>
						<b>{'Deposit'}</b>
						<p className={'text-sm text-neutral-500'}>
							{'How now you ready? You can deposit your ETHs to the pool and get some st-yETH. Funny story, it is locked for 16 weeks.'}
						</p>
					</div>
					<div className={'mt-6'}>
						<form
							onSubmit={onSubmitForm}
							className={'grid w-full grid-cols-12 flex-row items-start justify-between gap-4 md:gap-6'}>
							<div className={'col-span-12 md:col-span-9'}>
								<div className={'box-0 grow-1 flex h-10 w-full items-center p-2'}>
									<input
										id={'amountToSend'}
										className={'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm font-bold outline-none scrollbar-none'}
										type={'number'}
										min={0}
										maxLength={20}
										max={safeMaxValue?.normalized || 0}
										step={1 / 10 ** (tokenToSend?.decimals || 18)}
										inputMode={'numeric'}
										placeholder={'0'}
										pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
										value={amountToSend?.normalized || ''}
										onChange={onChangeAmount} />
								</div>

								<div className={'flex items-center justify-between pt-1'}>
									<span className={'tooltip'}>
										<p
											suppressHydrationWarning
											className={'font-number text-xxs text-neutral-400'}>
											{`You have ${formatAmount(safeMaxValue?.normalized || 0, 2, 6)} ${tokenToSend.symbol}`}
										</p>
										<span className={'tooltiptextBig z-[100000] text-xs'}>
											<p suppressHydrationWarning>{`You actually have ${formatAmount(balanceOf.normalized, 2, 6)} ${tokenToSend.symbol}, but to ensure you have enough gas, we are using a safe value of 90% of your balance.`}</p>
										</span>
									</span>
									<div className={'flex space-x-2'}>
										<button
											type={'button'}
											className={'font-number text-xxs text-neutral-400 transition-colors hover:text-neutral-900'}
											onClick={(): void => {
												set_amountToSend(toNormalizedBN(((balanceOf?.raw || 0n) / 4n) || 0));
											}}>
											{'25%'}
										</button>
										<p className={'font-number text-xxs text-neutral-400'}>{' / '}</p>
										<button
											type={'button'}
											className={'font-number text-xxs text-neutral-400 transition-colors hover:text-neutral-900'}
											onClick={(): void => {
												set_amountToSend(toNormalizedBN(((balanceOf?.raw || 0n) / 2n) || 0));
											}}>
											{'50%'}
										</button>
										<p className={'font-number text-xxs text-neutral-400'}>{' / '}</p>
										<button
											type={'button'}
											className={'font-number text-xxs text-neutral-400 transition-colors hover:text-neutral-900'}
											onClick={(): void => {
												set_amountToSend(toNormalizedBN(((balanceOf?.raw || 0n) * 3n / 4n) || 0));
											}}>
											{'75%'}
										</button>
										<p className={'font-number text-xxs text-neutral-400'}>{' / '}</p>
										<button
											type={'button'}
											className={'font-number text-xxs text-neutral-400 transition-colors hover:text-neutral-900'}
											onClick={(): void => set_amountToSend(safeMaxValue)}>
											{'max'}
										</button>
									</div>
								</div>
							</div>

							<div className={'col-span-12 md:col-span-3'}>
								<FormButton
									isErrored={isExecutingTransaction.error}
									errorMessage={isExecutingTransaction.errorMessage}
									isBusy={isExecutingTransaction.pending}
									isDisabled={
										!isActive || !provider ||
										!amountToSend?.raw || amountToSend?.raw === 0n ||
										amountToSend?.raw >= balances?.[tokenToSend.address]?.raw
									} />
							</div>
						</form>
					</div>
				</div>
			</div>
		</section>
	);
}

export default DepositView;
