import React, {useCallback, useMemo, useState} from 'react';
import {addLiquidityToPool, approveERC20, depositAndStake} from 'app/actions';
import useLST from 'app/contexts/useLST';
import {ETH_TOKEN, STYETH_TOKEN, YETH_TOKEN} from 'app/tokens';
import {ESTIMATOR_ABI} from 'app/utils/abi/estimator.abi';
import {LST} from 'app/utils/constants';
import assert from 'assert';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {decodeAsBigInt, toAddress, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useUpdateEffect} from '@react-hookz/web';
import {readContracts} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';

import {LSTDepositForm} from './Deposit.LSTDeposit';

import type {TEstOutWithBonusPenalty} from 'app/utils/types';
import type {Dispatch, ReactElement} from 'react';
import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

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
	const {lst, slippage, onUpdateLST} = useLST();
	const {getBalance, onRefresh} = useWallet();
	const [amounts, set_amounts] = useState<TNormalizedBN[]>(LST.map((): TNormalizedBN => zeroNormalizedBN));
	const [lastAmountUpdated, set_lastAmountUpdated] = useState(-1);
	const [txStatus, set_txStatus] = useState<TTxStatus>(defaultTxStatus);
	const [txStatusApproveDS, set_txStatusApproveDS] = useState<TTxStatus>(defaultTxStatus);
	const [txStatusDeposit, set_txStatusDeposit] = useState<TTxStatus>(defaultTxStatus);
	const [txStatusDepositStake, set_txStatusDepositStake] = useState<TTxStatus>(defaultTxStatus);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Once the user update the amount of a token, we have two options, depending on the value of
	 ** `shouldBalanceTokens`:
	 ** 1. Balance the amounts of all tokens based on the rate and the weight of the tokens
	 ** 2. Just update the amount of the token that was changed
	 **********************************************************************************************/
	const onChangeAmount = useCallback(
		(lstIndex: number, amount: TNormalizedBN): void => {
			if (shouldBalanceTokens) {
				const initialTokenAmount = amount.raw;
				const initialTokenRate = toBigInt(lst?.[lstIndex].rate.raw);
				const initialTokenWeight = toBigInt(lst?.[lstIndex].weight.raw || 1n);

				const newAmounts = lst.map((item, index): TNormalizedBN => {
					if (item.address === lst[lstIndex].address) {
						return amount;
					}
					const balancedTokenRate = toBigInt(lst?.[index].rate.raw || 1n);
					const balancedTokenWeight = lst?.[index].weight.raw;
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
		[amounts, lst, shouldBalanceTokens]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Once the inputed amounts are updated, we need to fetch the `get_add_lp` and `get_vb` values.
	 ** This is done by using the `useContractReads` hook.
	 ** By comparing the `get_add_lp` value and the `get_vb` value we can calculate the bonus or
	 ** penalty that will be applied to the deposit.
	 **********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		if (amounts.some((item): boolean => item.raw > 0n)) {
			try {
				const data = await readContracts({
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
			amounts.some((item): boolean => item.raw > 0n) &&
			amounts.every(
				(item, index): boolean =>
					item.raw <=
					getBalance({address: lst?.[index]?.address, chainID: Number(process.env.DEFAULT_CHAIN_ID)}).raw
			)
		);
	}, [amounts, getBalance, lst]);

	const shouldApproveDeposit = useMemo((): boolean => {
		return amounts.some((item, index): boolean => item.raw > lst[index].poolAllowance.raw);
	}, [amounts, lst]);

	const shouldApproveDepositStake = useMemo((): boolean => {
		return amounts.some((item, index): boolean => item.raw > lst[index].zapAllowance.raw);
	}, [amounts, lst]);

	/* 🔵 - Yearn Finance **************************************************************************
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
			for (const item of lst) {
				const amount = amounts[lst.indexOf(item)];
				if (amount.raw <= 0n) {
					continue;
				}
				if (amount.raw <= item[key].raw) {
					continue;
				}

				const result = await approveERC20({
					connector: provider,
					chainID: Number(process.env.BASE_CHAIN_ID),
					contractAddress: item.address,
					spenderAddress: spender,
					amount: amount.raw,
					statusHandler: txStatusSetter
				});
				if (result.isSuccessful) {
					onUpdateLST();
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
		[amounts, isActive, lst, onUpdateLST, provider, onRefresh]
	);

	const onDeposit = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');

		const result = await addLiquidityToPool({
			connector: provider,
			chainID: Number(process.env.BASE_CHAIN_ID),
			contractAddress: toAddress(process.env.POOL_ADDRESS),
			amounts: amounts.map((item): bigint => item.raw),
			estimateOut: (estimateOut.value * (10000n - slippage)) / 10000n,
			statusHandler: set_txStatusDeposit
		});
		if (result.isSuccessful) {
			onUpdateLST();
			await onRefresh([ETH_TOKEN, YETH_TOKEN, ...LST]);
			set_amounts(amounts.map((item): TNormalizedBN => ({...item, raw: 0n})));
		}
	}, [amounts, estimateOut.value, isActive, onUpdateLST, provider, onRefresh, slippage]);

	const onDepositAndStake = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');

		const result = await depositAndStake({
			connector: provider,
			chainID: Number(process.env.BASE_CHAIN_ID),
			contractAddress: toAddress(process.env.ZAP_ADDRESS),
			amounts: amounts.map((item): bigint => item.raw),
			estimateOut: (estimateOut.value * (10000n - slippage)) / 10000n,
			statusHandler: set_txStatusDepositStake
		});
		if (result.isSuccessful) {
			onUpdateLST();
			await onRefresh([ETH_TOKEN, YETH_TOKEN, STYETH_TOKEN, ...LST]);
			set_amounts(amounts.map((item): TNormalizedBN => ({...item, raw: 0n})));
		}
	}, [amounts, estimateOut, isActive, onUpdateLST, provider, onRefresh, slippage]);

	return (
		<>
			<div className={'pt-4'}>
				<div className={'mt-5 grid gap-5'}>
					{lst.map(
						(token, index): ReactElement => (
							<LSTDepositForm
								key={token.address}
								token={token}
								amount={toBigInt(amounts[index]?.raw) === -1n ? zeroNormalizedBN : amounts[index]}
								onUpdateAmount={(amount): void => onChangeAmount(index, amount)}
								isDisabled={false}
							/>
						)
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
