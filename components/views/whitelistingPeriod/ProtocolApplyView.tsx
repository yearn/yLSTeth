import React, {useCallback, useState} from 'react';
import WhitelistTimelineStatus from 'components/WhitelistTimelineStatus';
import useBootstrap from 'contexts/useBootstrap';
import {useWallet} from 'contexts/useWallet';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {parseEther} from 'viem';
import {prepareWriteContract, waitForTransaction, writeContract} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {isZeroAddress, toWagmiAddress} from '@yearn-finance/web-lib/utils/address';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ChangeEvent, FormEvent, ReactElement} from 'react';
import type {BaseError} from 'viem';
import type {VoidPromiseFunction} from '@yearn-finance/web-lib/types';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

type TFormButtonProps = {
	hasApplied: boolean;
	isWhitelisted: boolean;
	isDisabled: boolean;
	isBusy: boolean;
	isErrored: boolean;
	errorMessage?: string;
};
function FormButton({hasApplied, isWhitelisted, isDisabled, isBusy, isErrored, errorMessage}: TFormButtonProps): ReactElement {
	if (hasApplied) {
		return (
			<Button className={'w-full rounded-md !text-sm'} isDisabled>
				{'We already have this LSD in our stash'}
			</Button>
		);
	}
	if (isWhitelisted) {
		return (
			<Button className={'w-full rounded-md !text-sm'} isDisabled>
				{'This LSD is already whitelisted'}
			</Button>
		);
	}
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
			{'Apply'}
		</Button>
	);
}

type TApplyViewProps = {
	onApplied: VoidPromiseFunction;
}
function ApplyView({onApplied}: TApplyViewProps): ReactElement {
	const {hasApplied, isWhitelisted, selectedToken, periods} = useBootstrap();
	const {isActive, provider} = useWeb3();
	const {balances} = useWallet();
	const [selectedCheckboxes, set_selectedCheckboxes] = useState(0);
	const [isExecutingTransaction, set_isExecutingTransaction] = useState<TTxStatus>(defaultTxStatus);
	const [hasClickedFillForm, set_hasClickedFillForm] = useState(false);
	const {whitelistEnd} = periods || {};
	const hasEnded = whitelistEnd?.status === 'success' && (Number(whitelistEnd.result) * 1000) < Date.now();

	const onApply = useCallback(async (): Promise<void> => {
		if (!isActive || !provider || !selectedToken || hasEnded) {
			return;
		}

		try {
			set_isExecutingTransaction({...defaultTxStatus, pending: true});
			const signer = await provider.getWalletClient();
			const chainID = await provider.getChainId();
			const config = await prepareWriteContract({
				address: toWagmiAddress(process.env.BOOTSTRAP_ADDRESS),
				abi: BOOTSTRAP_ABI,
				functionName: 'apply',
				walletClient: signer,
				chainId: chainID,
				value: parseEther('1'),
				args: [toWagmiAddress(selectedToken)]
			});
			const {hash} = await writeContract(config.request);
			await waitForTransaction({chainId: chainID, hash});
			set_isExecutingTransaction({...defaultTxStatus, success: true});
		} catch (error) {
			const errorAsBaseError = error as BaseError;
			console.error(errorAsBaseError);
			set_isExecutingTransaction({
				...defaultTxStatus,
				error: true,
				errorMessage: errorAsBaseError?.shortMessage || ''
			});
			setTimeout((): void => {
				set_isExecutingTransaction({...defaultTxStatus});
			}, 3000);
			onApplied();

		}
	}, [isActive, provider, selectedToken, onApplied, hasEnded]);

	const onSubmitForm = useCallback(async (e: FormEvent<HTMLFormElement>): Promise<void> => {
		e.preventDefault();
		await onApply();
	}, [onApply]);

	const onSelectCheckbox = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
		const {checked: isChecked} = e.target;
		set_selectedCheckboxes((s): number => isChecked ? s + 1 : s - 1);
	}, []);

	return (
		<form onSubmit={onSubmitForm}>
			<div className={'col-span-12 mt-6 rounded border border-neutral-200 bg-neutral-0 px-6 pb-6 pt-4 font-mono'}>
				<div className={'mb-4'}>
					<b className={'font-mono text-sm'}>{'Place your hand on the monitor and repeat after us:'}</b>
				</div>
				<label className={'flex cursor-pointer items-center font-mono text-sm text-neutral-500'}>
					<input
						onChange={onSelectCheckbox}
						required
						type={'checkbox'}
						className={'checkbox mr-2 cursor-pointer'} />
					<p className={'font-mono'}>{'I understand that applying to be whitelisted costs 1 ETH.'}</p>
				</label>
				<label className={'mt-2 flex cursor-pointer items-center font-mono text-sm text-neutral-500'}>
					<input
						onChange={onSelectCheckbox}
						required
						type={'checkbox'}
						className={'checkbox mr-2 cursor-pointer'} />
					<p className={'font-mono'}>{'I understand that this does not guarantee my LSD will be whitelisted.'}</p>
				</label>
				<label className={'mt-2 flex cursor-pointer items-center font-mono text-sm text-neutral-500'}>
					<input
						onChange={onSelectCheckbox}
						required
						type={'checkbox'}
						className={'checkbox mr-2 cursor-pointer'} />
					<p className={'font-mono'}>{'I understand lists of three look more balanced and aesthetic.'}</p>
				</label>
			</div>

			<div className={'mt-6 flex w-full flex-row space-x-4'}>
				<FormButton
					hasApplied={hasApplied}
					isWhitelisted={isWhitelisted}
					isBusy={isExecutingTransaction.pending}
					isErrored={isExecutingTransaction.error}
					errorMessage={isExecutingTransaction.errorMessage}
					isDisabled={
						!isActive ||
						!selectedToken || isZeroAddress(selectedToken) ||
						balances?.[ETH_TOKEN_ADDRESS]?.raw <= parseEther('1') ||
						hasEnded ||
						selectedCheckboxes !== 3 ||
						isExecutingTransaction.success
					} />

				<a
					className={'w-full'}
					href={isExecutingTransaction.success ? 'https://hello-draper.com' : '#'}
					target={'_blank'}
					rel={'noreferrer'}>
					<Button
						type={'button'}
						onClick={(): void => set_hasClickedFillForm(true)}
						isDisabled={!isExecutingTransaction.success}
						className={'w-full rounded-md !text-sm'}>
						{'Fill application form'}
					</Button>
				</a>
			</div>
			<button
				disabled={!hasClickedFillForm}
				onClick={onApplied}
				className={'w-full cursor-pointer pt-4 text-center text-xs text-neutral-400 transition-colors hover:text-neutral-900'}>
				&nbsp;{hasClickedFillForm ? 'I filled the form, show me my application' : ''}&nbsp;
			</button>
		</form>
	);
}

type TProtocolTokenViewProps = {
	onProceed: (args: {hasApplied: boolean, isWhitelisted: boolean}) => void
};
function	ProtocolApplyView({onProceed}: TProtocolTokenViewProps): ReactElement {
	const {selectedToken, updateApplicationStatus} = useBootstrap();
	const onApplied = useCallback(async (): Promise<void> => {
		const {data, isSuccess} = await updateApplicationStatus();
		const [applied, whitelisted] = data || [];
		const hasValidInput = isSuccess && !isZeroAddress(selectedToken);
		const hasApplied = hasValidInput ? applied?.status === 'success' && applied?.result : false;
		const isWhitelisted = hasValidInput ? whitelisted?.status === 'success' && whitelisted?.result : false;
		onProceed({hasApplied, isWhitelisted});
	}, [onProceed, selectedToken, updateApplicationStatus]);

	return (
		<section className={'box-0 relative mx-auto w-full border-neutral-900 p-6 pb-4'}>
			<div className={'w-full md:w-3/4'}>
				<b>{'Ready to whitelist?'}</b>
				<p className={'text-sm text-neutral-500'}>
					{'Whitelisting is easy. All you need to do is pay 1 ETH (as a spam prevention method) and fill out the application form.'}
				</p>
				<WhitelistTimelineStatus />
			</div>

			<ApplyView onApplied={onApplied} />
		</section>
	);
}

export default ProtocolApplyView;
