import React, {useCallback, useMemo, useState} from 'react';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import useWallet from 'contexts/useWallet';
import {handleInputChangeEventValue} from 'utils';
import {LST} from 'utils/constants';
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
		<div className={'col-span-18 py-10 pr-[72px]'}>
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
			<div className={'mt-10 flex justify-start'}>
				<Button className={'w-[184px]'}>
					{'Withdraw'}
				</Button>
			</div>
		</div>
	);
}

function ViewDetails(): ReactElement {
	return (
		<div className={'col-span-12 py-10 pl-[72px]'}>
			<div className={'mb-10 flex w-full flex-col !rounded-md bg-neutral-100'}>
				<h2 className={'text-xl font-black'}>
					{'Details'}
				</h2>
				<dl className={'grid grid-cols-3 gap-2 pt-4'}>
					<dt className={'col-span-2'}>{'Est. deposit Bonus/Penalties'}</dt>
					<dd className={'text-right font-bold'}>{'0.00%'}</dd>

					<dt className={'col-span-2'}>{'Minimum LP Tokens'}</dt>
					<dd className={'text-right font-bold'}>{'-'}</dd>
				</dl>
			</div>
			<div>
				<h2 className={'text-xl font-black'}>
					{'Info'}
				</h2>
				<p className={'whitespace-break-spaces pt-4 text-neutral-600'}>
					{'Like Draper said - it’s gonna be a super small description. Well, not like ultra small. It will take some room. It’s always nice to put some copy, and it’s good for balance.\n\n'}

					{'We can put useful links here as well.'}
				</p>
			</div>
		</div>
	);
}

function ViewWithdraw(): ReactElement {
	return (
		<section className={'relative px-[72px]'}>
			<div className={'grid grid-cols-30 divide-x-2 divide-neutral-300'}>
				<ViewSelectedTokens />
				<ViewDetails />
			</div>
		</section>
	);
}

export default ViewWithdraw;
