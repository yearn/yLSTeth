import React, {useCallback, useMemo, useState} from 'react';
import assert from 'assert';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import {RenderAmount} from 'components/common/RenderAmount';
import Toggle from 'components/common/toggle';
import IconCircleCross from 'components/icons/IconCircleCross';
import IconWarning from 'components/icons/IconWarning';
import useLST from 'contexts/useLST';
import useWallet from 'contexts/useWallet';
import {handleInputChangeEventValue} from 'utils';
import {ESTIMATOR_ABI} from 'utils/abi/estimator.abi';
import {addLiquidityToPool, approveERC20} from 'utils/actions';
import {LST} from 'utils/constants';
import {ETH_TOKEN, YETH_TOKEN} from 'utils/tokens';
import {useContractReads} from 'wagmi';
import {useUpdateEffect} from '@react-hookz/web';
import {Button} from '@yearn-finance/web-lib/components/Button';
import useWeb3 from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TLST} from 'contexts/useLST';
import type {ChangeEvent, ReactElement} from 'react';
import type {TUseBalancesTokens} from '@yearn-finance/web-lib/hooks/useBalances';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

function ViewLSTDepositForm({token, amount, onUpdateAmount}: {
	token: TLST,
	amount: TNormalizedBN,
	onUpdateAmount: (amount: TNormalizedBN) => void,
}): ReactElement {
	const {balances} = useWallet();

	const balanceOf = useMemo((): TNormalizedBN => {
		return toNormalizedBN((balances?.[token.address]?.raw || 0) || 0);
	}, [balances, token.address]);

	const onChangeAmount = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
		const element = document.getElementById('amountToSend') as HTMLInputElement;
		const newAmount = handleInputChangeEventValue(e, token?.decimals || 18);
		if (newAmount.raw > balances?.[token.address]?.raw) {
			if (element?.value) {
				element.value = formatAmount(balances?.[token.address]?.normalized, 0, 18);
			}
			return onUpdateAmount(toNormalizedBN(balances?.[token.address]?.raw || 0));
		}
		onUpdateAmount(newAmount);
	}, [balances, onUpdateAmount, token.address, token?.decimals]);

	return (
		<div className={'lg:col-span-4'}>
			<div className={'grow-1 flex h-10 w-full items-center justify-center rounded-md bg-white p-2'}>
				<div className={'mr-2 h-6 w-6 min-w-[24px]'}>
					<ImageWithFallback
						alt={token.name}
						unoptimized
						src={token.logoURI}
						width={24}
						height={24} />
				</div>
				<input
					id={token.address}
					className={'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none scrollbar-none'}
					type={'number'}
					min={0}
					maxLength={20}
					max={balanceOf?.normalized || 0}
					step={1 / 10 ** (token?.decimals || 18)}
					inputMode={'numeric'}
					placeholder={`0.000000 ${token.symbol}`}
					pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
					value={amount?.normalized || ''}
					onChange={onChangeAmount} />
				<div className={'ml-2 flex flex-row items-center space-x-2'}>
					<div className={'relative h-4 w-4'}>
						<div className={'absolute inset-0'}>
							<span className={'tooltip'}>
								<IconWarning
									style={{opacity: (amount.raw > token.poolAllowance.raw) && (amount.raw <= balanceOf.raw) ? 1 : 0}}
									className={'h-4 w-4 text-neutral-400 transition-opacity'} />
								<span className={'tooltipLight !-inset-x-24 top-full mt-2 !w-auto'}>
									<div
										suppressHydrationWarning
										className={'w-fit rounded-md border border-neutral-700 bg-neutral-900 p-1 px-2 text-center text-xs font-medium text-neutral-0'}>
										{`You will be prompted to approve spending of ${formatAmount(amount.normalized, 6, 6)} ${token.symbol}`}
									</div>
								</span>
							</span>
						</div>
						<IconCircleCross
							style={{opacity: amount.raw > balanceOf.raw ? 1 : 0, pointerEvents: amount.raw > balanceOf.raw ? 'auto' : 'none'}}
							className={'absolute inset-0 h-4 w-4 text-red-900 transition-opacity'} />
					</div>
					<button
						type={'button'}
						tabIndex={-1}
						onClick={(): void => onUpdateAmount(balanceOf)}
						className={cl('px-2 py-1 text-xs rounded-md border border-purple-300 transition-colors bg-purple-300 text-white')}>
						{'Max'}
					</button>
				</div>
			</div>
			<p
				suppressHydrationWarning
				className={'pl-2 pt-1 text-xs text-neutral-600'}>
				{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${token.symbol}`}
			</p>
		</div>
	);
}

function ViewDetails({estimateOut, bonusOrPenalty}: {estimateOut: bigint, bonusOrPenalty: number}): ReactElement {
	const bonusOrPenaltyFormatted = useMemo((): string => {
		if (Number.isNaN(bonusOrPenalty)) {
			return formatAmount(0, 2, 2);
		}
		if (bonusOrPenalty === 0) {
			return formatAmount(0, 2, 2);
		}
		if (Number(bonusOrPenalty.toFixed(6)) === 0) {
			return formatAmount(0, 2, 2);
		}
		return bonusOrPenalty.toFixed(6);
	}, [bonusOrPenalty]);

	return (
		<div className={'col-span-12 py-10 pl-[72px]'}>
			<div className={'mb-10 flex w-full flex-col !rounded-md bg-neutral-100'}>
				<h2 className={'text-xl font-black'}>
					{'Details'}
				</h2>
				<dl className={'grid grid-cols-3 gap-2 pt-4'}>
					<dt className={'col-span-2'}>{'Est. deposit Bonus/Penalties'}</dt>
					<dd suppressHydrationWarning className={'text-right font-bold'}>
						{`${formatAmount(bonusOrPenaltyFormatted, 2, 6)}%`}
					</dd>

					<dt className={'col-span-2'}>{'Slippage'}</dt>
					<dd className={'text-right font-bold'}>
						{`${formatAmount(1, 2, 2)}%`}  {/* TODO: ADD SLIPPAGE CONFIG */}
					</dd>

					<dt className={'col-span-2'}>{'Minimum LP Tokens'}</dt>
					<dd suppressHydrationWarning className={'text-right font-bold'}>
						<RenderAmount
							value={Number(formatAmount(toNormalizedBN(estimateOut).normalized))}
							decimals={6} />
					</dd>
				</dl>
			</div>
			<div>
				<h2 className={'text-xl font-black'}>
					{'Info'}
				</h2>
				<p className={'whitespace-break-spaces pt-4 text-neutral-600'}>
					{'Like Draper said - it’s gonna be a super small description. Well, not like ultra small. It will take some room. It’s always nice to put some copy, and it’s good for balance.\n\n'}

					{'We can put useful links here as well.'}
				</p>
			</div>
		</div>
	);
}

function ViewDeposit(): ReactElement {
	const {isActive, provider} = useWeb3();
	const {lst, onUpdateLST} = useLST();
	const {balances, refresh} = useWallet();
	const [shouldBalanceTokens, set_shouldBalanceTokens] = useState(false);
	const [amounts, set_amounts] = useState<TNormalizedBN[]>([toNormalizedBN(0), toNormalizedBN(0), toNormalizedBN(0), toNormalizedBN(0), toNormalizedBN(0)]);
	const [lastAmountUpdated, set_lastAmountUpdated] = useState(-1);
	const [txStatus, set_txStatus] = useState<TTxStatus>(defaultTxStatus);
	const [txStatusDeposit, set_txStatusDeposit] = useState<TTxStatus>(defaultTxStatus);

	/* 🔵 - Yearn Finance **************************************************************************
	** Once the user update the amount of a token, we have two options, depending on the value of
	** `shouldBalanceTokens`:
	** 1. Balance the amounts of all tokens based on the rate and the weight of the tokens
	** 2. Just update the amount of the token that was changed
	**********************************************************************************************/
	const onChangeAmount = useCallback((lstIndex: number, amount: TNormalizedBN): void => {
		if (shouldBalanceTokens) {
			const initialTokenAmount = amount.raw;
			const initialTokenRate = lst?.[lstIndex].rate.raw;
			const initialTokenWeight = lst?.[lstIndex].weight.raw;

			const newAmounts = lst.map((item, index): TNormalizedBN => {
				if (item.address === lst[lstIndex].address) {
					return amount;
				}
				const balancedTokenRate = lst?.[index].rate.raw;
				const balancedTokenWeight = lst?.[index].weight.raw;
				const balancedTokenAmount = toBigInt(initialTokenAmount * initialTokenRate * balancedTokenWeight / initialTokenWeight / balancedTokenRate);
				return toNormalizedBN(balancedTokenAmount);
			});
			performBatchedUpdates((): void => {
				set_amounts(newAmounts);
				set_lastAmountUpdated(lstIndex);
			});
			return;
		}
		const newAmounts = [...amounts];
		newAmounts[lstIndex] = amount;
		performBatchedUpdates((): void => {
			set_amounts(newAmounts);
			set_lastAmountUpdated(lstIndex);
		});
	}, [amounts, lst, shouldBalanceTokens]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Once the inputed amounts are updated, we need to fetch the `get_add_lp` and `get_vb` values.
	** This is done by using the `useContractReads` hook.
	** By comparing the `get_add_lp` value and the `get_vb` value we can calculate the bonus or
	** penalty that will be applied to the deposit.
	**********************************************************************************************/
	const {data} = useContractReads({
		enabled: amounts.some((item): boolean => item.raw > 0n),
		keepPreviousData: true,
		contracts: [
			{
				abi: ESTIMATOR_ABI,
				address: toAddress(process.env.ESTIMATOR_ADDRESS),
				functionName: 'get_add_lp',
				chainId: 1337,
				args: [amounts.map((item): bigint => item.raw)]
			},
			{
				abi: ESTIMATOR_ABI,
				address: toAddress(process.env.ESTIMATOR_ADDRESS),
				functionName: 'get_vb',
				chainId: 1337,
				args: [amounts.map((item): bigint => item.raw)]
			}
		]
	});
	const estimateOut = toBigInt(data?.[0]?.result as bigint);
	const vb = toBigInt(data?.[1]?.result as bigint);

	/* 🔵 - Yearn Finance **************************************************************************
	** When the user clicks the toggle button, if the toggle is set to true and if the user already
	** inputed something, we need to balance the amounts of all tokens based on the rate and the
	** weight of the last token that was updated.
	**********************************************************************************************/
	useUpdateEffect((): void => {
		if (shouldBalanceTokens) {
			if (lastAmountUpdated !== -1) {
				onChangeAmount(lastAmountUpdated, amounts[lastAmountUpdated]);
			}
		}
	}, [shouldBalanceTokens]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Check whether the deposit buttons are enabled or not. This is used by checking if at least
	** one of the inputed amounts is greater than zero and if all the inputed amounts are less than
	** or equal to the user's balance.
	**********************************************************************************************/
	const canDeposit = useMemo((): boolean => {
		return (
			amounts.some((item): boolean => item.raw > 0n)
			&& amounts.every((item, index): boolean => item.raw <= (balances?.[lst?.[index]?.address]?.raw || 0n))
		);
	}, [amounts, balances, lst]);

	const shouldApprove = useMemo((): boolean => {
		return (amounts.some((item, index): boolean => item.raw > lst[index].poolAllowance.raw));
	}, [amounts, lst]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Web3 action to allow the pool contract to spend the user's underlying pool tokens.
	**********************************************************************************************/
	const onApprove = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');

		set_txStatus({...defaultTxStatus, pending: true});
		for (const item of lst) {
			const amount = amounts[lst.indexOf(item)];
			if (amount.raw <= 0n) {
				continue;
			}
			if (amount.raw <= item.poolAllowance.raw) {
				continue;
			}

			const result = await approveERC20({
				connector: provider,
				contractAddress: item.address,
				spenderAddress: toAddress(process.env.POOL_ADDRESS),
				amount: amount.raw,
				statusHandler: set_txStatus
			});
			if (result.isSuccessful) {
				onUpdateLST();
				await refresh([{...ETH_TOKEN, token: ETH_TOKEN.address}]);
			} else {
				set_txStatus({...defaultTxStatus, error: true});
				setTimeout((): void => {
					set_txStatus({...defaultTxStatus});
				}, 3000);
				return;
			}
		}
		set_txStatus({...defaultTxStatus, success: true});
		setTimeout((): void => {
			set_txStatus({...defaultTxStatus});
		}, 3000);
	}, [amounts, isActive, lst, onUpdateLST, provider, refresh]);


	const onDeposit = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');

		const result = await addLiquidityToPool({
			connector: provider,
			contractAddress: toAddress(process.env.POOL_ADDRESS),
			amounts: amounts.map((item): bigint => item.raw),
			estimateOut,
			statusHandler: set_txStatusDeposit
		});
		if (result.isSuccessful) {
			onUpdateLST();
			await refresh([
				{...ETH_TOKEN, token: ETH_TOKEN.address},
				{...YETH_TOKEN, token: YETH_TOKEN.address},
				...LST.map((item): TUseBalancesTokens => ({...item, token: item.address}))
			]);
			set_amounts(amounts.map((item): TNormalizedBN => ({...item, raw: 0n})));
		}
	}, [amounts, estimateOut, isActive, onUpdateLST, provider, refresh]);

	return (
		<section className={'relative px-[72px]'}>
			<div className={'grid grid-cols-30 divide-x-2 divide-neutral-300'}>
				<div className={'col-span-18 py-10 pr-[72px]'}>
					<div className={'flex w-full flex-col !rounded-md bg-neutral-100'}>
						<h2 className={'text-xl font-black'}>
							{'Select tokens'}
						</h2>
						<div className={'pt-4'}>
							<div className={'flex flex-row items-center space-x-2'}>
								<b className={'text-purple-300'}>{'Balance tokens proportion'}</b>
								<Toggle
									isEnabled={shouldBalanceTokens}
									onChange={(): void => set_shouldBalanceTokens(!shouldBalanceTokens)}
								/>
							</div>

							<div className={'mt-5 grid gap-5'}>
								{lst.map((token, index): ReactElement => (
									<ViewLSTDepositForm
										key={token.address}
										token={token}
										amount={amounts[index]}
										onUpdateAmount={(amount): void => onChangeAmount(index, amount)} />
								))}
							</div>
						</div>
						<div className={'mt-10 flex justify-start'}>
							{shouldApprove ? (
								<Button
									onClick={onApprove}
									isBusy={txStatus.pending}
									isDisabled={!canDeposit}
									className={'w-[184px]'}>
									{'Approve'}
								</Button>
							) : (
								<div className={'flex flex-row space-x-4'}>
									<Button
										onClick={onDeposit}
										isBusy={txStatusDeposit.pending}
										isDisabled={!canDeposit}
										variant={'outlined'}
										className={'w-[184px]'}>
										{'Deposit'}
									</Button>
									<Button
										isDisabled={!canDeposit}
										className={'w-[184px]'}>
										{'Deposit and Stake'}
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
				<ViewDetails
					estimateOut={toBigInt(estimateOut)}
					bonusOrPenalty={(Number(toNormalizedBN(estimateOut).normalized) - Number(toNormalizedBN(vb).normalized)) / Number(toNormalizedBN(vb).normalized) * 100}
				/>
			</div>
		</section>
	);
}

export default ViewDeposit;
