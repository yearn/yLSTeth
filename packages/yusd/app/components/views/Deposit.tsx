import React, {useState} from 'react';
import {toBigInt} from '@builtbymom/web3/utils';
import Toggle from '@libComponents/toggle';
import {useUpdateEffect} from '@react-hookz/web';
import SettingsPopover from '@yUSD/components/SettingsPopover';

import {DepositDetails} from './Deposit.Details';
import {ViewDepositLST} from './Deposit.LST';

import type {ReactElement} from 'react';
import type {TEstOutWithBonusPenalty} from '@libUtils/types';

function ViewDeposit(): ReactElement {
	const [shouldBalanceTokens, set_shouldBalanceTokens] = useState(false);
	const [estimateOut, set_estimateOut] = useState<TEstOutWithBonusPenalty>({
		value: toBigInt(0),
		bonusOrPenalty: 0,
		vb: toBigInt(0)
	});

	useUpdateEffect((): void => {
		set_estimateOut({value: toBigInt(0), bonusOrPenalty: 0, vb: toBigInt(0)});
	}, []);

	return (
		<section className={'relative px-4 md:px-72'}>
			<div
				className={
					'md:grid-cols-30 grid grid-cols-1 divide-x-0 divide-y-2 divide-neutral-300 md:divide-x-2 md:divide-y-0'
				}>
				<div className={'col-span-18 py-6 pr-0 md:py-10 md:pr-72'}>
					<div className={'flex w-full flex-col !rounded-md bg-neutral-100'}>
						<div className={'flex flex-row items-center justify-between'}>
							<h2 className={'text-xl font-black'}>{'Deposit LST'}</h2>
							<SettingsPopover />
						</div>

						<div className={'pt-4'}>
							<div className={'mt-4 flex flex-row items-center justify-between space-x-2'}>
								<b className={'text-primary'}>{'Balance tokens in proportion'}</b>
								<Toggle
									isEnabled={shouldBalanceTokens}
									onChange={(): void => set_shouldBalanceTokens(!shouldBalanceTokens)}
								/>
							</div>
						</div>

						<ViewDepositLST
							estimateOut={estimateOut}
							onEstimateOut={set_estimateOut}
							shouldBalanceTokens={shouldBalanceTokens}
						/>
					</div>
				</div>
				<DepositDetails
					label={'deposit Bonus/Penalties'}
					estimateOut={estimateOut.value}
					vb={estimateOut.vb}
					bonusOrPenalty={estimateOut.bonusOrPenalty}
				/>
			</div>
		</section>
	);
}

export default ViewDeposit;
