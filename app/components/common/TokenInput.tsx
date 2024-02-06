import React, {useCallback, useMemo} from 'react';
import Link from 'next/link';
import IconWarning from 'app/components/icons/IconWarning';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {
	cl,
	ETH_TOKEN_ADDRESS,
	formatAmount,
	handleInputChangeEventValue,
	toAddress,
	toNormalizedBN
} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@yearn-finance/web-lib/components/ImageWithFallback';
import {IconLinkOut} from '@yearn-finance/web-lib/icons/IconLinkOut';

import type {TLST} from 'app/hooks/useLSTData';
import type {ChangeEvent, ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';

type TViewFromToken = {
	token: TLST;
	value: TNormalizedBN;
	allowance: TNormalizedBN;
	onChange: (value: TNormalizedBN) => void;
	label?: string;
	tokens?: TLST[];
	onChangeToken?: (token: TLST) => void;
	shouldCheckBalance?: boolean;
	shouldCheckAllowance?: boolean;
	isDisabled?: boolean;
};
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
	const balanceOf = useMemo((): TNormalizedBN => {
		return toNormalizedBN(getBalance({address: token.address, chainID: token.chainID})?.raw || 0, token.decimals);
	}, [getBalance, token.address, token.chainID, token.decimals]);

	const onChangeAmount = useCallback(
		(e: ChangeEvent<HTMLInputElement>): void => {
			const newAmount = handleInputChangeEventValue(e, token?.decimals || 18);
			return onChange(newAmount);
		},
		[onChange, token?.decimals]
	);

	return (
		<div className={'grid grid-cols-12 gap-x-2'}>
			{label && <div className={'col-span-12 mb-1 flex w-full text-neutral-600'}>{label}</div>}
			<div
				className={cl(
					'grow-1 col-span-5 flex h-10 w-full items-center justify-start rounded-md p-2 bg-neutral-0'
				)}>
				<div className={'mr-2 size-6 min-w-[24px]'}>
					<ImageWithFallback
						alt={token.name}
						unoptimized
						src={token.logoURI || ''}
						width={24}
						height={24}
					/>
				</div>
				{tokens && tokens?.length > 0 ? (
					<select
						onChange={(e): void =>
							onChangeToken?.(
								(tokens || []).find((lst): boolean => lst.address === e.target.value) || token
							)
						}
						className={
							'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 outline-none scrollbar-none'
						}
						value={token.address}
						defaultValue={token.symbol}>
						{(tokens || []).map(
							(lst): ReactElement => (
								<option
									key={lst.address}
									value={lst.address}>
									{lst.symbol}
								</option>
							)
						)}
					</select>
				) : (
					<p>{token.symbol}</p>
				)}
			</div>

			<div
				className={cl(
					'grow-1 col-span-7 flex h-10 w-full items-center justify-center rounded-md p-2',
					isDisabled ? 'bg-neutral-200' : 'bg-neutral-0'
				)}>
				<input
					className={
						'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none scrollbar-none'
					}
					type={'number'}
					min={0}
					maxLength={20}
					max={balanceOf?.normalized || 0}
					step={1 / 10 ** (token?.decimals || 18)}
					inputMode={'numeric'}
					disabled={isDisabled}
					placeholder={`0.000000 ${token.symbol}`}
					pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
					value={value?.normalized || ''}
					onChange={onChangeAmount}
				/>
				<div className={'ml-2 flex flex-row items-center space-x-2'}>
					<div className={'relative size-4'}>
						{shouldCheckAllowance && (
							<div className={'absolute inset-0'}>
								<span className={'tooltip'}>
									<IconWarning
										style={{
											opacity: value.raw > allowance.raw && value.raw <= balanceOf.raw ? 1 : 0
										}}
										className={'size-4 text-neutral-400 transition-opacity'}
									/>
									<span className={'tooltipLight !-inset-x-24 top-full mt-2 !w-auto'}>
										<div
											suppressHydrationWarning
											className={
												'w-fit rounded-md border border-neutral-700 bg-neutral-900 p-1 px-2 text-center text-xs font-medium text-neutral-0'
											}>
											{`You may be prompted to approve the spending of ${formatAmount(
												value.normalized,
												6,
												6
											)} ${token.symbol}`}
										</div>
									</span>
								</span>
							</div>
						)}
						{shouldCheckBalance && (
							<IconWarning
								style={{
									opacity: value.raw > balanceOf.raw ? 1 : 0,
									pointerEvents: value.raw > balanceOf.raw ? 'auto' : 'none'
								}}
								className={'absolute inset-0 size-4 text-[#f59e0b] transition-opacity'}
							/>
						)}
					</div>
					<button
						type={'button'}
						tabIndex={-1}
						onClick={(): void => onChange(balanceOf)}
						className={cl(
							'px-2 py-1 text-xs rounded-md border border-purple-300 transition-colors bg-purple-300 text-white'
						)}>
						{'Max'}
					</button>
				</div>
			</div>

			{toAddress(token.address) !== ETH_TOKEN_ADDRESS && (
				<div className={'grow-1 col-span-5 flex w-full items-center justify-start pl-2 pt-1 text-purple-300'}>
					<Link
						tabIndex={-1}
						href={`https://etherscan.io/address/${token.address}`}
						className={'flex flex-row items-center space-x-1 hover:underline'}>
						<small className={'text-xs'}>{'Contract'}</small>
						<IconLinkOut className={'size-4'} />
					</Link>
				</div>
			)}
			<div className={'grow-1 col-span-7 flex w-full items-center justify-start pl-2 pt-1 text-neutral-600'}>
				<div className={'flex flex-row items-center space-x-1'}>
					<small
						suppressHydrationWarning
						className={'text-xs'}>{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${
						token.symbol
					}`}</small>
				</div>
			</div>
		</div>
	);
}

export default TokenInput;
