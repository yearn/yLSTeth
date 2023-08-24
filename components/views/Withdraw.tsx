import React, {useCallback, useMemo, useState} from 'react';
import assert from 'assert';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import TokenInput from 'components/common/TokenInput';
import useLST from 'contexts/useLST';
import useWallet from 'contexts/useWallet';
import {ESTIMATOR_ABI} from 'utils/abi/estimator.abi';
import {removeLiquidityFromPool, removeLiquiditySingleFromPool} from 'utils/actions';
import {LST} from 'utils/constants';
import {ETH_TOKEN, STYETH_TOKEN, YETH_TOKEN} from 'utils/tokens';
import {readContract} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import useWeb3 from '@yearn-finance/web-lib/contexts/useWeb3';
import IconChevronBottom from '@yearn-finance/web-lib/icons/IconChevronBottom';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {MAX_UINT_256} from '@yearn-finance/web-lib/utils/constants';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TLST} from 'contexts/useLST';
import type {ReactElement} from 'react';
import type {TUseBalancesTokens} from '@yearn-finance/web-lib/hooks/useBalances';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';


function ViewLSTWithdrawForm({token, amount}: {
	token: TLST,
	amount: TNormalizedBN,
}): ReactElement {
	const {balances} = useWallet();

	const balanceOf = useMemo((): TNormalizedBN => {
		return toNormalizedBN((balances?.[token.address]?.raw || 0) || 0);
	}, [balances, token.address]);

	return (
		<div className={'lg:col-span-4'}>
			<div className={'grow-1 flex h-10 w-full items-center justify-center rounded-md bg-neutral-200 p-2'}>
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
					disabled
					max={balanceOf?.normalized || 0}
					step={1 / 10 ** (token?.decimals || 18)}
					inputMode={'numeric'}
					placeholder={`0.000000 ${token.symbol}`}
					pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
					value={amount?.normalized || ''} />
			</div>
			<p
				suppressHydrationWarning
				className={'pl-2 pt-1 text-xs text-neutral-600'}>
				{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${token.symbol}`}
			</p>
		</div>
	);
}

function ViewSelectedTokens(): ReactElement {
	const {isActive, provider} = useWeb3();
	const {refresh} = useWallet();
	const {lst} = useLST();
	const [selectedLST, set_selectedLST] = useState<TLST>(lst[0]);
	const [amounts, set_amounts] = useState<TNormalizedBN[]>([toNormalizedBN(0), toNormalizedBN(0), toNormalizedBN(0), toNormalizedBN(0), toNormalizedBN(0)]);
	const [txStatus, set_txStatus] = useState<TTxStatus>(defaultTxStatus);
	const [shouldBalanceTokens, set_shouldBalanceTokens] = useState(true);
	const [fromAmount, set_fromAmount] = useState<TNormalizedBN>(toNormalizedBN(0));

	/* 🔵 - Yearn Finance **************************************************************************
	** If the user is updating the fromAmount and the fromToken is yETH, then update the toAmount
	** with the st-yETH rate.
	**********************************************************************************************/
	const onUpdateFromAmount = useCallback(async (newAmount: TNormalizedBN, selectedLSTIndex: number, shouldBalance: boolean): Promise<void> => {
		set_fromAmount(newAmount);

		if (shouldBalance) {
			if (newAmount.raw > 0n) {
				const estimatedAmount = await readContract({
					address: toAddress(process.env.ESTIMATOR_ADDRESS),
					abi: ESTIMATOR_ABI,
					functionName: 'get_remove_lp',
					args: [newAmount.raw]
				});
				set_amounts(amounts.map((_, index): TNormalizedBN => {
					const defaultSlippage = 100n;
					const amountWithSlippage: bigint = estimatedAmount[index] - toBigInt(estimatedAmount[index] / defaultSlippage);
					return toNormalizedBN(amountWithSlippage);
				}));
			} else {
				set_amounts(amounts.map((): TNormalizedBN => toNormalizedBN(0)));
			}
		} else {
			if (newAmount.raw > 0n) {
				const estimatedAmount = await readContract({
					address: toAddress(process.env.ESTIMATOR_ADDRESS),
					abi: ESTIMATOR_ABI,
					functionName: 'get_remove_single_lp',
					args: [toBigInt(selectedLSTIndex), newAmount.raw]
				});
				set_amounts(amounts.map((item, index): TNormalizedBN => {
					if (index === selectedLSTIndex) {
						const defaultSlippage = 100n;
						const amountWithSlippage: bigint = estimatedAmount - toBigInt(estimatedAmount / defaultSlippage);
						return toNormalizedBN(amountWithSlippage);
					}
					return item;
				}));
			} else {
				set_amounts(amounts.map((item, index): TNormalizedBN => {
					if (index === selectedLSTIndex) {
						return toNormalizedBN(0);
					}
					return item;
				}));
			}
		}
	}, [amounts]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Web3 action to withdraw some LP tokens from the pool
	**********************************************************************************************/
	const onWithdraw = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(fromAmount.raw > 0n, 'Amount must be greater than 0');

		if (shouldBalanceTokens) {
			const result = await removeLiquidityFromPool({
				connector: provider,
				contractAddress: STYETH_TOKEN.address,
				amount: fromAmount.raw,
				minOuts: amounts.map((item): bigint => item.raw),
				statusHandler: set_txStatus
			});
			if (result.isSuccessful) {
				await refresh([
					{...ETH_TOKEN, token: ETH_TOKEN.address},
					{...STYETH_TOKEN, token: STYETH_TOKEN.address},
					{...YETH_TOKEN, token: YETH_TOKEN.address},
					...LST.map((item): TUseBalancesTokens => ({...item, token: item.address}))
				]);
			}
		} else {
			const result = await removeLiquiditySingleFromPool({
				connector: provider,
				contractAddress: STYETH_TOKEN.address,
				index: toBigInt(selectedLST.index),
				amount: fromAmount.raw,
				minOut: amounts[selectedLST.index].raw,
				statusHandler: set_txStatus
			});
			if (result.isSuccessful) {
				await refresh([
					{...ETH_TOKEN, token: ETH_TOKEN.address},
					{...STYETH_TOKEN, token: STYETH_TOKEN.address},
					{...YETH_TOKEN, token: YETH_TOKEN.address},
					...LST.map((item): TUseBalancesTokens => ({...item, token: item.address}))
				]);
			}
		}
		performBatchedUpdates((): void => {
			set_fromAmount(toNormalizedBN(0));
			set_amounts(amounts.map((): TNormalizedBN => toNormalizedBN(0)));
		});

	}, [amounts, fromAmount.raw, isActive, provider, refresh, selectedLST.index, shouldBalanceTokens]);

	function renderWithoutShouldBalanceTokens(): ReactElement {
		return (
			<TokenInput
				label={'Select token'}
				token={selectedLST}
				tokens={lst}
				value={amounts[selectedLST.index]}
				allowance={toNormalizedBN(MAX_UINT_256)}
				isDisabled
				shouldCheckAllowance={false}
				shouldCheckBalance={false}
				onChange={(): void => undefined}
				onChangeToken={(token): void => {
					set_selectedLST(token);
					onUpdateFromAmount(fromAmount, token.index, shouldBalanceTokens);
				}} />
		);
	}

	function renderWithShouldBalanceTokens(): ReactElement {
		return (
			<div className={'grid gap-5'}>
				<div className={'-mb-4 flex w-full text-neutral-600'}>
					{'Select token'}
				</div>
				{lst.map((token, index): ReactElement => (
					<ViewLSTWithdrawForm
						key={token.address}
						token={token}
						amount={amounts[index]} />
				))}
			</div>
		);
	}

	return (
		<div className={'col-span-18 py-6 pr-0 md:py-10 md:pr-[72px]'}>
			<h2 className={'text-xl font-black'}>
				{'Withdraw'}
			</h2>
			<div className={'pt-4'}>
				<div className={'flex flex-row items-center space-x-2'}>
					<label className={'mr-7 flex cursor-pointer flex-row items-center justify-center space-x-2'}>
						<p
							title={'Single token'}
							className={cl('hover-fix', !shouldBalanceTokens ? 'text-purple-300 font-bold' : 'text-neutral-600 font-normal')}>
							{'Single token'}
						</p>
						<input
							type={'radio'}
							radioGroup={'singleToken'}
							checked={!shouldBalanceTokens}
							className={'mt-0.5 h-3 w-3 border-none bg-transparent text-purple-300 outline outline-2 outline-offset-2 outline-neutral-600 checked:bg-purple-300 checked:outline-purple-300 focus-within:bg-purple-300 focus:bg-purple-300'}
							style={{backgroundImage: 'none'}}
							onChange={(): void => {
								set_shouldBalanceTokens(false);
								onUpdateFromAmount(fromAmount, selectedLST.index, false);
							}} />
					</label>
					<label className={'flex cursor-pointer flex-row items-center justify-center space-x-2'}>
						<p
							title={'Balanced amounts'}
							className={cl('hover-fix', shouldBalanceTokens ? 'text-purple-300 font-bold' : 'text-neutral-600 font-normal')}>
							{'Balanced amounts'}
						</p>
						<input
							type={'radio'}
							radioGroup={'singleToken'}
							checked={shouldBalanceTokens}
							className={'mt-0.5 h-3 w-3 border-none bg-transparent text-purple-300 outline outline-2 outline-offset-2 outline-neutral-600 checked:bg-purple-300 checked:outline-purple-300 focus-within:bg-purple-300 focus:bg-purple-300'}
							style={{backgroundImage: 'none'}}
							onChange={(): void => {
								set_shouldBalanceTokens(true);
								onUpdateFromAmount(fromAmount, selectedLST.index, true);
							}} />
					</label>

				</div>
				<div className={'mt-5 grid'}>
					<TokenInput
						allowance={toNormalizedBN(MAX_UINT_256)}
						shouldCheckAllowance={false}
						token={YETH_TOKEN as TLST}
						value={fromAmount}
						onChange={(v): void => {
							onUpdateFromAmount(v, selectedLST.index, shouldBalanceTokens);
						}} />
					<div className={'mt-6 flex w-full justify-center'}>
						<button className={'cursor-pointer'}>
							<IconChevronBottom className={'h-4 w-4'} />
						</button>
					</div>
					<div className={'mt-4'}>
						{!shouldBalanceTokens && renderWithoutShouldBalanceTokens()}
						{shouldBalanceTokens && renderWithShouldBalanceTokens()}
					</div>
				</div>
			</div>
			<div className={'mt-10 flex justify-start'}>
				<Button
					onClick={onWithdraw}
					isBusy={txStatus.pending}
					isDisabled={!isActive || !provider || fromAmount.raw === 0n || amounts.every((amount): boolean => amount.raw === 0n)}
					className={'w-full md:w-[184px]'}>
					{'Withdraw'}
				</Button>
			</div>
		</div>
	);
}

function ViewDetails(): ReactElement {
	return (
		<div className={'col-span-12 py-6 pl-0 md:py-10 md:pl-[72px]'}>
			<div className={'mb-10 flex w-full flex-col !rounded-md bg-neutral-100'}>
				<h2 className={'text-xl font-black'}>
					{'Details'}
				</h2>
				<dl className={'grid grid-cols-3 gap-2 pt-4'}>
					<dt className={'col-span-2'}>{'Minimum LP Tokens'}</dt>
					<dd className={'text-right font-bold'}>
						{'◼︎◼︎◼︎'}  {/* TODO: ADD MIN LP TOKENS */}
					</dd>
				</dl>
			</div>
			<div>
				<h2 className={'text-xl font-black'}>
					{'Info'}
				</h2>
				<p className={'whitespace-break-spaces pt-4 text-neutral-600'}>
					{'Choose a single LST to withdraw into, or withdraw into all 5 LSTs (balanced by pool composition).'}
				</p>
			</div>
		</div>
	);
}

function ViewWithdraw(): ReactElement {
	return (
		<section className={'relative px-4 md:px-[72px]'}>
			<div className={'grid grid-cols-1 divide-x-0 divide-y-2 divide-neutral-300 md:grid-cols-30 md:divide-x-2 md:divide-y-0'}>
				<ViewSelectedTokens />
				<ViewDetails />
			</div>
		</section>
	);
}

export default ViewWithdraw;
