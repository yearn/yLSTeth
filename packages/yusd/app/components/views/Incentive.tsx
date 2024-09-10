import React, {useState} from 'react';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {decodeAsBigInt, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {INCLUSION_INCENTIVE_ABI} from '@libAbi/inclusionIncentives.abi';
import {WEIGHT_INCENTIVE_ABI} from '@libAbi/weightIncentives.abi';
import {readContracts} from '@wagmi/core';
import {EPOCH_DURATION} from '@yUSD/utils/constants';
import {getCurrentEpochNumber} from '@yUSD/utils/epochs';

import {IncentiveHeader} from './Incentive.Header';
import {IncentiveHistory} from './Incentive.History';
import {IncentiveSelector} from './Incentive.Selector';

import type {ReactElement} from 'react';

function ViewIncentive(): ReactElement {
	const [currentTab, set_currentTab] = useState<'current' | 'potential'>('current');
	const [epochToDisplay, set_epochToDisplay] = useState<number>(getCurrentEpochNumber());
	const [areIncentivesOpen, set_areIncentivesLoaded] = useState({
		isWeightIncentiveOpen: false,
		isInclusionIncentiveOpen: false
	});

	/**********************************************************************************************
	 ** Retrieve the deadline and genesis of the weight and inclusion incentives to know if they are
	 ** open or closed.
	 **********************************************************************************************/
	useAsyncTrigger(async () => {
		const data = await readContracts(retrieveConfig(), {
			contracts: [
				{
					abi: WEIGHT_INCENTIVE_ABI,
					address: toAddress(process.env.WEIGHT_INCENTIVES_ADDRESS),
					functionName: 'deposit_deadline',
					chainId: Number(process.env.DEFAULT_CHAIN_ID),
					args: []
				},
				{
					abi: WEIGHT_INCENTIVE_ABI,
					address: toAddress(process.env.WEIGHT_INCENTIVES_ADDRESS),
					functionName: 'genesis',
					chainId: Number(process.env.DEFAULT_CHAIN_ID),
					args: []
				},
				{
					abi: INCLUSION_INCENTIVE_ABI,
					address: toAddress(process.env.INCLUSION_INCENTIVES_ADDRESS),
					functionName: 'deposit_deadline',
					chainId: Number(process.env.DEFAULT_CHAIN_ID),
					args: []
				},
				{
					abi: INCLUSION_INCENTIVE_ABI,
					address: toAddress(process.env.INCLUSION_INCENTIVES_ADDRESS),
					functionName: 'genesis',
					chainId: Number(process.env.DEFAULT_CHAIN_ID),
					args: []
				}
			]
		});
		const weightIncentiveDeadline = decodeAsBigInt(data[0]);
		const weightIncentiveGenesis = decodeAsBigInt(data[1]);
		const inclusionIncentiveDeadline = decodeAsBigInt(data[2]);
		const inclusionIncentiveGenesis = decodeAsBigInt(data[3]);
		const now = toBigInt(Math.floor(Date.now() / 1000));
		const epochDuration = toBigInt(EPOCH_DURATION);

		set_areIncentivesLoaded({
			isWeightIncentiveOpen: (now - weightIncentiveGenesis) % epochDuration <= weightIncentiveDeadline,
			isInclusionIncentiveOpen: (now - inclusionIncentiveGenesis) % epochDuration <= inclusionIncentiveDeadline
		});
	}, []);

	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<IncentiveHeader isIncentivePeriodClosed={areIncentivesOpen.isInclusionIncentiveOpen} />
				<IncentiveSelector incentivePeriodOpen={areIncentivesOpen} />
				<IncentiveHistory
					epochToDisplay={epochToDisplay}
					set_epochToDisplay={set_epochToDisplay}
					currentTab={currentTab}
				/>
			</div>
		</section>
	);
}

export default ViewIncentive;
