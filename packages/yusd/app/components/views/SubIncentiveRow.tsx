import React, {useMemo} from 'react';
import {
	formatAmount,
	formatPercent,
	formatTAmount,
	toAddress,
	toNormalizedBN,
	truncateHex
} from '@builtbymom/web3/utils';
import useLST from '@yUSD/contexts/useLST';
import {usePrices} from '@yUSD/contexts/usePrices';

import {ImageWithFallback} from '../../../../lib/components/ImageWithFallback';

import type {ReactElement} from 'react';
import type {TTokenIncentive} from '@libUtils/types';

export function SubIncentiveRow(props: {item: TTokenIncentive}): ReactElement {
	console.log('props.item', props.item);
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
						altSrc={props.item?.logoURI || ''}
						src={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${props.item.incentiveToken.address}/logo-32.png`}
						alt={''}
						unoptimized
						width={24}
						height={24}
					/>
				</div>
				<div>
					<p className={'text-xs'}>
						{props.item?.symbol || truncateHex(props.item.incentiveToken.address, 6)}
					</p>
				</div>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p
					suppressHydrationWarning
					className={'font-number text-xxs pr-1 md:text-xs'}>
					{`${formatTAmount({
						value: toNormalizedBN(props.item.amount, props.item.incentiveToken.decimals).normalized,
						decimals: props.item.incentiveToken.decimals
					})}`}
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
