import React, {useCallback, useMemo} from 'react';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount, handleInputChangeEventValue, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import IconCircleCross from '@libIcons/IconCircleCross';
import IconWarning from '@libIcons/IconWarning';

import {ImageWithFallback} from '../../../../lib/components/ImageWithFallback';

import type {ChangeEvent, ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TBasketItem} from '@libUtils/types';

function LSTDepositForm({
	token,
	amount,
	onUpdateAmount,
	isDisabled
}: {
	token: TBasketItem;
	amount: TNormalizedBN;
	onUpdateAmount: (amount: TNormalizedBN) => void;
	isDisabled: boolean;
}): ReactElement {
	const {isActive} = useWeb3();
	const {getBalance} = useWallet();
	const balanceOf = useMemo((): TNormalizedBN => {
		return toNormalizedBN(getBalance({address: token.address, chainID: token.chainID})?.raw || 0, token.decimals);
	}, [getBalance, token.address, token.chainID, token.decimals]);

	const onChangeAmount = useCallback(
		(e: ChangeEvent<HTMLInputElement>): void => {
			const newAmount = handleInputChangeEventValue(e, token?.decimals || 18);
			if (!isActive) {
				return onUpdateAmount(newAmount);
			}
			onUpdateAmount(newAmount);
		},
		[isActive, onUpdateAmount, token?.decimals]
	);

	return (
		<div className={'lg:col-span-4'}>
			<div
				className={cl(
					'grow-1 flex h-10 w-full items-center justify-center rounded-md p-2',
					isDisabled ? 'bg-neutral-200' : 'bg-white'
				)}>
				<div className={'mr-2 size-6 min-w-[24px]'}>
					<ImageWithFallback
						alt={token.name}
						unoptimized
						src={token.logoURI || ''}
						altSrc={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${token?.address}/logo-32.png`}
						width={24}
						height={24}
					/>
				</div>
				<input
					id={token.address}
					disabled={isDisabled}
					className={
						'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none'
					}
					type={'number'}
					min={0}
					maxLength={20}
					max={balanceOf?.normalized || 0}
					step={1 / 10 ** (token?.decimals || 18)}
					inputMode={'numeric'}
					placeholder={`0.000000 ${token.symbol}`}
					pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
					value={amount?.normalized || ''}
					onChange={onChangeAmount}
				/>
				<div className={'ml-2 flex flex-row items-center space-x-2'}>
					<div className={'relative size-4'}>
						<div className={'absolute inset-0'}>
							<span className={'tooltip'}>
								<IconWarning
									style={{
										opacity:
											toBigInt(amount.raw) > token.poolAllowance.raw &&
											amount.raw <= balanceOf.raw
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
											amount.normalized,
											6,
											6
										)} ${token.symbol}`}
									</div>
								</span>
							</span>
						</div>
						<IconCircleCross
							style={{
								opacity: amount.raw > balanceOf.raw ? 1 : 0,
								pointerEvents: amount.raw > balanceOf.raw ? 'auto' : 'none'
							}}
							className={'absolute inset-0 size-4 text-red-900 transition-opacity'}
						/>
					</div>
					<button
						type={'button'}
						tabIndex={-1}
						onClick={(): void => onUpdateAmount(balanceOf)}
						className={cl(
							'px-2 py-1 text-xs rounded-md border border-accent transition-colors bg-accent text-white',
							isDisabled ? 'opacity-0 pointer-events-none' : ''
						)}>
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

export {LSTDepositForm};
