import React, {useCallback, useMemo} from 'react';
import Link from 'next/link';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {
	cl,
	ETH_TOKEN_ADDRESS,
	formatAmount,
	handleInputChangeEventValue,
	isZeroAddress,
	toAddress,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import IconWarning from '@libIcons/IconWarning';
import {IconLinkOut} from '@yearn-finance/web-lib/icons/IconLinkOut';

import {ImageWithFallback} from './ImageWithFallback';

import type {ChangeEvent, ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TBasketItem} from '@libUtils/types';

type TViewFromToken = {
	token: TBasketItem;
	value: TNormalizedBN;
	allowance: TNormalizedBN;
	onChange: (value: TNormalizedBN) => void;
	label?: string;
	tokens?: TBasketItem[];
	onChangeToken?: (token: TBasketItem) => void;
	shouldCheckBalance?: boolean;
	shouldCheckAllowance?: boolean;
	isDisabled?: boolean;
};

function TokenSelector(props: {
	token: TBasketItem;
	tokens?: TBasketItem[];
	onChangeToken?: (token: TBasketItem) => void;
}): ReactElement {
	if (!props.token) {
		return <div className={'skeleton-lg col-span-5 h-10 w-full'} />;
	}
	return (
		<div
			className={cl('grow-1 col-span-5 flex h-10 w-full items-center justify-start rounded-md p-2 bg-neutral-0')}>
			<div className={'mr-2 size-6 min-w-[24px]'}>
				<ImageWithFallback
					alt={props.token.name}
					unoptimized
					src={props.token.logoURI || ''}
					altSrc={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${props.token.address}/logo-32.png`}
					width={24}
					height={24}
				/>
			</div>
			{props.tokens && props.tokens?.length > 0 ? (
				<select
					onChange={(e): void =>
						props.onChangeToken?.(
							(props.tokens || []).find((item): boolean => item.address === e.target.value) || props.token
						)
					}
					className={
						'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 outline-none'
					}
					value={props.token.address}
					defaultValue={props.token.symbol}>
					{(props.tokens || []).map(
						(item): ReactElement => (
							<option
								key={item.address}
								value={item.address}>
								{item.symbol}
							</option>
						)
					)}
				</select>
			) : (
				<p>{props.token?.symbol}</p>
			)}
		</div>
	);
}

function TokenAmount(props: TViewFromToken): ReactElement {
	const {getBalance} = useWallet();

	/**********************************************************************************************
	 ** Get the balance of the token
	 **********************************************************************************************/
	const balanceOf = useMemo((): TNormalizedBN => {
		if (isZeroAddress(props.token?.address)) {
			return zeroNormalizedBN;
		}
		return toNormalizedBN(
			getBalance({address: props.token.address, chainID: props.token.chainID})?.raw || 0,
			props.token.decimals
		);
	}, [getBalance, props.token?.address, props.token?.chainID, props.token?.decimals]);

	/**********************************************************************************************
	 ** Handle the change of the amount
	 **********************************************************************************************/
	const onChangeAmount = useCallback(
		(e: ChangeEvent<HTMLInputElement>): void => {
			const newAmount = handleInputChangeEventValue(e, props.token?.decimals || 18);
			return props.onChange(newAmount);
		},
		[props.onChange, props.token?.decimals] // eslint-disable-line react-hooks/exhaustive-deps
	);

	if (!props.token) {
		return <div className={'skeleton-lg col-span-7 h-10 w-full'} />;
	}
	return (
		<div
			className={cl(
				'grow-1 col-span-7 flex h-10 w-full items-center justify-center rounded-md p-2',
				props.isDisabled ? 'bg-neutral-200' : 'bg-neutral-0'
			)}>
			<input
				className={
					'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none'
				}
				type={'number'}
				min={0}
				maxLength={20}
				max={balanceOf?.normalized || 0}
				step={1 / 10 ** (props.token?.decimals || 18)}
				inputMode={'numeric'}
				disabled={props.isDisabled}
				placeholder={`0.000000 ${props.token?.symbol}`}
				pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
				value={props.value?.normalized || ''}
				onChange={onChangeAmount}
			/>
			<div className={'ml-2 flex flex-row items-center space-x-2'}>
				<div className={'relative size-4'}>
					{props.shouldCheckAllowance && (
						<div className={'absolute inset-0'}>
							<span className={'tooltip'}>
								<IconWarning
									style={{
										opacity:
											props.value.raw > props.allowance.raw && props.value.raw <= balanceOf.raw
												? 1
												: 0
									}}
									className={'size-4 text-neutral-400 transition-opacity'}
								/>
								<span className={'tooltipLight !-inset-x-24 top-full mt-2 !w-auto'}>
									<div
										suppressHydrationWarning
										className={
											'text-neutral-0 w-fit rounded-md border border-neutral-700 bg-neutral-900 p-1 px-2 text-center text-xs font-medium'
										}>
										{`You may be prompted to approve the spending of ${formatAmount(
											props.value.normalized,
											6,
											6
										)} ${props.token?.symbol}`}
									</div>
								</span>
							</span>
						</div>
					)}
					{props.shouldCheckBalance && (
						<IconWarning
							style={{
								opacity: props.value.raw > balanceOf.raw ? 1 : 0,
								pointerEvents: props.value.raw > balanceOf.raw ? 'auto' : 'none'
							}}
							className={'absolute inset-0 size-4 text-[#f59e0b] transition-opacity'}
						/>
					)}
				</div>
				<button
					type={'button'}
					tabIndex={-1}
					onClick={(): void => props.onChange(balanceOf)}
					className={cl(
						'px-2 py-1 text-xs rounded-md border border-primary transition-colors bg-primary text-white'
					)}>
					{'Max'}
				</button>
			</div>
		</div>
	);
}

function TokenInput({
	token,
	value,
	onChange,
	tokens,
	onChangeToken,
	allowance,
	label,
	shouldCheckAllowance = true,
	shouldCheckBalance = true,
	isDisabled = false
}: TViewFromToken): ReactElement {
	const {getBalance} = useWallet();

	/**********************************************************************************************
	 ** Get the balance of the token
	 **********************************************************************************************/
	const balanceOf = useMemo((): TNormalizedBN => {
		if (isZeroAddress(token?.address)) {
			return zeroNormalizedBN;
		}
		return toNormalizedBN(getBalance({address: token.address, chainID: token.chainID})?.raw || 0, token.decimals);
	}, [getBalance, token?.address, token?.chainID, token?.decimals]);

	return (
		<div className={'grid grid-cols-12 gap-x-2'}>
			{label && <div className={'col-span-12 mb-1 flex w-full text-neutral-600'}>{label}</div>}
			<TokenSelector
				token={token}
				tokens={tokens}
				onChangeToken={onChangeToken}
			/>
			<TokenAmount
				value={value}
				onChange={onChange}
				token={token}
				allowance={allowance}
				shouldCheckAllowance={shouldCheckAllowance}
				shouldCheckBalance={shouldCheckBalance}
				isDisabled={isDisabled}
			/>

			{token && toAddress(token.address) !== ETH_TOKEN_ADDRESS && (
				<div className={'grow-1 text-primary col-span-5 flex w-full items-center justify-start pl-2 pt-1'}>
					<Link
						tabIndex={-1}
						href={`https://etherscan.io/address/${token?.address}`}
						className={'flex flex-row items-center space-x-1 hover:underline'}>
						<small className={'text-xs'}>{'Contract'}</small>
						<IconLinkOut className={'size-4'} />
					</Link>
				</div>
			)}
			<div
				className={cl(
					'grow-1 col-span-7 flex w-full items-center justify-start pl-2 pt-1 text-neutral-600',
					token ? '' : 'invisible pointer-events-none'
				)}>
				<div className={'flex flex-row items-center space-x-1'}>
					<small
						suppressHydrationWarning
						className={'text-xs'}>
						{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${token?.symbol}`}
					</small>
				</div>
			</div>
		</div>
	);
}

export default TokenInput;
