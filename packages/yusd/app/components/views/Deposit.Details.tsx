import React, {useMemo} from 'react';
import {cl, formatAmount, toNormalizedBN} from '@builtbymom/web3/utils';
import {RenderAmount} from '@libComponents/RenderAmount';

import type {ReactElement} from 'react';

type TDepositDetailsProps = {
	label: string;
	estimateOut: bigint;
	vb: bigint;
	bonusOrPenalty: number;
};
function DepositDetails({label, estimateOut, vb, bonusOrPenalty}: TDepositDetailsProps): ReactElement {
	const bonusOrPenaltyFormatted = useMemo((): string => {
		if (Number.isNaN(bonusOrPenalty)) {
			return formatAmount(0, 2, 2);
		}
		if (bonusOrPenalty === 0) {
			return formatAmount(0, 2, 2);
		}
		if (Number(bonusOrPenalty.toFixed(6)) === 0) {
			return formatAmount(0, 2, 2);
		}
		return bonusOrPenalty.toFixed(6);
	}, [bonusOrPenalty]);

	return (
		<div className={'col-span-12 py-6 pl-0 md:py-10 md:pl-72'}>
			<div className={'mb-10 flex w-full flex-col !rounded-md bg-neutral-100'}>
				<h2 className={'text-xl font-black'}>{'Details'}</h2>
				<dl className={'grid grid-cols-3 gap-2 pt-4'}>
					<dt className={'col-span-2'}>{`Est. ${label}`}</dt>
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

					<dt className={'col-span-2'}>{'Minimum yUSD amount'}</dt>
					<dd
						suppressHydrationWarning
						className={'text-right font-bold'}>
						<RenderAmount
							value={Number(toNormalizedBN(estimateOut, 18).normalized)}
							decimals={6}
						/>
					</dd>

					<dt className={'col-span-2 opacity-60'}>{'ETH staked amount'}</dt>
					<dd
						suppressHydrationWarning
						className={'text-right font-bold opacity-60'}>
						<RenderAmount
							value={Number(toNormalizedBN(vb, 18).normalized)}
							decimals={6}
						/>
					</dd>
				</dl>
			</div>
			<div>
				<h2 className={'text-xl font-black'}>{'Info'}</h2>
				<p className={'whitespace-break-spaces pt-4 text-neutral-600'}>
					{
						'Deposit any of the LSTs (in any combination) to receive yUSD. Or you can deposit and stake to receive st-yUSD and immediately start earning that sweet, sweet liquid staking yield.'
					}
				</p>
			</div>
		</div>
	);
}

export {DepositDetails};
