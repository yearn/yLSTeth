import React, {useCallback, useMemo, useState} from 'react';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import useWallet from 'contexts/useWallet';
import {handleInputChangeEventValue} from 'utils';
import {LST, SHOULD_USE_ALTERNATE_DESIGN} from 'utils/constants';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {ChangeEvent, ReactElement} from 'react';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

function ViewLSTDepositForm({token}: {token: TTokenInfo}): ReactElement {
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
		<div className={'lg:col-span-4'}>
			<div className={'grow-1 flex h-10 w-full items-center justify-center rounded-md bg-white p-2'}>
				<div className={'mr-2 h-6 w-6 min-w-[24px]'}>
					<ImageWithFallback
						alt={token.name}
						unoptimized
						src={token.logoURI}
						width={24}
						height={24} />
				</div>
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
			<p
				suppressHydrationWarning
				className={'pl-2 pt-1 text-xs text-neutral-600'}>
				{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${token.symbol}`}
			</p>
		</div>
	);
}

function ViewSelectedTokens(): ReactElement {
	return (
		<div className={cl(SHOULD_USE_ALTERNATE_DESIGN ? 'col-span-7 mb-10 flex w-full flex-col !rounded-md bg-neutral-100 p-4' : 'mb-10 flex w-full flex-col')}>
			<h2 className={'text-xl font-black'}>
				{'Select tokens'}
			</h2>
			<div className={'pt-4'}>
				<div>
					<b className={'text-purple-300'}>{'Balance tokens proportion'}</b>
					<input type={'checkbox'} className={'ml-2'} />
				</div>

				<div className={'mt-5 grid gap-5'}>
					{LST.map((token): ReactElement => (
						<ViewLSTDepositForm key={token.address} token={token} />
					))}
				</div>
			</div>
			<div className={cl(SHOULD_USE_ALTERNATE_DESIGN ? 'mt-6 flex justify-end' : 'absolute bottom-6 right-6')}>
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
					{'Details'}
				</h2>
				<dl className={cl('grid grid-cols-3 pt-4', SHOULD_USE_ALTERNATE_DESIGN ? 'gap-2' : 'gap-4')}>
					<dt className={'col-span-2'}>{'Est. deposit Bonus/Penalties'}</dt>
					<dd className={'text-right font-bold'}>{'0.00%'}</dd>

					<dt className={'col-span-2'}>{'Minimum LP Tokens'}</dt>
					<dd className={'text-right font-bold'}>{'-'}</dd>
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

function ViewWithdraw(): ReactElement {
	return (
		<section className={cl(SHOULD_USE_ALTERNATE_DESIGN ? 'relative' : 'relative px-8 py-6')}>
			<div className={cl(SHOULD_USE_ALTERNATE_DESIGN ? 'grid grid-cols-12 gap-4 pt-4' : 'grid grid-cols-3 gap-8')}>
				<ViewSelectedTokens />
				<ViewDetails />
				<ViewInfo />
			</div>
		</section>
	);
}

export default ViewWithdraw;
