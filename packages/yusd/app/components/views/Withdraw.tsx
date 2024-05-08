import React, {useCallback, useEffect, useMemo, useState} from 'react';
import assert from 'assert';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {
	cl,
	formatAmount,
	MAX_UINT_256,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {ESTIMATOR_ABI} from '@libAbi/estimator.abi';
import TokenInput from '@libComponents/TokenInput';
import {readContract} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {IconChevronBottom} from '@yearn-finance/web-lib/icons/IconChevronBottom';
import {removeLiquidityFromPool, removeLiquiditySingleFromPool} from '@yUSD/actions';
import SettingsPopover from '@yUSD/components/SettingsPopover';
import useBasket from '@yUSD/contexts/useBasket';
import useLST from '@yUSD/contexts/useLST';
import {ETH_TOKEN, STYUSD_TOKEN, YUSD_TOKEN} from '@yUSD/tokens';

import {ImageWithFallback} from '../../../../lib/components/ImageWithFallback';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TBasketItem} from '@libUtils/types';

function ViewLSTWithdrawForm({
	token,
	amount,
	onSelect,
	isSelected,
	shouldHideRadio
}: {
	token: TBasketItem;
	amount: TNormalizedBN;
	onSelect: (token: TBasketItem) => void;
	isSelected: boolean;
	shouldHideRadio?: boolean;
}): ReactElement {
	const {getBalance} = useWallet();
	const balanceOf = useMemo((): TNormalizedBN => {
		return toNormalizedBN(getBalance({address: token.address, chainID: token.chainID})?.raw || 0, token.decimals);
	}, [getBalance, token.address, token.chainID, token.decimals]);

	return (
		<div className={'lg:col-span-4'}>
			<div className={'grow-1 flex h-10 w-full items-center justify-center rounded-md bg-neutral-200 p-2'}>
				{!shouldHideRadio && (
					<input
						type={'radio'}
						radioGroup={'singleToken'}
						checked={isSelected}
						className={
							'text-primary checked:bg-primary checked:outline-primary focus-within:bg-primary focus:bg-primary absolute left-12 mt-0.5 size-2 cursor-pointer border-none bg-transparent outline outline-2 outline-offset-2 outline-neutral-600'
						}
						style={{backgroundImage: 'none'}}
						onChange={(): void => onSelect(token)}
					/>
				)}
				<div className={'mr-2 size-6 min-w-[24px]'}>
					<ImageWithFallback
						alt={token.name}
						unoptimized
						src={token.logoURI || ''}
						altSrc={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${token.address}/logo-32.png`}
						width={24}
						height={24}
					/>
				</div>
				<input
					id={token.address}
					className={
						'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none'
					}
					type={'number'}
					min={0}
					maxLength={20}
					disabled
					step={1 / 10 ** (token?.decimals || 18)}
					inputMode={'numeric'}
					placeholder={`0.000000 ${token.symbol}`}
					pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
					value={amount?.normalized || ''}
				/>
			</div>
			<p
				suppressHydrationWarning
				className={'pl-2 pt-1 text-xs text-neutral-600'}>
				{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${token.symbol}`}
			</p>
		</div>
	);
}

function ViewSelectedTokens({
	amounts,
	set_amounts,
	selectedLST,
	set_selectedLST,
	shouldBalanceTokens,
	set_shouldBalanceTokens,
	set_bonusOrPenalty
}: {
	amounts: TNormalizedBN[];
	selectedLST: TBasketItem;
	shouldBalanceTokens: boolean;
	set_amounts: (amounts: TNormalizedBN[]) => void;
	set_selectedLST: (token: TBasketItem) => void;
	set_shouldBalanceTokens: (shouldBalance: boolean) => void;
	set_bonusOrPenalty: (bonusOrPenalty: number) => void;
}): ReactElement {
	const {isActive, provider} = useWeb3();
	const {onRefresh} = useWallet();
	const {slippage} = useLST();
	const {basket, isLoaded} = useBasket();
	const [txStatus, set_txStatus] = useState<TTxStatus>(defaultTxStatus);
	const [fromAmount, set_fromAmount] = useState<TNormalizedBN>(zeroNormalizedBN);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** If the user is updating the fromAmount and the fromToken is yUSD, then update the toAmount
	 ** with the st-yUSD rate.
	 **********************************************************************************************/
	const onUpdateFromAmount = useCallback(
		async (newAmount: TNormalizedBN, selectedLSTIndex: number, shouldBalance: boolean): Promise<void> => {
			set_fromAmount(newAmount);

			if (shouldBalance) {
				if (newAmount.raw > 0n) {
					try {
						const estimatedAmount = await readContract(retrieveConfig(), {
							address: toAddress(process.env.ESTIMATOR_ADDRESS),
							chainId: Number(process.env.DEFAULT_CHAIN_ID),
							abi: ESTIMATOR_ABI,
							functionName: 'get_remove_lp',
							args: [newAmount.raw]
						});
						const updatedAmounts = amounts.map((_, index): TNormalizedBN => {
							return toNormalizedBN(estimatedAmount[index], 18);
						});
						set_bonusOrPenalty(0);
						set_amounts(updatedAmounts);
					} catch (error) {
						set_bonusOrPenalty(0);
						set_amounts(amounts.map((): TNormalizedBN => toNormalizedBN(-1n, 18)));
					}
				} else {
					set_bonusOrPenalty(0);
					set_amounts(amounts.map((): TNormalizedBN => zeroNormalizedBN));
				}
			} else {
				if (newAmount.raw > 0n) {
					try {
						const estimatedAmount = await readContract(retrieveConfig(), {
							address: toAddress(process.env.ESTIMATOR_ADDRESS),
							chainId: Number(process.env.DEFAULT_CHAIN_ID),
							abi: ESTIMATOR_ABI,
							functionName: 'get_remove_single_lp',
							args: [toBigInt(selectedLSTIndex), newAmount.raw]
						});
						const updatedAmounts = amounts.map((_, index): TNormalizedBN => {
							if (index === selectedLSTIndex) {
								return toNormalizedBN(estimatedAmount, 18);
							}
							return zeroNormalizedBN;
						});
						const vb = await readContract(retrieveConfig(), {
							abi: ESTIMATOR_ABI,
							address: toAddress(process.env.ESTIMATOR_ADDRESS),
							functionName: 'get_vb',
							chainId: Number(process.env.DEFAULT_CHAIN_ID),
							args: [updatedAmounts.map((item): bigint => item.raw)]
						});
						set_amounts(updatedAmounts);
						set_bonusOrPenalty(
							((Number(toNormalizedBN(vb, 18).normalized) - Number(newAmount.normalized)) /
								Number(newAmount.normalized)) *
								100
						);
					} catch (e) {
						set_bonusOrPenalty(0);
						set_amounts(
							amounts.map((_, index): TNormalizedBN => {
								if (index === selectedLSTIndex) {
									return toNormalizedBN(-1n, 18);
								}
								return zeroNormalizedBN;
							})
						);
					}
				} else {
					set_bonusOrPenalty(0);
					set_amounts(
						amounts.map((item, index): TNormalizedBN => {
							if (index === selectedLSTIndex) {
								return zeroNormalizedBN;
							}
							return item;
						})
					);
				}
			}
		},
		[amounts, set_amounts, set_bonusOrPenalty]
	);

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
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				contractAddress: STYUSD_TOKEN.address,
				amount: fromAmount.raw,
				minOuts: amounts.map((item): bigint => item.raw),
				statusHandler: set_txStatus
			});
			if (result.isSuccessful) {
				await onRefresh([ETH_TOKEN, STYUSD_TOKEN, YUSD_TOKEN, ...basket]);
			}
		} else {
			const result = await removeLiquiditySingleFromPool({
				connector: provider,
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				contractAddress: STYUSD_TOKEN.address,
				index: toBigInt(selectedLST.index),
				amount: fromAmount.raw,
				minOut: (amounts[selectedLST.index].raw * (10000n - slippage)) / 10000n,
				statusHandler: set_txStatus
			});
			if (result.isSuccessful) {
				await onRefresh([ETH_TOKEN, STYUSD_TOKEN, YUSD_TOKEN, ...basket]);
			}
		}
		set_fromAmount(zeroNormalizedBN);
		set_amounts(amounts.map((): TNormalizedBN => zeroNormalizedBN));
	}, [
		amounts,
		fromAmount.raw,
		isActive,
		provider,
		onRefresh,
		selectedLST?.index,
		set_amounts,
		shouldBalanceTokens,
		slippage,
		basket
	]);

	return (
		<div className={'col-span-18 py-6 pr-0 md:py-10 md:pr-72'}>
			<div className={'flex flex-row items-center justify-between'}>
				<h2 className={'text-xl font-black'}>{'Withdraw'}</h2>
				<SettingsPopover />
			</div>
			<div className={'pt-4'}>
				<div className={'flex flex-row items-center space-x-2'}>
					<label className={'mr-7 flex cursor-pointer flex-row items-center justify-center space-x-3'}>
						<input
							type={'radio'}
							radioGroup={'singleToken'}
							checked={!shouldBalanceTokens}
							className={
								'text-primary checked:bg-primary checked:outline-primary focus-within:bg-primary focus:bg-primary mt-0.5 size-3 border-none bg-transparent outline outline-2 outline-offset-2 outline-neutral-600'
							}
							style={{backgroundImage: 'none'}}
							onChange={(): void => {
								set_shouldBalanceTokens(false);
								if (selectedLST) {
									onUpdateFromAmount(fromAmount, selectedLST.index, false);
								}
							}}
						/>
						<p
							title={'Single token'}
							className={cl(
								'hover-fix pt-1',
								!shouldBalanceTokens ? 'text-primary font-bold' : 'text-neutral-600 font-normal'
							)}>
							{'Single token'}
						</p>
					</label>
					<label className={'flex cursor-pointer flex-row items-center justify-center space-x-3'}>
						<input
							type={'radio'}
							radioGroup={'singleToken'}
							checked={shouldBalanceTokens}
							className={
								'text-primary checked:bg-primary checked:outline-primary focus-within:bg-primary focus:bg-primary mt-0.5 size-3 border-none bg-transparent outline outline-2 outline-offset-2 outline-neutral-600'
							}
							style={{backgroundImage: 'none'}}
							onChange={(): void => {
								set_shouldBalanceTokens(true);
								onUpdateFromAmount(fromAmount, selectedLST.index, true);
							}}
						/>
						<p
							title={'Balanced amounts'}
							className={cl(
								'hover-fix pt-1',
								shouldBalanceTokens ? 'text-primary font-bold' : 'text-neutral-600 font-normal'
							)}>
							{'Balanced amounts'}
						</p>
					</label>
				</div>
				<div className={'mt-5 grid'}>
					<TokenInput
						allowance={toNormalizedBN(MAX_UINT_256, 18)}
						shouldCheckAllowance={false}
						token={YUSD_TOKEN as unknown as TBasketItem}
						value={fromAmount}
						onChange={(v): void => {
							onUpdateFromAmount(v, selectedLST.index, shouldBalanceTokens);
						}}
					/>
					<div className={'mt-6 flex w-full justify-center'}>
						<button className={'cursor-pointer'}>
							<IconChevronBottom className={'size-4'} />
						</button>
					</div>
					<div className={'mt-4'}>
						<div className={'grid gap-5'}>
							{isLoaded ? (
								basket.map(
									(token, index): ReactElement => (
										<ViewLSTWithdrawForm
											key={token.address}
											isSelected={toAddress(selectedLST?.address) === toAddress(token.address)}
											onSelect={(token): void => {
												set_selectedLST(token);
												onUpdateFromAmount(fromAmount, token.index, shouldBalanceTokens);
											}}
											shouldHideRadio={shouldBalanceTokens}
											token={token}
											amount={
												toBigInt(amounts[index]?.raw) === -1n
													? zeroNormalizedBN
													: amounts[index]
											}
										/>
									)
								)
							) : (
								<>
									<div className={'skeleton-lg mb-5 h-10 w-full'}></div>
									<div className={'skeleton-lg mb-5 h-10 w-full'}></div>
									<div className={'skeleton-lg mb-5 h-10 w-full'}></div>
									<div className={'skeleton-lg mb-5 h-10 w-full'}></div>
									<div className={'skeleton-lg mb-5 h-10 w-full'}></div>
									<div className={'skeleton-lg mb-5 h-10 w-full'}></div>
									<div className={'skeleton-lg mb-5 h-10 w-full'}></div>
									<div className={'skeleton-lg mb-5 h-10 w-full'}></div>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
			<div className={'mt-10 flex justify-start'}>
				<Button
					onClick={onWithdraw}
					isBusy={txStatus.pending}
					isDisabled={
						!isActive ||
						!provider ||
						fromAmount.raw === 0n ||
						amounts.every((amount): boolean => amount.raw <= 0n)
					}
					className={'w-full md:w-[184px]'}>
					{'Withdraw'}
				</Button>
			</div>
		</div>
	);
}

function ViewDetails(props: {
	isOutOfBand: boolean;
	minOut: bigint;
	tokenToReceive: string;
	bonusOrPenalty: number;
}): ReactElement {
	const {slippage} = useLST();
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
					<dt className={'col-span-2'}>{'Est. withdraw Bonus/Penalties'}</dt>
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
				</dl>

				<dl className={'grid grid-cols-3 gap-2 pt-4'}>
					<dt className={'col-span-2'}>{'Slippage tolerance'}</dt>
					<dd
						suppressHydrationWarning
						className={'text-right font-bold'}>
						{`${formatAmount(Number(slippage) / 100, 2, 2)}%`}
					</dd>
				</dl>

				{props.minOut > -1 ? (
					<dl className={'grid grid-cols-3 gap-2 pt-4'}>
						<dt className={'col-span-2'}>{`Min ${props.tokenToReceive} to receive`}</dt>
						<dd
							suppressHydrationWarning
							className={'text-right font-bold'}>
							{formatAmount(toNormalizedBN(props.minOut, 18).normalized, 6, 6)}
						</dd>
					</dl>
				) : null}

				<dl className={'pt-4'}>
					<dd
						suppressHydrationWarning
						className={cl('text-left font-bold', props.isOutOfBand ? 'text-red-900' : '')}>
						{props.isOutOfBand ? 'Out of bands' : ''}
					</dd>
				</dl>
			</div>
			<div>
				<h2 className={'text-xl font-black'}>{'Info'}</h2>
				<p className={'whitespace-break-spaces pt-4 text-neutral-600'}>
					{'Choose a single LST to withdraw into, or withdraw into all LSTs (balanced by pool composition).'}
				</p>
			</div>
		</div>
	);
}

function ViewWithdraw(): ReactElement {
	const {slippage} = useLST();
	const {basket} = useBasket();
	const [shouldBalanceTokens, set_shouldBalanceTokens] = useState(true);
	const [selectedLST, set_selectedLST] = useState<TBasketItem>(basket[0]);
	const [amounts, set_amounts] = useState<TNormalizedBN[]>([]);
	const [bonusOrPenalty, set_bonusOrPenalty] = useState<number>(0);

	/**********************************************************************************************
	 ** Initialize the selectedLST to the first token in the basket.
	 **********************************************************************************************/
	useEffect(() => {
		set_selectedLST(basket[0]);
		set_amounts(basket.map((): TNormalizedBN => zeroNormalizedBN));
	}, [basket]);

	return (
		<section className={'relative px-4 md:px-72'}>
			<div
				className={
					'md:grid-cols-30 grid grid-cols-1 divide-x-0 divide-y-2 divide-neutral-300 md:divide-x-2 md:divide-y-0'
				}>
				<ViewSelectedTokens
					amounts={amounts}
					set_amounts={set_amounts}
					selectedLST={selectedLST}
					set_selectedLST={set_selectedLST}
					shouldBalanceTokens={shouldBalanceTokens}
					set_shouldBalanceTokens={set_shouldBalanceTokens}
					set_bonusOrPenalty={set_bonusOrPenalty}
				/>

				<ViewDetails
					minOut={
						shouldBalanceTokens
							? -1n
							: (toBigInt(amounts?.[selectedLST?.index]?.raw) * (10000n - slippage)) / 10000n
					}
					bonusOrPenalty={bonusOrPenalty}
					tokenToReceive={selectedLST?.symbol || 'token'}
					isOutOfBand={amounts.some((amount): boolean => amount.raw === -1n)}
				/>
			</div>
		</section>
	);
}

export default ViewWithdraw;
