import React, {useCallback, useEffect, useMemo, useState} from 'react';
import assert from 'assert';
import {erc20Abi} from 'viem';
import {useReadContract, useReadContracts} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	assertAddress,
	cl,
	decodeAsBigInt,
	formatAmount,
	MAX_UINT_256,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {ESTIMATOR_ABI} from '@libAbi/estimator.abi';
import TokenInput from '@libComponents/TokenInput';
import IconSwapSVG from '@libIcons/IconSwap';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {swapLST, swapOutLST} from '@yUSD/actions';
import SettingsPopover from '@yUSD/components/SettingsPopover';
import useBasket from '@yUSD/contexts/useBasket';
import useLST from '@yUSD/contexts/useLST';
import {ETH_TOKEN, YUSD_TOKEN} from '@yUSD/tokens';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TBasketItem} from '@libUtils/types';

type TViewSwapBox = {
	selectedFromLST: TBasketItem;
	selectedToLST: TBasketItem;
	fromAmount: TNormalizedBN;
	toAmount: TNormalizedBN;
	set_selectedFromLST: Dispatch<SetStateAction<TBasketItem>>;
	set_selectedToLST: Dispatch<SetStateAction<TBasketItem>>;
	set_fromAmount: Dispatch<SetStateAction<TNormalizedBN>>;
	set_toAmount: Dispatch<SetStateAction<TNormalizedBN>>;
	set_bonusOrPenalty: Dispatch<SetStateAction<number>>;
	set_rate: Dispatch<SetStateAction<TNormalizedBN>>;
};
function ViewSwapBox({
	selectedFromLST,
	selectedToLST,
	fromAmount,
	toAmount,
	set_selectedFromLST,
	set_selectedToLST,
	set_fromAmount,
	set_toAmount,
	set_bonusOrPenalty,
	set_rate
}: TViewSwapBox): ReactElement {
	const {isActive, provider, address} = useWeb3();
	const {basket, isLoaded, refreshBasket} = useBasket();
	const {slippage} = useLST();
	const {getBalance, onRefresh} = useWallet();
	const [txStatus, set_txStatus] = useState<TTxStatus>(defaultTxStatus);
	const [lastInput, set_lastInput] = useState<'from' | 'to'>('from');

	/* 🔵 - Yearn Finance **************************************************************************
	 ** If the user wants to swap, he first needs to approve the pool to spend the token he wants
	 ** to spend. This is done by calling the approve function on the ERC20 token contract.
	 **********************************************************************************************/
	const {data: allowance, refetch: refreshAllowance} = useReadContract({
		address: selectedFromLST?.address,
		abi: erc20Abi,
		functionName: 'allowance',
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		args: [toAddress(address), toAddress(process.env.POOL_ADDRESS)],
		query: {
			enabled: Boolean(selectedFromLST)
		}
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
	const {data: dyDxVb, error: dyDxVbError} = useReadContracts({
		contracts: [
			{
				abi: ESTIMATOR_ABI,
				address: toAddress(process.env.ESTIMATOR_ADDRESS),
				functionName: 'get_dy',
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				args: [toBigInt(selectedFromLST?.index), toBigInt(selectedToLST?.index), fromAmount.raw]
			},
			{
				abi: ESTIMATOR_ABI,
				address: toAddress(process.env.ESTIMATOR_ADDRESS),
				functionName: 'get_dx',
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				args: [toBigInt(selectedToLST?.index), toBigInt(selectedFromLST?.index), toAmount.raw]
			},
			{
				abi: ESTIMATOR_ABI,
				address: toAddress(process.env.ESTIMATOR_ADDRESS),
				functionName: 'get_vb',
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				args: [
					basket.map((item): bigint => {
						if (item.index === selectedFromLST?.index) {
							return fromAmount.raw;
						}
						return 0n;
					})
				]
			}
		],
		query: {
			enabled: Boolean(selectedFromLST) && Boolean(selectedToLST)
		}
	});

	const {data: vbOut} = useReadContract({
		abi: ESTIMATOR_ABI,
		address: toAddress(process.env.ESTIMATOR_ADDRESS),
		functionName: 'get_vb',
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		args: [
			basket.map((item): bigint => {
				if (!selectedToLST) {
					return 0n;
				}
				if (item.index === selectedToLST.index) {
					return toBigInt(dyDxVb?.[0].result);
				}
				return 0n;
			})
		],
		query: {
			enabled: Boolean(dyDxVb) && Boolean(selectedToLST)
		}
	});

	/* 🔵 - Yearn Finance **************************************************************************
	 ** We use get_dy and get_dx to estimate the amount of tokens we will receive. The difference is:
	 ** - get_dy is using exact input amount, calculate output amount
	 ** - get_dx is using exact output amount, calculate input amount
	 ** We use useContractReads to call both functions at the same time and display the one we want
	 ** based on the user input.
	 **********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		if (dyDxVbError) {
			set_bonusOrPenalty(-100);
			set_rate(toNormalizedBN(0n, 18));
		} else if (dyDxVb && vbOut) {
			const dy = decodeAsBigInt(dyDxVb?.[0]);
			const dx = decodeAsBigInt(dyDxVb?.[1]);
			const vbInput = toNormalizedBN(decodeAsBigInt(dyDxVb?.[2]), 18);
			const vbOutput = toNormalizedBN(vbOut, 18);
			const bonusOrPenalty = Number(vbOutput.normalized) / Number(vbInput.normalized);
			set_bonusOrPenalty((bonusOrPenalty > 1 ? bonusOrPenalty - 1 : -(1 - bonusOrPenalty)) * 100);
			if (fromAmount.raw > 0n) {
				set_rate(toNormalizedBN((toAmount.raw * toBigInt(1e18)) / fromAmount.raw, 18));
			} else {
				set_rate(zeroNormalizedBN);
			}

			if (lastInput === 'from') {
				set_toAmount(toNormalizedBN(dy, 18));
			} else {
				const dxWith1PercentSlippage: bigint = dx + toBigInt(dx / (slippage || 1n));
				set_fromAmount(toNormalizedBN(dxWith1PercentSlippage, 18));
			}
		} else {
			set_bonusOrPenalty(0);
			set_rate(zeroNormalizedBN);
		}
	}, [
		dyDxVb,
		dyDxVbError,
		fromAmount.raw,
		lastInput,
		set_bonusOrPenalty,
		set_fromAmount,
		set_rate,
		set_toAmount,
		slippage,
		toAmount.raw,
		vbOut
	]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** If the user is updating the fromToken, we need to update the toToken if it's the same token
	 ** as the fromToken. This is to prevent the user from swapping the same token to itself.
	 **********************************************************************************************/
	const onUpdateFromToken = useCallback(
		(token: TBasketItem): void => {
			if (token.address === selectedToLST.address) {
				set_selectedToLST(selectedFromLST);
			}
			set_selectedFromLST(token);
		},
		[selectedFromLST, selectedToLST?.address, set_selectedFromLST, set_selectedToLST]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** If the user clicks the switch button, we need to swap the fromToken and toToken.
	 **********************************************************************************************/
	const onSwitchTokens = useCallback((): void => {
		set_lastInput(lastInput === 'from' ? 'to' : 'from');
		set_selectedFromLST(selectedToLST);
		set_selectedToLST(selectedFromLST);
		set_fromAmount(toAmount);
		set_toAmount(fromAmount);
	}, [
		fromAmount,
		lastInput,
		selectedFromLST,
		selectedToLST,
		set_fromAmount,
		set_selectedFromLST,
		set_selectedToLST,
		set_toAmount,
		toAmount
	]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** If the user is updating the toToken, we need to update the fromToken if it's the same token
	 ** as the toToken. This is to prevent the user from swapping the same token to itself.
	 **********************************************************************************************/
	const onUpdateToToken = useCallback(
		(token: TBasketItem): void => {
			if (toAddress(token.address) === toAddress(selectedFromLST?.address)) {
				set_selectedFromLST(selectedToLST);
			}
			set_selectedToLST(token);
		},
		[selectedFromLST?.address, selectedToLST, set_selectedFromLST, set_selectedToLST]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** If the user is updating the fromAmount and the fromToken is yUSD, then update the toAmount
	 ** with the st-yUSD rate.
	 **********************************************************************************************/
	const onUpdateFromAmount = useCallback(
		(newAmount: TNormalizedBN): void => {
			set_fromAmount(newAmount);
			set_lastInput('from');
		},
		[set_fromAmount]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** If the user is updating the toAmount and the fromToken is st-yUSD, then update the fromAmount
	 ** with the st-yUSD rate.
	 **********************************************************************************************/
	const onUpdateToAmount = useCallback(
		(newAmount: TNormalizedBN): void => {
			set_toAmount(newAmount);
			set_lastInput('to');
		},
		[set_toAmount]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Web3 action to allow the pool to spend the user's from token.
	 **********************************************************************************************/
	const onApprove = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(fromAmount.raw > 0n, 'Amount must be greater than 0');
		assertAddress(selectedFromLST?.address, 'Invalid token address');

		const result = await approveERC20({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: selectedFromLST.address,
			spenderAddress: toAddress(process.env.POOL_ADDRESS),
			amount: fromAmount.raw,
			statusHandler: set_txStatus,
			confirmation: 1
		});
		if (result.isSuccessful) {
			refreshAllowance();
			await onRefresh([ETH_TOKEN, ...basket]);
		}
	}, [fromAmount.raw, isActive, provider, onRefresh, refreshAllowance, selectedFromLST?.address, basket]);

	const onSwap = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(selectedFromLST, 'Invalid from token');
		assert(selectedToLST, 'Invalid to token');

		if (lastInput === 'from') {
			const minOutWith1PercentSlippage: bigint = toAmount.raw - toAmount.raw / (slippage || 1n);
			const result = await swapLST({
				connector: provider,
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				contractAddress: toAddress(process.env.POOL_ADDRESS),
				lstTokenFromIndex: toBigInt(selectedFromLST.index),
				lstTokenToIndex: toBigInt(selectedToLST.index),
				amount: fromAmount.raw,
				minAmountOut: minOutWith1PercentSlippage,
				statusHandler: set_txStatus
			});
			if (result.isSuccessful) {
				refreshBasket();
				await onRefresh([ETH_TOKEN, YUSD_TOKEN, ...basket]);
				set_fromAmount(zeroNormalizedBN);
				set_toAmount(zeroNormalizedBN);
			}
		} else if (lastInput === 'to') {
			const maxInWith1PercentSlippage: bigint = fromAmount.raw + fromAmount.raw / (slippage || 1n);
			const result = await swapOutLST({
				connector: provider,
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				contractAddress: toAddress(process.env.POOL_ADDRESS),
				lstTokenFromIndex: toBigInt(selectedFromLST.index),
				lstTokenToIndex: toBigInt(selectedToLST.index),
				amount: toAmount.raw,
				maxAmountIn: maxInWith1PercentSlippage,
				statusHandler: set_txStatus
			});
			if (result.isSuccessful) {
				refreshBasket();
				await onRefresh([ETH_TOKEN, YUSD_TOKEN, ...basket]);
				set_fromAmount(zeroNormalizedBN);
				set_toAmount(zeroNormalizedBN);
			}
		}
	}, [
		isActive,
		provider,
		selectedFromLST,
		selectedToLST,
		lastInput,
		toAmount.raw,
		slippage,
		basket,
		fromAmount.raw,
		refreshBasket,
		onRefresh,
		set_fromAmount,
		set_toAmount
	]);

	return (
		<div className={'col-span-18 py-6 pr-0 md:py-10 md:pr-72'}>
			<div className={'flex w-full flex-col !rounded-md bg-neutral-100'}>
				<div className={'flex flex-row items-center justify-between'}>
					<h2 className={'text-xl font-black'}>{'Swap tokens'}</h2>
					<SettingsPopover />
				</div>
				<div className={'pt-4'}>
					<div className={'mt-5 grid'}>
						<TokenInput
							key={selectedFromLST?.address}
							token={selectedFromLST}
							tokens={basket}
							onChangeToken={onUpdateFromToken}
							value={fromAmount}
							allowance={toNormalizedBN(allowance || 0n, 18)}
							onChange={onUpdateFromAmount}
						/>
						<div className={'mb-8 mt-6 flex w-full justify-center'}>
							<button
								tabIndex={-1}
								disabled={!isLoaded}
								onClick={onSwitchTokens}>
								<IconSwapSVG className={isLoaded ? '' : 'pointer-events-none opacity-40'} />
							</button>
						</div>
						<TokenInput
							key={selectedToLST?.address}
							token={selectedToLST}
							tokens={basket}
							onChangeToken={onUpdateToToken}
							value={toAmount}
							allowance={toNormalizedBN(MAX_UINT_256, 18)}
							shouldCheckAllowance={false}
							shouldCheckBalance={false}
							onChange={onUpdateToAmount}
						/>
					</div>
				</div>
				<div className={'mt-10 flex justify-start'}>
					<Button
						isBusy={txStatus.pending}
						isDisabled={
							!txStatus.none ||
							fromAmount.raw === 0n ||
							toAmount.raw === 0n ||
							!provider ||
							fromAmount.raw >
								getBalance({
									address: selectedFromLST?.address,
									chainID: Number(process.env.DEFAULT_CHAIN_ID)
								})?.raw
						}
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
	selectedFromLST: TBasketItem;
	selectedToLST: TBasketItem;
	fromAmount: TNormalizedBN;
	toAmount: TNormalizedBN;
	bonusOrPenalty: number;
	rate: TNormalizedBN;
};
function ViewDetails(props: TViewDetailsProps): ReactElement {
	const {stats, slippage} = useLST();

	const bonusOrPenaltyFormatted = useMemo((): string => {
		if (Number.isNaN(props.bonusOrPenalty)) {
			return formatAmount(0, 2, 2);
		}
		if (props.bonusOrPenalty === 0) {
			return formatAmount(0, 2, 2);
		}
		if (Number(props.bonusOrPenalty.toFixed(6)) === 0) {
			return formatAmount(0, 2, 2);
		}
		return props.bonusOrPenalty.toFixed(6);
	}, [props.bonusOrPenalty]);

	return (
		<div className={'col-span-12 py-6 pl-0 md:py-10 md:pl-72'}>
			<div className={'mb-10 flex w-full flex-col !rounded-md bg-neutral-100'}>
				<h2 className={'text-xl font-black'}>{'Details'}</h2>
				<dl className={'grid grid-cols-3 gap-2 pt-4'}>
					<dt className={'col-span-2'}>{'Est. swap Bonus/Penalties'}</dt>
					<dd
						suppressHydrationWarning
						className={cl(
							'text-right font-bold',
							-Number(bonusOrPenaltyFormatted) > 1 ? 'text-red-900' : ''
						)}>
						{Number(bonusOrPenaltyFormatted) === -100
							? 'Out of bands'
							: `${formatAmount(bonusOrPenaltyFormatted, 2, 6)}%`}
					</dd>
					<dt className={'col-span-2'}>{'Exchange rate (incl. fees)'}</dt>
					<dd
						suppressHydrationWarning
						className={'text-right font-bold'}>
						{`${formatAmount(props.rate.normalized, 2, 4)}%`}
					</dd>

					<dt className={'col-span-2'}>{'Swap fee'}</dt>
					<dd
						suppressHydrationWarning
						className={'text-right font-bold'}>
						{`${formatAmount(toNormalizedBN(stats.swapFeeRate, 16).normalized, 2, 2)}%`}
					</dd>

					<dt className={'col-span-2'}>{'Slippage tolerance'}</dt>
					<dd
						suppressHydrationWarning
						className={'text-right font-bold'}>
						{`${formatAmount(Number(slippage) / 100, 2, 2)}%`}
					</dd>
				</dl>
			</div>
			<div>
				<h2 className={'text-xl font-black'}>{'Info'}</h2>
				<p className={'whitespace-break-spaces pt-4 text-neutral-600'}>
					{
						'Want to swap between any of the yUSD LSTs?\n\nYou don’t need to go anywhere anon, swap straight from the underlying Curve pool for gud prices and slippage - right here.'
					}
				</p>
			</div>
		</div>
	);
}

function ViewSwap(): ReactElement {
	const {basket} = useBasket();
	const [selectedFromLST, set_selectedFromLST] = useState<TBasketItem>(basket[0]);
	const [selectedToLST, set_selectedToLST] = useState<TBasketItem>(basket[1]);
	const [bonusOrPenalty, set_bonusOrPenalty] = useState<number>(0);
	const [fromAmount, set_fromAmount] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [toAmount, set_toAmount] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [rate, set_rate] = useState<TNormalizedBN>(zeroNormalizedBN);

	/**********************************************************************************************
	 ** Initialize the selectedFromLST to the first token in the basket.
	 ** Initialize the selectedToLST to the second token in the basket.
	 **********************************************************************************************/
	useEffect(() => {
		set_selectedFromLST(basket[0]);
		set_selectedToLST(basket[1]);
	}, [basket]);

	return (
		<section className={'relative px-4 md:px-72'}>
			<div
				className={
					'md:grid-cols-30 grid grid-cols-1 divide-x-0 divide-y-2 divide-neutral-300 md:divide-x-2 md:divide-y-0'
				}>
				<ViewSwapBox
					selectedFromLST={selectedFromLST}
					selectedToLST={selectedToLST}
					fromAmount={fromAmount}
					toAmount={toAmount}
					set_selectedFromLST={set_selectedFromLST}
					set_selectedToLST={set_selectedToLST}
					set_fromAmount={set_fromAmount}
					set_toAmount={set_toAmount}
					set_bonusOrPenalty={set_bonusOrPenalty}
					set_rate={set_rate}
				/>
				<ViewDetails
					selectedFromLST={selectedFromLST}
					selectedToLST={selectedToLST}
					fromAmount={fromAmount}
					toAmount={toAmount}
					bonusOrPenalty={bonusOrPenalty}
					rate={rate}
				/>
			</div>
		</section>
	);
}

export default ViewSwap;
