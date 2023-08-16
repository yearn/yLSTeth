import React, {useCallback, useMemo, useState} from 'react';
import Link from 'next/link';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import useWallet from 'contexts/useWallet';
import {handleInputChangeEventValue} from 'utils';
import {LST, SHOULD_USE_ALTERNATE_DESIGN} from 'utils/constants';
import {Button} from '@yearn-finance/web-lib/components/Button';
import IconLinkOut from '@yearn-finance/web-lib/icons/IconLinkOut';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {ChangeEvent, ReactElement} from 'react';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

function IconSwapSVG(): ReactElement {
	return (
		<svg
			className={'group fill-white text-purple-300 hover:!fill-purple-300 hover:text-purple-300'}
			width={'48'}
			height={'48'}
			viewBox={'0 0 48 48'}
			fill={'currentColor'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<g id={'Group 3528'}>
				<rect className={'group-hover:fill-purple-300'} id={'Rectangle 579'} x={'0.5'} y={'0.5'} width={'47'} height={'47'} rx={'3.5'} stroke={'currentcolor'}/>
				<path className={'group-hover:fill-white'} id={'Arrow 1'} d={'M19 12C19 11.4477 18.5523 11 18 11C17.4477 11 17 11.4477 17 12L19 12ZM17.2929 36.7071C17.6834 37.0976 18.3166 37.0976 18.7071 36.7071L25.0711 30.3431C25.4616 29.9526 25.4616 29.3195 25.0711 28.9289C24.6805 28.5384 24.0474 28.5384 23.6569 28.9289L18 34.5858L12.3431 28.9289C11.9526 28.5384 11.3195 28.5384 10.9289 28.9289C10.5384 29.3195 10.5384 29.9526 10.9289 30.3431L17.2929 36.7071ZM17 12L17 36L19 36L19 12L17 12Z'} fill={'currentcolor'}/>
				<path className={'group-hover:fill-white'} id={'Arrow 2'} d={'M29 36C29 36.5523 29.4477 37 30 37C30.5523 37 31 36.5523 31 36L29 36ZM30.7071 11.2929C30.3166 10.9024 29.6834 10.9024 29.2929 11.2929L22.9289 17.6569C22.5384 18.0474 22.5384 18.6805 22.9289 19.0711C23.3195 19.4616 23.9526 19.4616 24.3431 19.0711L30 13.4142L35.6569 19.0711C36.0474 19.4616 36.6805 19.4616 37.0711 19.0711C37.4616 18.6805 37.4616 18.0474 37.0711 17.6569L30.7071 11.2929ZM31 36L31 12L29 12L29 36L31 36Z'} fill={'currentcolor'}/>
			</g>
		</svg>
	);
}

function ViewFromToken({token, onChangeToken}: {
	token: TTokenInfo,
	onChangeToken: (token: TTokenInfo) => void
}): ReactElement {
	const {balances} = useWallet();
	const [amountToDeposit, set_amountToDeposit] = useState<TNormalizedBN>(toNormalizedBN(0));

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
			return set_amountToDeposit(toNormalizedBN(balances?.[token.address]?.raw || 0));
		}
		set_amountToDeposit(newAmount);
	}, [balances, token.address, token?.decimals]);

	return (
		<div className={'grid grid-cols-12 gap-x-2'}>
			<div className={'grow-1 col-span-5 flex h-10 w-full items-center justify-start rounded-md bg-white p-2'}>
				<div className={'mr-2 h-6 w-6 min-w-[24px]'}>
					<ImageWithFallback
						alt={token.name}
						unoptimized
						src={token.logoURI}
						width={24}
						height={24} />
				</div>
				<select
					onChange={(e): void => onChangeToken(LST.find((lst): boolean => lst.address === e.target.value) || token)}
					className={'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 outline-none scrollbar-none'}
					defaultValue={token.symbol}>
					{LST.map((lst): ReactElement => (
						<option key={lst.address} value={lst.address}>
							{lst.symbol}
						</option>
					))}
				</select>
			</div>

			<div className={'grow-1 col-span-7 flex h-10 w-full items-center justify-center rounded-md bg-white p-2'}>
				<input
					id={'amountToDeposit'}
					className={'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none scrollbar-none'}
					type={'number'}
					min={0}
					maxLength={20}
					max={balanceOf?.normalized || 0}
					step={1 / 10 ** (token?.decimals || 18)}
					inputMode={'numeric'}
					placeholder={`0.000000 ${token.symbol}`}
					pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
					value={amountToDeposit?.normalized || ''}
					onChange={onChangeAmount} />
				<div className={'ml-2 flex flex-row space-x-1'}>
					<button
						onClick={(): void => set_amountToDeposit(balanceOf)}
						className={cl('px-2 py-1 text-xs rounded-md border border-purple-300 transition-colors bg-purple-300 text-white')}>
						{'Max'}
					</button>
				</div>
			</div>

			<div className={'grow-1 col-span-5 flex w-full items-center justify-start pl-2 pt-1 text-purple-300'}>
				<Link href={`https://etherscan.io/address/${token.address}`} className={'flex flex-row items-center space-x-1 hover:underline'}>
					<small className={'text-xs'}>{'Contract'}</small>
					<IconLinkOut className={'h-4 w-4'} />
				</Link>
			</div>
			<div className={'grow-1 col-span-7 flex w-full items-center justify-start pl-2 pt-1 text-neutral-600'}>
				<div className={'flex flex-row items-center space-x-1'}>
					<small className={'text-xs'}>{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${token.symbol}`}</small>
				</div>
			</div>

		</div>
	);
}

function ViewSwapBox(): ReactElement {
	const [selectedFromLST, set_selectedFromLST] = useState<TTokenInfo>(LST[0]);
	const [selectedToLST, set_selectedToLST] = useState<TTokenInfo>(LST[1]);

	return (
		<div className={cl(SHOULD_USE_ALTERNATE_DESIGN ? 'col-span-7 mb-10 flex w-full flex-col !rounded-md bg-neutral-100 p-4' : 'mb-10 flex w-full flex-col')}>
			<h2 className={'text-xl font-black'}>
				{'Swap tokens'}
			</h2>
			<div className={'pt-4'}>
				<div><b className={'text-purple-300'}>{'APR: 4.20%'}</b></div>

				<div className={'mt-5 grid'}>
					<ViewFromToken
						token={selectedFromLST}
						onChangeToken={(token): void => {
							performBatchedUpdates((): void => {
								if (token.address === selectedToLST.address) {
									set_selectedToLST(selectedFromLST);
								}
								set_selectedFromLST(token);
							});
						}}
					/>
					<div className={'mb-8 mt-6 flex w-full justify-center'}>
						<button
							className={'cursor-pointer'}
							onClick={(): void => {
								performBatchedUpdates((): void => {
									set_selectedFromLST(selectedToLST);
									set_selectedToLST(selectedFromLST);
								});
							}}>
							<IconSwapSVG />
						</button>
					</div>
					<ViewFromToken
						token={selectedToLST}
						onChangeToken={(token): void => {
							performBatchedUpdates((): void => {
								if (token.address === selectedFromLST.address) {
									set_selectedFromLST(selectedToLST);
								}
								set_selectedToLST(token);
							});
						}}
					/>
				</div>


			</div>
			<div className={'absoelute bottom-6 left-6 mt-6 flex justify-end'}>
				<Button className={'w-[184px]'}>
					{'Withdraw'}
				</Button>
			</div>
		</div>
	);
}

function ViewDetails(): ReactElement {
	return (
		<div className={cl(SHOULD_USE_ALTERNATE_DESIGN ? 'col-span-5' : '')}>
			<div className={cl(SHOULD_USE_ALTERNATE_DESIGN ? 'mb-10 flex w-full flex-col !rounded-md bg-neutral-100 p-4' : 'mb-10 flex w-full flex-col')}>
				<h2 className={'text-xl font-black'}>
					{'Details & Info'}
				</h2>
				<dl className={cl('grid grid-cols-3 pt-4', SHOULD_USE_ALTERNATE_DESIGN ? 'gap-2' : 'gap-4')}>
					<dt className={'col-span-2'}>{'yETH per st-yETH'}</dt>
					<dd className={'text-right font-bold'}>{'1,053443'}</dd>

					<dt className={'col-span-2'}>{'Your share of the pool'}</dt>
					<dd className={'text-right font-bold'}>{'0.00%'}</dd>

					<dt className={'col-span-2'}>{'Swap fee'}</dt>
					<dd className={'text-right font-bold'}>{'0.03%'}</dd>
				</dl>
				{SHOULD_USE_ALTERNATE_DESIGN ? (
					<>
						<b className={'mt-6 block text-neutral-900'}>{'Info'}</b>
						<p className={'whitespace-break-spaces pt-4 text-neutral-600'}>
							{'How about to have here a nice copy describing how the Deposit works in details.\n\n'}
							{'This text is just a placeholder.'}
						</p>
					</>
				) : null}
			</div>
		</div>

	);
}

function ViewInfo(): ReactElement {
	return (
		<div className={cl(SHOULD_USE_ALTERNATE_DESIGN ? 'hidden' : 'mb-10 flex w-full flex-col')}>
			<h2 className={'text-xl font-black'}>
				{'Info'}
			</h2>
			<p className={'whitespace-break-spaces pt-4 text-neutral-600'}>
				{'How about to have here a nice copy describing how the Deposit works in details.\n\n'}

				{'For example about some deposits are prohibited because they will result in weight outside of the allowed bands of the LSTs. When the user enters amounts that results in such actions this SHOULD be detected and warned accordingly, possibly disabling deposit until it is corrected.\n\n'}

				{'This text is just a placeholder.'}
			</p>
		</div>
	);
}

function ViewSwap(): ReactElement {
	return (
		<section className={cl(SHOULD_USE_ALTERNATE_DESIGN ? 'relative' : 'relative px-8 py-6')}>
			<div className={cl(SHOULD_USE_ALTERNATE_DESIGN ? 'grid grid-cols-12 gap-4 pt-4' : 'grid grid-cols-3 gap-8')}>
				<ViewSwapBox />
				<ViewDetails />
				<ViewInfo />
			</div>
		</section>
	);
}

export default ViewSwap;
