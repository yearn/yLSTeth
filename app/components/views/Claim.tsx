import React, {useEffect, useMemo, useState} from 'react';
import useBasket from 'app/contexts/useBasket';
import {useEpoch} from 'app/hooks/useEpoch';
import {useTimer} from 'app/hooks/useTimer';
import {cl, toBigInt} from '@builtbymom/web3/utils';

import {ClaimInclusionIncentives} from './Claim.InclusionIncentives';
import {UnlockTokens} from './Claim.Unlock';
import {ClaimWeightIncentives} from './Claim.WeightIncentives';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	const {endPeriod} = useEpoch();
	const time = useTimer({endTime: Number(endPeriod)});
	return <>{`in ${time}`}</>;
}

function ClaimHeading(): ReactElement {
	return (
		<div className={'mb-10 flex w-3/4 flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>{'Claim'}</h1>
			<b
				suppressHydrationWarning
				className={'font-number mt-4 text-4xl leading-10 text-purple-300'}>
				<Timer />
			</b>
			<p className={'pt-8 text-neutral-700'}>
				{
					'If you voted for any LSTs you’d like to see included in yETH, you’re eligble to recieve incentives from the top 5 protocols (even if you didn’t vote for them).'
				}
			</p>
			<p className={'text-neutral-700'}>{' But hold your horses anon, you can claim soon.'}</p>
		</div>
	);
}

function EpochSelector(props: {
	epochToDisplay: bigint | undefined;
	set_epochToDisplay: (epoch: bigint | undefined) => void;
}): ReactElement {
	const {epoch} = useBasket();

	useEffect(() => {
		if (epoch && !props.epochToDisplay) {
			props.set_epochToDisplay(epoch - 1n);
		}
	}, [epoch, props]);

	const epochs = useMemo((): number[] => {
		const startsAt = 8;
		const epochArray = [];
		for (let i = startsAt; i < (epoch || 0); i++) {
			epochArray.push(i);
		}
		return epochArray;
	}, [epoch]);

	return (
		<div>
			<p className={'mb-1 text-neutral-600'}>{'Select epoch'}</p>
			{epoch ? (
				<div
					className={cl(
						'grow-1 col-span-5 flex h-10 w-full items-center justify-start rounded-md p-2 bg-neutral-100 md:w-[264px] mb-9'
					)}>
					<select
						className={
							'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 outline-none scrollbar-none'
						}
						onChange={(e): void => props.set_epochToDisplay(toBigInt(e.target.value))}
						value={Number(props.epochToDisplay || epoch || 0)}
						defaultValue={Number(epoch)}>
						{epochs.map(
							(index): ReactElement => (
								<option
									key={index}
									value={index}>
									{index === Number(epoch) ? 'Current' : `Epoch ${index}`}
								</option>
							)
						)}
					</select>
				</div>
			) : (
				<div
					className={
						'grow-1 skeleton-lg col-span-5 mb-9 flex h-10 w-full items-center justify-start rounded-md bg-neutral-100 p-2 md:w-[264px]'
					}
				/>
			)}
		</div>
	);
}

function Claim(): ReactElement {
	const [epochToDisplay, set_epochToDisplay] = useState<bigint | undefined>(undefined);

	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<ClaimHeading />
				<EpochSelector
					epochToDisplay={epochToDisplay}
					set_epochToDisplay={set_epochToDisplay}
				/>
				<div className={'flex flex-col gap-10 md:flex-row md:gap-20'}>
					<ClaimInclusionIncentives epoch={toBigInt(epochToDisplay)} />
					<ClaimWeightIncentives epoch={toBigInt(epochToDisplay)} />
					<div>
						<div className={'h-0 md:h-[104px]'} />
						<UnlockTokens />
					</div>
				</div>
			</div>
		</section>
	);
}

export default Claim;
