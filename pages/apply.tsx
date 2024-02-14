import React, {useCallback, useMemo, useState} from 'react';
import {propose} from 'app/actions';
import {useEpoch} from 'app/hooks/useEpoch';
import {useTimer} from 'app/hooks/useTimer';
import assert from 'assert';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount, isAddress, toAddress, toNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {Button} from '@yearn-finance/web-lib/components/Button';

import type {ReactElement} from 'react';
import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

function Timer(): ReactElement {
	const {voteStart, endPeriod, hasVotingStarted} = useEpoch();
	const time = useTimer({endTime: hasVotingStarted ? Number(endPeriod) : Number(voteStart)});

	return (
		<b
			suppressHydrationWarning
			className={'font-number mt-2 text-4xl leading-10 text-purple-300'}>
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
					'focus:ring-purple-300 mr-4 mt-2 size-6 cursor-pointer rounded-sm border-2 border-purple-300 bg-neutral-0 text-purple-300 indeterminate:ring-2 focus:bg-neutral-200 focus:ring-2 focus:ring-offset-neutral-100'
				}
			/>
			<p className={'text-base text-neutral-700'}>{content}</p>
		</label>
	);
}

function Form(): ReactElement {
	const {isActive, provider} = useWeb3();
	const {getBalance} = useWallet();
	const [lstAddress, set_lstAddress] = useState<TAddress | undefined>(undefined);
	const [isValid, set_isValid] = useState(false);
	const [submitStatus, set_submitStatus] = useState<TTxStatus>(defaultTxStatus);

	function onCheckValidity(): void {
		const form = document.getElementById('apply-form') as HTMLFormElement;
		if (form) {
			set_isValid(form.checkValidity());
		}
	}

	const getFeeAmount = useMemo((): TNormalizedBN | undefined => {
		if (isAddress(lstAddress)) {
			return toNormalizedBN(1e18, 18);
		}
		return undefined;
	}, [lstAddress]);

	const onSubmit = useCallback(async () => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');

		const result = await propose({
			connector: provider,
			chainID: Number(process.env.BASE_CHAIN_ID),
			contractAddress: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
			ipfs: '',
			script: '',
			statusHandler: set_submitStatus
		});
		if (result.isSuccessful) {
			//
		}
	}, [getFeeAmount, lstAddress]);

	return (
		<form
			id={'apply-form'}
			onSubmit={onSubmit}
			className={'relative col-span-12 flex-col bg-neutral-100 p-10 md:col-span-6 md:flex'}>
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
								'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none scrollbar-none'
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
						className={cl(
							'grow-1 col-span-7 flex h-10 w-full rounded-md p-2 bg-neutral-0',
							getFeeAmount ? 'text-neutral-900' : 'text-neutral-400'
						)}>
						{getFeeAmount ? formatAmount(getFeeAmount.normalized, 2, 6) : 'Put LST address first'}
					</div>
					<p
						suppressHydrationWarning
						className={'mt-1 text-xs text-neutral-400'}>
						{`You have: ${formatAmount(
							getBalance({address: toAddress(process.env.YETH_ADDRESS), chainID: 1})?.normalized || 0,
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

				<div className={'mt-24 pt-2'}>
					<Button
						className={'w-48'}
						isBusy={submitStatus.pending}
						isDisabled={
							!isValid ||
							!getFeeAmount ||
							(getFeeAmount &&
								getBalance({address: toAddress(process.env.YETH_ADDRESS), chainID: 1}).raw <
									getFeeAmount?.raw)
						}>
						{'Apply'}
					</Button>
				</div>
			</div>
		</form>
	);
}

function Apply(): ReactElement {
	return (
		<div className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col bg-neutral-0 pt-20'}>
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

export default Apply;
