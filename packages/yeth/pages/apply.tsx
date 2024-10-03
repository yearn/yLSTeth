import React, {useCallback, useMemo, useState} from 'react';
import assert from 'assert';
import {erc20Abi} from 'viem';
import {useReadContract} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount, isZeroAddress, toAddress, toNormalizedBN} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {INCLUSION_ABI} from '@libAbi/inclusion.abi';
import {useTimer} from '@libHooks/useTimer';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {apply} from '@yETH/actions';
import useBasket from '@yETH/contexts/useBasket';
import {useEpoch} from '@yETH/hooks/useEpoch';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

function Timer(): ReactElement {
	const {voteStart, endPeriod, hasVotingStarted} = useEpoch();
	const time = useTimer({endTime: hasVotingStarted ? Number(endPeriod) : Number(voteStart)});

	return (
		<b
			suppressHydrationWarning
			className={'font-number mt-2 text-3xl leading-10 text-purple-300'}>
			{hasVotingStarted ? `Open in ${time}` : `${time}`}
		</b>
	);
}

function CheckboxElement({onChange, content}: {onChange: () => void; content: string}): ReactElement {
	return (
		<label className={'flex cursor-pointer items-start'}>
			<input
				required
				onChange={onChange}
				type={'checkbox'}
				className={
					'bg-neutral-0 mr-4 mt-2 size-6 cursor-pointer rounded-sm border-2 border-purple-300 text-purple-300 indeterminate:ring-2 focus:bg-neutral-200 focus:ring-2 focus:ring-purple-300 focus:ring-offset-neutral-100'
				}
			/>
			<p className={'text-base text-neutral-700'}>{content}</p>
		</label>
	);
}

function Form(): ReactElement {
	const {address, isActive, provider} = useWeb3();
	const {getBalance} = useWallet();
	const {basket} = useBasket();
	const [lstAddress, set_lstAddress] = useState<TAddress | undefined>(undefined);
	const [isValid, set_isValid] = useState(false);
	const [approveStatus, set_approveStatus] = useState<TTxStatus>(defaultTxStatus);
	const [submitStatus, set_submitStatus] = useState<TTxStatus>(defaultTxStatus);
	const yETHBalance = useMemo(
		() => getBalance({address: toAddress(process.env.YETH_ADDRESS), chainID: Number(process.env.DEFAULT_CHAIN_ID)}),
		[getBalance, address] // eslint-disable-line react-hooks/exhaustive-deps
	);

	/**************************************************************************
	 * Check if the form is valid to eventually enable the submit button or
	 * simply trigger the default error tooltip.
	 *************************************************************************/
	function onCheckValidity(): void {
		const form = document.getElementById('apply-form') as HTMLFormElement;
		if (form) {
			set_isValid(form.checkValidity());
		}
	}

	/**************************************************************************
	 * Check onChain if the LST address has already applied for inclusion
	 *************************************************************************/
	const {data: hasAlreadyApplied, refetch: refreshAlreadyApplied} = useReadContract({
		address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
		abi: INCLUSION_ABI,
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		functionName: 'has_applied',
		args: [toAddress(lstAddress)],
		query: {
			enabled: !isZeroAddress(lstAddress)
		}
	});

	const basketAddresses = useMemo(() => basket.map(({address}) => toAddress(address)), [basket]);
	const isAlreadyInBasket = useMemo(
		() => basketAddresses.includes(toAddress(lstAddress)),
		[basketAddresses, lstAddress]
	);

	/**************************************************************************
	 * Retrieve the application fee for the LST address.
	 *************************************************************************/
	const {data: feeForApplication} = useReadContract({
		address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
		abi: INCLUSION_ABI,
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		functionName: 'application_fee',
		args: [toAddress(lstAddress)],
		query: {
			enabled: !isZeroAddress(lstAddress),
			select(value) {
				return toNormalizedBN(value, 18);
			}
		}
	});

	/**************************************************************************
	 * Check if the user has already approved the inclusion vote contract to
	 * spend the appropriate amount of LST.
	 *************************************************************************/
	const {data: hasAllowance, refetch: refetchAllowance} = useReadContract({
		abi: erc20Abi,
		address: toAddress(process.env.YETH_ADDRESS),
		functionName: 'allowance',
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		args: [toAddress(address), toAddress(process.env.INCLUSION_VOTE_ADDRESS)],
		query: {
			enabled: !isZeroAddress(address),
			select(allowance) {
				if (!feeForApplication) {
					return false;
				}
				return allowance >= feeForApplication?.raw;
			}
		}
	});

	/**************************************************************************
	 * On approval, approve the inclusion vote contract to spend the appropriate
	 * amount of LST.
	 *************************************************************************/
	const onApprove = useCallback(async () => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(feeForApplication, 'Fee amount not available');

		const result = await approveERC20({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: toAddress(process.env.YETH_ADDRESS),
			spenderAddress: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
			amount: feeForApplication.raw,
			statusHandler: set_approveStatus
		});
		if (result.isSuccessful) {
			refetchAllowance();
		}
	}, [feeForApplication, isActive, provider, refetchAllowance]);

	/**************************************************************************
	 * On submit, propose the LST address for inclusion in the yETH basket.
	 *************************************************************************/
	const onSubmit = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			assert(isActive, 'Wallet not connected');
			assert(provider, 'Provider not connected');

			const result = await apply({
				connector: provider,
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				contractAddress: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
				lstAddress: toAddress(lstAddress),
				statusHandler: set_submitStatus
			});
			if (result.isSuccessful) {
				set_lstAddress(undefined);
				refetchAllowance();
				refreshAlreadyApplied();
			}
		},
		[isActive, lstAddress, provider, refreshAlreadyApplied, refetchAllowance]
	);

	/**************************************************************************
	 * Render the button to be either an approval button or a submit button
	 *************************************************************************/
	function renderActionButton(): ReactElement {
		if (hasAllowance) {
			return (
				<Button
					className={'w-48'}
					isBusy={submitStatus.pending}
					isDisabled={
						!isValid ||
						// hasAlreadyApplied ||
						!feeForApplication ||
						(feeForApplication && yETHBalance.raw < feeForApplication?.raw)
					}>
					{'Apply'}
				</Button>
			);
		}
		if (!feeForApplication || isZeroAddress(lstAddress)) {
			return (
				<Button
					className={'w-48'}
					isDisabled>
					{'Apply'}
				</Button>
			);
		}
		return (
			<Button
				type={'button'}
				className={'w-48'}
				isBusy={approveStatus.pending}
				isDisabled={!isValid || !feeForApplication}
				onClick={onApprove}
				suppressHydrationWarning>
				{`Approve ${feeForApplication?.raw ? formatAmount(feeForApplication?.normalized, 2, 6) : '0'} yETH`}
			</Button>
		);
	}

	return (
		<form
			id={'apply-form'}
			onSubmit={onSubmit}
			className={'relative col-span-12 flex-col bg-neutral-100 p-10 pb-8 md:col-span-6 md:flex'}>
			<div className={'flex w-full flex-row space-x-4'}>
				<div className={'flex w-[200px] flex-col'}>
					<p className={'mb-1 text-sm text-neutral-600'}>{'Your LST address'}</p>
					<div
						className={cl(
							'grow-1 col-span-7 flex h-10 w-full items-center justify-center rounded-md p-2',
							'bg-neutral-0'
						)}>
						<input
							className={
								'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none'
							}
							type={'text'}
							maxLength={42}
							placeholder={'0x...'}
							value={lstAddress}
							onChange={e => set_lstAddress(e.target.value as TAddress)}
						/>
					</div>
				</div>
				<div className={'flex w-[200px] flex-col'}>
					<p className={'mb-1 text-sm text-neutral-600'}>{'Your fee'}</p>
					<div
						suppressHydrationWarning
						className={cl(
							'grow-1 col-span-7 flex h-10 w-full rounded-md p-2 bg-neutral-0',
							feeForApplication ? 'text-neutral-900' : 'text-neutral-400'
						)}>
						{feeForApplication ? formatAmount(feeForApplication.normalized, 2, 6) : 'Put LST address first'}
					</div>
					<p
						suppressHydrationWarning
						className={'mt-1 text-xs text-neutral-400'}>
						{`You have: ${formatAmount(
							getBalance({
								address: toAddress(process.env.YETH_ADDRESS),
								chainID: Number(process.env.DEFAULT_CHAIN_ID)
							})?.normalized || 0,
							2,
							6
						)} yETH`}
					</p>
				</div>
			</div>
			<div className={'pt-8'}>
				<b className={'text-neutral-700'}>{'I confirm'}</b>
				<div className={'pt-4'}>
					<CheckboxElement
						onChange={onCheckValidity}
						content={
							'The address provided is for an LST token contract, and is a representation of beacon chain staked ETH.'
						}
					/>
				</div>

				<div className={'pt-6'}>
					<CheckboxElement
						onChange={onCheckValidity}
						content={'The LST token is non-rebasing. (If it is, submit the wrapped non-rebasing version!)'}
					/>
				</div>

				<div className={'pt-6'}>
					<CheckboxElement
						onChange={onCheckValidity}
						content={
							'The LST protocol has withdrawals enabled, making it redeemable for the underlying ETH.'
						}
					/>
				</div>

				<div className={'pt-6'}>
					<CheckboxElement
						onChange={onCheckValidity}
						content={
							'The LST protocol distributes earned staked ETH rewards to this token, on a weekly or more frequent basis. (I.e. if a staked version is earning the rewards, you must submit the staked token here!)'
						}
					/>
				</div>

				<div className={'mt-24 pt-2'}>{renderActionButton()}</div>
				<small className={'text-red-900'}>
					{hasAlreadyApplied || isAlreadyInBasket
						? 'This LST has already been proposed for inclusion in the yETH basket.'
						: ''}
					&nbsp;
				</small>
			</div>
		</form>
	);
}

export default function Apply(): ReactElement {
	return (
		<div className={'bg-neutral-0 relative mx-auto mb-0 flex min-h-screen w-full flex-col pt-20'}>
			<div className={'relative mx-auto mt-6 w-screen max-w-5xl'}>
				<section className={'grid grid-cols-12 gap-0 px-4 pt-10 md:gap-20 md:pt-12'}>
					<div className={'col-span-12 md:col-span-6 md:mb-0 md:pt-12'}>
						<div className={'mb-10 flex flex-col justify-center'}>
							<h1 className={'text-3xl font-black md:text-8xl'}>{'Apply'}</h1>
							<b
								suppressHydrationWarning
								className={'font-number mt-4 text-3xl text-purple-300 md:text-4xl'}>
								<Timer />
							</b>
						</div>

						<div className={'mb-8 text-neutral-700'}>
							<p>
								{
									'Want your LST to be included in yETH’s basket of tokens? You’ve come to the right place... the Application page. Good job so far. Here’s your next steps:'
								}
							</p>
							&nbsp;
							<ul className={'list-outside list-disc pl-4'}>
								<li className={'font-bold'}>
									{'Pay a non refundable 0.1-1 yETH fee (to prevent spam).'}
								</li>
								<li className={'font-bold'}>{'Fill in the form.'}</li>
								<li className={'font-bold'}>
									{'Wait for the Yearn rug detection unit to check your application.'}
								</li>
							</ul>
							&nbsp;
							<p>
								{
									'Applications are checked for obvious scams, but nothing further. Genuine applications will be able to incentivize st-yETH holders to vote their LST into yETH. Good luck!'
								}
							</p>
						</div>
					</div>
					<Form />
				</section>
			</div>
		</div>
	);
}
