import React, {useState} from 'react';
import SettingsPopover from 'components/common/SettingsPopover';
import {useUpdateEffect} from '@react-hookz/web';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';

import {DepositDetails} from './Deposit.Details';
import {ViewDepositETH} from './Deposit.Eth';
import {ViewDepositLST} from './Deposit.LST';

import type {ReactElement} from 'react';
import type {TEstOutWithBonusPenalty} from 'utils/types';

function ViewDeposit(): ReactElement {
	const [shouldBalanceTokens, set_shouldBalanceTokens] = useState(true);
	const [shouldDepositEth, set_shouldDepositEth] = useState<boolean>(true);
	const [estimateOut, set_estimateOut] = useState<TEstOutWithBonusPenalty>({
		value: toBigInt(0),
		bonusOrPenalty: 0
	});

	useUpdateEffect((): void => {
		set_estimateOut({value: toBigInt(0), bonusOrPenalty: 0});
	}, [shouldDepositEth]);

	return (
		<section className={'relative px-4 md:px-72'}>
			<div className={'grid grid-cols-1 divide-x-0 divide-y-2 divide-neutral-300 md:grid-cols-30 md:divide-x-2 md:divide-y-0'}>
				<div className={'col-span-18 py-6 pr-0 md:py-10 md:pr-72'}>
					<div className={'flex w-full flex-col !rounded-md bg-neutral-100'}>
						<div className={'flex flex-row items-center justify-between'}>
							<h2 className={'text-xl font-black'}>
								{'Deposit'}
							</h2>
							{shouldDepositEth && <SettingsPopover />}
						</div>
						<div className={'pt-4'}>
							<div className={'flex flex-row items-center space-x-2'}>
								<label className={'mr-7 flex cursor-pointer flex-row items-center justify-center space-x-3'}>
									<input
										type={'radio'}
										radioGroup={'depositType'}
										checked={shouldDepositEth}
										className={'mt-0.5 h-3 w-3 border-none bg-transparent text-purple-300 outline outline-2 outline-offset-2 outline-neutral-600 checked:bg-purple-300 checked:outline-purple-300 focus-within:bg-purple-300 focus:bg-purple-300'}
										style={{backgroundImage: 'none'}}
										onChange={(): void => {
											set_shouldDepositEth(true);
										}} />
									<p
										title={'Deposit ETH'}
										className={cl('hover-fix pt-1', shouldDepositEth ? 'text-purple-300 font-bold' : 'text-neutral-600 font-normal')}>
										{'Deposit ETH'}
									</p>
								</label>
								<label className={'flex cursor-pointer flex-row items-center justify-center space-x-3'}>
									<input
										type={'radio'}
										radioGroup={'depositType'}
										checked={!shouldDepositEth}
										className={'mt-0.5 h-3 w-3 border-none bg-transparent text-purple-300 outline outline-2 outline-offset-2 outline-neutral-600 checked:bg-purple-300 checked:outline-purple-300 focus-within:bg-purple-300 focus:bg-purple-300'}
										style={{backgroundImage: 'none'}}
										onChange={(): void => {
											set_shouldDepositEth(false);
										}} />
									<p
										title={'Deposit LST'}
										className={cl('hover-fix pt-1', !shouldDepositEth ? 'text-purple-300 font-bold' : 'text-neutral-600 font-normal')}>
										{'Deposit LST'}
									</p>
								</label>
							</div>
						</div>

						{shouldDepositEth && (
							<ViewDepositETH
								estimateOut={estimateOut}
								onEstimateOut={set_estimateOut} />
						)}
						{!shouldDepositEth && (
							<ViewDepositLST
								estimateOut={estimateOut}
								onEstimateOut={set_estimateOut}
								shouldBalanceTokens={shouldBalanceTokens} />
						)}
					</div>
				</div>
				<DepositDetails
					label={shouldDepositEth ? 'price impact' : 'deposit Bonus/Penalties'}
					shouldDepositEth={shouldDepositEth}
					estimateOut={estimateOut.value}
					shouldBalanceTokens={shouldBalanceTokens}
					set_shouldBalanceTokens={set_shouldBalanceTokens}
					bonusOrPenalty={estimateOut.bonusOrPenalty}
				/>
			</div>
		</section>
	);
}

export default ViewDeposit;
