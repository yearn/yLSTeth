import React from 'react';
import {formatAmount, formatPercent, formatTAmount, toNormalizedBN} from '@builtbymom/web3/utils';

import {ImageWithFallback} from '../../../../lib/components/ImageWithFallback';

import type {ReactElement} from 'react';
import type {TIncentives} from '@yUSD/hooks/useBootstrapIncentives';

export function SubIncentiveRow(props: {item: TIncentives}): ReactElement {
	return (
		<div
			aria-label={'content'}
			className={'grid w-full grid-cols-8 py-2 md:w-[52%]'}>
			<div className={'col-span-2 flex w-full flex-row items-center space-x-2'}>
				<div className={'size-6 min-w-[24px]'}>
					<ImageWithFallback
						altSrc={props.item?.incentiveToken?.logoURI || ''}
						src={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${props.item.incentiveToken?.address}/logo-32.png`}
						alt={''}
						unoptimized
						width={24}
						height={24}
					/>
				</div>
				<div>
					<p className={'text-xs'}>{props.item.incentiveToken?.symbol}</p>
				</div>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p
					suppressHydrationWarning
					className={'font-number text-xxs pr-1 md:text-xs'}>
					{`${formatTAmount({
						value: toNormalizedBN(props.item.amount, props.item.incentiveToken?.decimals || 18).normalized,
						decimals: props.item.incentiveToken?.decimals || 18
					})}`}
				</p>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p
					suppressHydrationWarning
					className={'font-number text-xxs pr-1 md:text-xs'}>
					{`$${formatAmount(props.item.value, 2, 2)}`}
				</p>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p
					suppressHydrationWarning
					className={'font-number text-xxs pr-1 md:text-xs'}>
					{`${formatPercent(props.item.estimatedAPR || 0, 4)}`}
				</p>
			</div>
		</div>
	);
}
