import React, {useCallback, useEffect, useMemo, useState} from 'react';
import assert from 'assert';
import SettingsPopover from 'components/common/SettingsPopover';
import TokenInput from 'components/common/TokenInput';
import IconSwapSVG from 'components/icons/IconSwap';
import useLST from 'contexts/useLST';
import useWallet from 'contexts/useWallet';
import {ESTIMATOR_ABI} from 'utils/abi/estimator.abi';
import {approveERC20, swapLST, swapOutLST} from 'utils/actions';
import {LST} from 'utils/constants';
import {ETH_TOKEN, YETH_TOKEN} from 'utils/tokens';
import {erc20ABI, useContractRead, useContractReads} from 'wagmi';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {MAX_UINT_256} from '@yearn-finance/web-lib/utils/constants';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TLST} from 'hooks/useLSTData';
import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TUseBalancesTokens} from '@yearn-finance/web-lib/hooks/useBalances';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

type TViewSwapBox = {
	selectedFromLST: TLST
	selectedToLST: TLST
	fromAmount: TNormalizedBN
	toAmount: TNormalizedBN
	set_selectedFromLST: Dispatch<SetStateAction<TLST>>
	set_selectedToLST: Dispatch<SetStateAction<TLST>>
	set_fromAmount: Dispatch<SetStateAction<TNormalizedBN>>
	set_toAmount: Dispatch<SetStateAction<TNormalizedBN>>
}
function ViewSwapBox({
	selectedFromLST,
	selectedToLST,
	fromAmount,
	toAmount,
	set_selectedFromLST,
	set_selectedToLST,
	set_fromAmount,
	set_toAmount
}: TViewSwapBox): ReactElement {
	const {isActive, provider, address} = useWeb3();
	const {lst, onUpdateLST, slippage} = useLST();
	const {refresh} = useWallet();
	const [txStatus, set_txStatus] = useState<TTxStatus>(defaultTxStatus);
	const [lastInput, set_lastInput] = useState<'from' | 'to'>('from');

	/* 🔵 - Yearn Finance **************************************************************************
	** If the user wants to swap, he first needs to approve the pool to spend the token he wants
	** to spend. This is done by calling the approve function on the ERC20 token contract.
	**********************************************************************************************/
	const {data: allowance, refetch: refreshAllowance} = useContractRead({
		address: selectedFromLST.address,
		abi: erc20ABI,
		functionName: 'allowance',
		args: [toAddress(address), toAddress(process.env.POOL_ADDRESS)]
	});
	const hasAllowance = useMemo((): boolean => {
		if (!fromAmount || !allowance) {
			return false;
		}
		return toBigInt(allowance) >= toBigInt(fromAmount.raw);
	}, [allowance, fromAmount]);

	/* 🔵 - Yearn Finance **************************************************************************
	** We use get_dy and get_dx to estimate the amount of tokens we will receive. The difference is:
	** - get_dy is using exact input amount, calculate output amount
	** - get_dx is using exact output amount, calculate input amount
	** We use useContractReads to call both functions at the same time and display the one we want
	** based on the user input.
	**********************************************************************************************/
	const {data: dyAndDx} = useContractReads({
		enabled: true,
		keepPreviousData: true,
		contracts: [
			{
				abi: ESTIMATOR_ABI,
				address: toAddress(process.env.ESTIMATOR_ADDRESS),
				functionName: 'get_dy',
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				args: [toBigInt(selectedFromLST.index), toBigInt(selectedToLST.index), fromAmount.raw]
			},
			{
				abi: ESTIMATOR_ABI,
				address: toAddress(process.env.ESTIMATOR_ADDRESS),
				functionName: 'get_dx',
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				args: [toBigInt(selectedToLST.index), toBigInt(selectedFromLST.index), toAmount.raw]
			}
		]
	});

	useEffect((): void => {
		if (dyAndDx) {
			const dy = toBigInt(dyAndDx?.[0]?.result as bigint);
			const dx = toBigInt(dyAndDx?.[1]?.result as bigint);
			if (lastInput === 'from') {
				set_toAmount(toNormalizedBN(dy));
			} else {
				const dxWith1PercentSlippage: bigint = dx + toBigInt(dx / (slippage || 1n));
				set_fromAmount(toNormalizedBN(dxWith1PercentSlippage));
			}
		}
	}, [dyAndDx, lastInput, set_fromAmount, set_toAmount, slippage]);


	/* 🔵 - Yearn Finance **************************************************************************
	** If the user is updating the fromToken, we need to update the toToken if it's the same token
	** as the fromToken. This is to prevent the user from swapping the same token to itself.
	**********************************************************************************************/
	const onUpdateFromToken = useCallback((token: TLST): void => {
		performBatchedUpdates((): void => {
			if (token.address === selectedToLST.address) {
				set_selectedToLST(selectedFromLST);
			}
			set_selectedFromLST(token);
		});
	}, [selectedFromLST, selectedToLST.address, set_selectedFromLST, set_selectedToLST]);

	/* 🔵 - Yearn Finance **************************************************************************
	** If the user clicks the switch button, we need to swap the fromToken and toToken.
	**********************************************************************************************/
	const onSwitchTokens = useCallback((): void => {
		performBatchedUpdates((): void => {
			set_lastInput(lastInput === 'from' ? 'to' : 'from');
			set_selectedFromLST(selectedToLST);
			set_selectedToLST(selectedFromLST);
			set_fromAmount(toAmount);
			set_toAmount(fromAmount);
		});
	}, [fromAmount, lastInput, selectedFromLST, selectedToLST, set_fromAmount, set_selectedFromLST, set_selectedToLST, set_toAmount, toAmount]);

	/* 🔵 - Yearn Finance **************************************************************************
	** If the user is updating the toToken, we need to update the fromToken if it's the same token
	** as the toToken. This is to prevent the user from swapping the same token to itself.
	**********************************************************************************************/
	const onUpdateToToken = useCallback((token: TLST): void => {
		performBatchedUpdates((): void => {
			if (token.address === selectedFromLST.address) {
				set_selectedFromLST(selectedToLST);
			}
			set_selectedToLST(token);
		});
	}, [selectedFromLST.address, selectedToLST, set_selectedFromLST, set_selectedToLST]);

	/* 🔵 - Yearn Finance **************************************************************************
	** If the user is updating the fromAmount and the fromToken is yETH, then update the toAmount
	** with the st-yETH rate.
	**********************************************************************************************/
	const onUpdateFromAmount = useCallback((newAmount: TNormalizedBN): void => {
		performBatchedUpdates((): void => {
			set_fromAmount(newAmount);
			set_lastInput('from');
		});
	}, [set_fromAmount]);

	/* 🔵 - Yearn Finance **************************************************************************
	** If the user is updating the toAmount and the fromToken is st-yETH, then update the fromAmount
	** with the st-yETH rate.
	**********************************************************************************************/
	const onUpdateToAmount = useCallback((newAmount: TNormalizedBN): void => {
		performBatchedUpdates((): void => {
			set_toAmount(newAmount);
			set_lastInput('to');
		});
	}, [set_toAmount]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Web3 action to allow the pool to spend the user's from token.
	**********************************************************************************************/
	const onApprove = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(fromAmount.raw > 0n, 'Amount must be greater than 0');

		const result = await approveERC20({
			connector: provider,
			contractAddress: selectedFromLST.address,
			spenderAddress: toAddress(process.env.POOL_ADDRESS),
			amount: fromAmount.raw,
			statusHandler: set_txStatus
		});
		if (result.isSuccessful) {
			refreshAllowance();
			await refresh([
				{...ETH_TOKEN, token: ETH_TOKEN.address},
				...lst.map((item): TUseBalancesTokens => ({...item, token: item.address}))
			]);
		}
	}, [fromAmount.raw, isActive, provider, refresh, refreshAllowance, selectedFromLST.address, lst]);


	const onSwap = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');

		if (lastInput === 'from') {
			const minOutWith1PercentSlippage: bigint = toAmount.raw - (toAmount.raw / (slippage || 1n));
			const result = await swapLST({
				connector: provider,
				contractAddress: toAddress(process.env.POOL_ADDRESS),
				lstTokenFromIndex: toBigInt(selectedFromLST.index),
				lstTokenToIndex: toBigInt(selectedToLST.index),
				amount: fromAmount.raw,
				minAmountOut: minOutWith1PercentSlippage,
				statusHandler: set_txStatus
			});
			if (result.isSuccessful) {
				onUpdateLST();
				await refresh([
					{...ETH_TOKEN, token: ETH_TOKEN.address},
					{...YETH_TOKEN, token: YETH_TOKEN.address},
					...LST.map((item): TUseBalancesTokens => ({...item, token: item.address}))
				]);
				performBatchedUpdates((): void => {
					set_fromAmount(toNormalizedBN(0n));
					set_toAmount(toNormalizedBN(0n));
				});
			}
		} else if (lastInput === 'to') {
			const maxInWith1PercentSlippage: bigint = fromAmount.raw + (fromAmount.raw / (slippage || 1n));
			const result = await swapOutLST({
				connector: provider,
				contractAddress: toAddress(process.env.POOL_ADDRESS),
				lstTokenFromIndex: toBigInt(selectedFromLST.index),
				lstTokenToIndex: toBigInt(selectedToLST.index),
				amount: toAmount.raw,
				maxAmountIn: maxInWith1PercentSlippage,
				statusHandler: set_txStatus
			});
			if (result.isSuccessful) {
				onUpdateLST();
				await refresh([
					{...ETH_TOKEN, token: ETH_TOKEN.address},
					{...YETH_TOKEN, token: YETH_TOKEN.address},
					...LST.map((item): TUseBalancesTokens => ({...item, token: item.address}))
				]);
				performBatchedUpdates((): void => {
					set_fromAmount(toNormalizedBN(0n));
					set_toAmount(toNormalizedBN(0n));
				});
			}
		}
	}, [isActive, provider, lastInput, toAmount.raw, slippage, selectedFromLST.index, selectedToLST.index, fromAmount.raw, onUpdateLST, refresh, set_fromAmount, set_toAmount]);

	return (
		<div className={'col-span-18 py-6 pr-0 md:py-10 md:pr-72'}>
			<div className={'flex w-full flex-col !rounded-md bg-neutral-100'}>
				<div className={'flex flex-row items-center justify-between'}>
					<h2 className={'text-xl font-black'}>
						{'Swap tokens'}
					</h2>
					<SettingsPopover />
				</div>
				<div className={'pt-4'}>
					<div className={'mt-5 grid'}>
						<TokenInput
							key={selectedFromLST.address}
							token={selectedFromLST}
							tokens={lst}
							onChangeToken={onUpdateFromToken}
							value={fromAmount}
							allowance={toNormalizedBN(allowance || 0n)}
							onChange={onUpdateFromAmount} />
						<div className={'mb-8 mt-6 flex w-full justify-center'}>
							<button
								tabIndex={-1}
								className={'cursor-pointer'}
								onClick={onSwitchTokens}>
								<IconSwapSVG />
							</button>
						</div>
						<TokenInput
							key={selectedToLST.address}
							token={selectedToLST}
							tokens={lst}
							onChangeToken={onUpdateToToken}
							value={toAmount}
							allowance={toNormalizedBN(MAX_UINT_256)}
							shouldCheckAllowance={false}
							shouldCheckBalance={false}
							onChange={onUpdateToAmount} />
					</div>


				</div>
				<div className={'mt-10 flex justify-start'}>
					<Button
						isBusy={txStatus.pending}
						isDisabled={!txStatus.none || fromAmount.raw === 0n || !provider || toAmount.raw === 0n}
						onClick={(): void => {
							if (!hasAllowance) {
								onApprove();
							} else {
								onSwap();
							}
						}}
						className={'w-full md:w-[184px]'}>
						{hasAllowance ? 'Swap' : 'Approve'}
					</Button>
				</div>
			</div>
		</div>
	);
}

type TViewDetailsProps = {
	exchangeRate: TNormalizedBN;
}
function ViewDetails({exchangeRate}: TViewDetailsProps): ReactElement {
	const {stats, slippage} = useLST();

	return (
		<div className={'col-span-12 py-6 pl-0 md:py-10 md:pl-72'}>
			<div className={'mb-10 flex w-full flex-col !rounded-md bg-neutral-100'}>
				<h2 className={'text-xl font-black'}>
					{'Details'}
				</h2>
				<dl className={'grid grid-cols-3 gap-2 pt-4'}>
					<dt className={'col-span-2'}>{'Exchange rate (incl. fees)'}</dt>
					<dd suppressHydrationWarning className={'text-right font-bold'}>
						{`${formatAmount(exchangeRate.normalized, 2, 4)}%`}
					</dd>

					<dt className={'col-span-2'}>{'Swap fee'}</dt>
					<dd suppressHydrationWarning className={'text-right font-bold'}>
						{`${formatAmount(toNormalizedBN(stats.swapFeeRate, 16).normalized, 2, 2)}%`}
					</dd>

					<dt className={'col-span-2'}>{'Slippage tolerance'}</dt>
					<dd suppressHydrationWarning className={'text-right font-bold'}>
						{`${formatAmount(Number(slippage) / 100, 2, 2)}%`}
					</dd>
				</dl>
			</div>
			<div>
				<h2 className={'text-xl font-black'}>
					{'Info'}
				</h2>
				<p className={'whitespace-break-spaces pt-4 text-neutral-600'}>
					{'Want to swap between any of the yETH LSTs?\n\nYou don’t need to go anywhere anon, swap straight from the underlying Curve pool for gud prices and slippage - right here.'}
				</p>
			</div>
		</div>

	);
}

function ViewSwap(): ReactElement {
	const {lst} = useLST();
	const [selectedFromLST, set_selectedFromLST] = useState<TLST>(lst[0]);
	const [selectedToLST, set_selectedToLST] = useState<TLST>(lst[1]);
	const [fromAmount, set_fromAmount] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [toAmount, set_toAmount] = useState<TNormalizedBN>(toNormalizedBN(0));

	const exchangeRate = useMemo((): TNormalizedBN => {
		if (fromAmount.raw === 0n) {
			return toNormalizedBN(0n);
		}

		return toNormalizedBN(toAmount.raw * toBigInt(1e18) / fromAmount.raw);
	}, [fromAmount.raw, toAmount.raw]);

	return (
		<section className={'relative px-4 md:px-72'}>
			<div className={'grid grid-cols-1 divide-x-0 divide-y-2 divide-neutral-300 md:grid-cols-30 md:divide-x-2 md:divide-y-0'}>
				<ViewSwapBox
					selectedFromLST={selectedFromLST}
					selectedToLST={selectedToLST}
					fromAmount={fromAmount}
					toAmount={toAmount}
					set_selectedFromLST={set_selectedFromLST}
					set_selectedToLST={set_selectedToLST}
					set_fromAmount={set_fromAmount}
					set_toAmount={set_toAmount} />
				<ViewDetails exchangeRate={exchangeRate} />
			</div>
		</section>
	);
}

export default ViewSwap;
