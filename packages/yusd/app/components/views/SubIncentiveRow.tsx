import React, {useMemo} from 'react';
import {formatAmount, formatPercent, toAddress, truncateHex} from '@builtbymom/web3/utils';
import useLST from '@yUSD/contexts/useLST';
import {usePrices} from '@yUSD/contexts/usePrices';

import {ImageWithFallback} from '../../../../lib/components/ImageWithFallback';

import type {ReactElement} from 'react';
import type {TTokenIncentive} from '@libUtils/types';

export function SubIncentiveRow(props: {item: TTokenIncentive}): ReactElement {
	const {getPrice} = usePrices();
	const {totalDepositedETH} = useLST();

	/**************************************************************************
	 ** This method calculates the incentive value
	 **************************************************************************/
	const incentiveValue = useMemo((): number => {
		const price = getPrice({address: props.item.address});
		return props.item.amount.normalized * price.normalized;
	}, [getPrice, props.item]);

	/**************************************************************************
	 ** This method calculates the estimated APR for the incentive
	 **************************************************************************/
	const incentiveAPR = useMemo((): number => {
		const basketTokenPrice = getPrice({address: toAddress(process.env.STYUSD_ADDRESS)});
		return ((incentiveValue * 12) / totalDepositedETH.normalized) * basketTokenPrice.normalized;
	}, [getPrice, totalDepositedETH, incentiveValue]);

	return (
		<div
			aria-label={'content'}
			className={'grid w-full grid-cols-8 py-2 md:w-[52%]'}>
			<div className={'col-span-2 flex w-full flex-row items-center space-x-2'}>
				<div className={'size-6 min-w-[24px]'}>
					<ImageWithFallback
						src={props.item?.logoURI || ''}
						altSrc={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${props.item.address}/logo-32.png`}
						alt={''}
						unoptimized
						width={24}
						height={24}
					/>
				</div>
				<div>
					<p className={'text-xs'}>{props.item?.symbol || truncateHex(props.item.address, 6)}</p>
				</div>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p
					suppressHydrationWarning
					className={'font-number text-xxs pr-1 md:text-xs'}>
					{`${formatAmount(props.item.amount?.normalized || 0, 6, 6)}`}
				</p>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p
					suppressHydrationWarning
					className={'font-number text-xxs pr-1 md:text-xs'}>
					{`$${formatAmount(incentiveValue, 2, 2)}`}
				</p>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p
					suppressHydrationWarning
					className={'font-number text-xxs pr-1 md:text-xs'}>
					{`${formatPercent(incentiveAPR || 0, 4)}`}
				</p>
			</div>
		</div>
	);
}
