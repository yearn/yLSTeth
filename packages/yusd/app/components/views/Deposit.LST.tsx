import React, {useCallback, useEffect, useMemo, useState} from 'react';
import assert from 'assert';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {decodeAsBigInt, toAddress, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {ESTIMATOR_ABI} from '@libAbi/estimator.abi';
import {useUpdateEffect} from '@react-hookz/web';
import {readContracts} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {addLiquidityToPool, depositAndStake} from '@yUSD/actions';
import useBasket from '@yUSD/contexts/useBasket';
import useLST from '@yUSD/contexts/useLST';
import {ETH_TOKEN, STYUSD_TOKEN, YUSD_TOKEN} from '@yUSD/tokens';

import {LSTDepositForm} from './Deposit.LSTDeposit';

import type {Dispatch, ReactElement} from 'react';
import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TEstOutWithBonusPenalty} from '@libUtils/types';

function ViewDepositLST({
	shouldBalanceTokens,
	estimateOut,
	onEstimateOut
}: {
	shouldBalanceTokens: boolean;
	estimateOut: TEstOutWithBonusPenalty;
	onEstimateOut: (val: TEstOutWithBonusPenalty) => void;
}): ReactElement {
	const {isActive, provider} = useWeb3();
	const {basket, isLoaded, refreshBasket} = useBasket();
	const {slippage} = useLST();
	const {getBalance, onRefresh} = useWallet();
	const [amounts, set_amounts] = useState<TNormalizedBN[]>([]);
	const [lastAmountUpdated, set_lastAmountUpdated] = useState(-1);
	const [txStatus, set_txStatus] = useState<TTxStatus>(defaultTxStatus);
	const [txStatusApproveDS, set_txStatusApproveDS] = useState<TTxStatus>(defaultTxStatus);
	const [txStatusDeposit, set_txStatusDeposit] = useState<TTxStatus>(defaultTxStatus);
	const [txStatusDepositStake, set_txStatusDepositStake] = useState<TTxStatus>(defaultTxStatus);

	/**********************************************************************************************
	 ** Initialize the amounts of the tokens in the basket to zero once we have the basket data
	 ** available.
	 **********************************************************************************************/
	useEffect(() => {
		set_amounts(basket.map((): TNormalizedBN => zeroNormalizedBN));
	}, [basket]);

	/**********************************************************************************************
	 ** Once the user update the amount of a token, we have two options, depending on the value of
	 ** `shouldBalanceTokens`:
	 ** 1. Balance the amounts of all tokens based on the rate and the weight of the tokens
	 ** 2. Just update the amount of the token that was changed
	 **********************************************************************************************/
	const onChangeAmount = useCallback(
		(lstIndex: number, amount: TNormalizedBN): void => {
			if (shouldBalanceTokens) {
				const initialTokenAmount = amount.raw;
				const initialTokenRate = toBigInt(basket?.[lstIndex].rate.raw);
				const initialTokenWeight = toBigInt(basket?.[lstIndex].weight.raw || 1n);

				const newAmounts = basket.map((item, index): TNormalizedBN => {
					if (item.address === basket[lstIndex].address) {
						return amount;
					}
					const balancedTokenRate = toBigInt(basket?.[index].rate.raw || 1n);
					const balancedTokenWeight = basket?.[index].weight.raw;
					const balancedTokenAmount = toBigInt(
						(initialTokenAmount * initialTokenRate * balancedTokenWeight) /
							initialTokenWeight /
							balancedTokenRate
					);
					return toNormalizedBN(balancedTokenAmount, 18);
				});
				set_amounts(newAmounts);
				set_lastAmountUpdated(lstIndex);
				return;
			}
			const newAmounts = [...amounts];
			newAmounts[lstIndex] = amount;
			set_amounts(newAmounts);
			set_lastAmountUpdated(lstIndex);
		},
		[amounts, basket, shouldBalanceTokens]
	);

	/**********************************************************************************************
	 ** Once the inputed amounts are updated, we need to fetch the `get_add_lp` and `get_vb` values.
	 ** This is done by using the `useContractReads` hook.
	 ** By comparing the `get_add_lp` value and the `get_vb` value we can calculate the bonus or
	 ** penalty that will be applied to the deposit.
	 **********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		if (amounts.some((item): boolean => item.raw > 0n)) {
			try {
				const data = await readContracts(retrieveConfig(), {
					contracts: [
						{
							abi: ESTIMATOR_ABI,
							address: toAddress(process.env.ESTIMATOR_ADDRESS),
							functionName: 'get_add_lp',
							chainId: Number(process.env.DEFAULT_CHAIN_ID),
							args: [amounts.map((item): bigint => item.raw)]
						},
						{
							abi: ESTIMATOR_ABI,
							address: toAddress(process.env.ESTIMATOR_ADDRESS),
							functionName: 'get_vb',
							chainId: Number(process.env.DEFAULT_CHAIN_ID),
							args: [amounts.map((item): bigint => item.raw)]
						}
					]
				});
				const estimateOut = decodeAsBigInt(data?.[0] as never);
				const vb = decodeAsBigInt(data?.[1] as never);

				onEstimateOut({
					value: toBigInt(estimateOut),
					vb: toBigInt(vb),
					bonusOrPenalty:
						((Number(toNormalizedBN(estimateOut, 18).normalized) -
							Number(toNormalizedBN(vb, 18).normalized)) /
							Number(toNormalizedBN(vb, 18).normalized)) *
						100
				});
			} catch (error) {
				onEstimateOut({value: toBigInt(0), vb: toBigInt(0), bonusOrPenalty: 0});
			}
		} else {
			onEstimateOut({value: toBigInt(0), vb: toBigInt(0), bonusOrPenalty: 0});
		}
	}, [amounts, onEstimateOut]);

	/**********************************************************************************************
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

	/**********************************************************************************************
	 ** Check whether the deposit buttons are enabled or not. This is used by checking if at least
	 ** one of the inputed amounts is greater than zero and if all the inputed amounts are less than
	 ** or equal to the user's balance.
	 **********************************************************************************************/
	const canDeposit = useMemo((): boolean => {
		return (
			amounts.some((item): boolean => item.raw > 0n) &&
			amounts.every(
				(item, index): boolean =>
					item.raw <=
					getBalance({address: basket?.[index]?.address, chainID: Number(process.env.DEFAULT_CHAIN_ID)}).raw
			)
		);
	}, [amounts, getBalance, basket]);

	const shouldApproveDeposit = useMemo((): boolean => {
		return amounts.some((item, index): boolean => item.raw > basket[index].poolAllowance.raw);
	}, [amounts, basket]);

	const shouldApproveDepositStake = useMemo((): boolean => {
		return amounts.some((item, index): boolean => item.raw > basket[index].zapAllowance.raw);
	}, [amounts, basket]);

	/**********************************************************************************************
	 ** Web3 action to allow the pool contract to spend the user's underlying pool tokens.
	 **********************************************************************************************/
	const onApprove = useCallback(
		async (
			spender: TAddress,
			key: 'zapAllowance' | 'poolAllowance',
			txStatusSetter: Dispatch<TTxStatus>
		): Promise<void> => {
			assert(isActive, 'Wallet not connected');
			assert(provider, 'Provider not connected');

			txStatusSetter({...defaultTxStatus, pending: true});
			for (const item of basket) {
				const amount = amounts[basket.indexOf(item)];
				if (amount.raw <= 0n) {
					continue;
				}
				if (amount.raw <= item[key].raw) {
					continue;
				}

				const result = await approveERC20({
					connector: provider,
					chainID: Number(process.env.DEFAULT_CHAIN_ID),
					contractAddress: item.address,
					spenderAddress: spender,
					amount: amount.raw,
					statusHandler: txStatusSetter
				});
				if (result.isSuccessful) {
					refreshBasket();
					await onRefresh([ETH_TOKEN]);
				} else {
					txStatusSetter({...defaultTxStatus, error: true});
					setTimeout((): void => {
						txStatusSetter({...defaultTxStatus});
					}, 3000);
					return;
				}
			}
			txStatusSetter({...defaultTxStatus, success: true});
			setTimeout((): void => {
				txStatusSetter({...defaultTxStatus});
			}, 3000);
		},
		[amounts, isActive, basket, refreshBasket, provider, onRefresh]
	);

	const onDeposit = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');

		const result = await addLiquidityToPool({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: toAddress(process.env.POOL_ADDRESS),
			amounts: amounts.map((item): bigint => item.raw),
			estimateOut: (estimateOut.value * (10000n - slippage)) / 10000n,
			statusHandler: set_txStatusDeposit
		});
		if (result.isSuccessful) {
			refreshBasket();
			await onRefresh([ETH_TOKEN, YUSD_TOKEN, ...basket]);
			set_amounts(amounts.map((item): TNormalizedBN => ({...item, raw: 0n})));
		}
	}, [amounts, estimateOut.value, isActive, refreshBasket, provider, onRefresh, slippage, basket]);

	const onDepositAndStake = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');

		const result = await depositAndStake({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: toAddress(process.env.ZAP_ADDRESS),
			amounts: amounts.map((item): bigint => item.raw),
			estimateOut: (estimateOut.value * (10000n - slippage)) / 10000n,
			statusHandler: set_txStatusDepositStake
		});
		if (result.isSuccessful) {
			refreshBasket();
			await onRefresh([ETH_TOKEN, YUSD_TOKEN, STYUSD_TOKEN, ...basket]);
			set_amounts(amounts.map((item): TNormalizedBN => ({...item, raw: 0n})));
		}
	}, [amounts, estimateOut, isActive, refreshBasket, provider, onRefresh, slippage, basket]);

	return (
		<>
			<div className={'pt-4'}>
				<div className={'mt-5 grid gap-5'}>
					{isLoaded ? (
						basket.map(
							(token, index): ReactElement => (
								<LSTDepositForm
									key={token.address}
									token={token}
									amount={toBigInt(amounts[index]?.raw) <= 0n ? zeroNormalizedBN : amounts[index]}
									onUpdateAmount={(amount): void => onChangeAmount(index, amount)}
									isDisabled={false}
								/>
							)
						)
					) : (
						<>
							<div className={'skeleton-lg h-[60px] w-full'}></div>
							<div className={'skeleton-lg h-[60px] w-full'}></div>
							<div className={'skeleton-lg h-[60px] w-full'}></div>
							<div className={'skeleton-lg h-[60px] w-full'}></div>
							<div className={'skeleton-lg h-[60px] w-full'}></div>
							<div className={'skeleton-lg h-[60px] w-full'}></div>
							<div className={'skeleton-lg h-[60px] w-full'}></div>
							<div className={'skeleton-lg h-[60px] w-full'}></div>
						</>
					)}
				</div>
			</div>
			<div className={'mt-10 flex justify-start'}>
				<div className={'flex w-full flex-row space-x-4'}>
					<Button
						onClick={async (): Promise<void> =>
							!shouldApproveDeposit
								? onApprove(toAddress(process.env.POOL_ADDRESS), 'poolAllowance', set_txStatus)
								: onDeposit()
						}
						isBusy={shouldApproveDeposit ? txStatus.pending : txStatusDeposit.pending}
						isDisabled={!canDeposit || !provider || toBigInt(estimateOut.value) === 0n}
						variant={'outlined'}
						className={'w-full md:w-[184px]'}>
						{shouldApproveDeposit ? 'Approve for Deposit' : 'Deposit'}
					</Button>
					<Button
						onClick={async (): Promise<void> =>
							shouldApproveDepositStake
								? onApprove(toAddress(process.env.ZAP_ADDRESS), 'zapAllowance', set_txStatusApproveDS)
								: onDepositAndStake()
						}
						isBusy={shouldApproveDepositStake ? txStatusApproveDS.pending : txStatusDepositStake.pending}
						isDisabled={!canDeposit || !provider || toBigInt(estimateOut.value) === 0n}
						className={'w-fit md:min-w-[184px]'}>
						{shouldApproveDepositStake ? 'Approve for Deposit & Stake' : 'Deposit & Stake'}
					</Button>
				</div>
			</div>
		</>
	);
}

export {ViewDepositLST};
