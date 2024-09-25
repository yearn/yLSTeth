import React, {useState} from 'react';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {decodeAsBigInt, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import BOOTSTRAP_ABI_NEW from '@libAbi/bootstrap.abi.new';
import {readContracts} from '@wagmi/core';
import {getCurrentEpochNumber} from '@yUSD/utils/epochs';

import {IncentiveHeader} from './Incentive.Header';
import {IncentiveHistory} from './Incentive.History';
import {IncentiveSelector} from './Incentive.Selector';

import type {ReactElement} from 'react';

function ViewIncentive(): ReactElement {
	const [epochToDisplay, set_epochToDisplay] = useState<number>(getCurrentEpochNumber());
	const [areIncentivesOpen, set_areIncentivesLoaded] = useState(false);

	/**********************************************************************************************
	 ** Retrieve the deadline and genesis of the weight and inclusion incentives to know if they are
	 ** open or closed.
	 **********************************************************************************************/
	useAsyncTrigger(async () => {
		const data = await readContracts(retrieveConfig(), {
			contracts: [
				{
					abi: BOOTSTRAP_ABI_NEW,
					address: toAddress(process.env.DEPOSIT_ADDRESS),
					functionName: 'incentive_begin',
					chainId: Number(process.env.DEFAULT_CHAIN_ID),
					args: []
				},
				{
					abi: BOOTSTRAP_ABI_NEW,
					address: toAddress(process.env.DEPOSIT_ADDRESS),
					functionName: 'incentive_end',
					chainId: Number(process.env.DEFAULT_CHAIN_ID),
					args: []
				}
			]
		});
		const incentiveBegin = decodeAsBigInt(data[0]);
		const incentiveEnd = decodeAsBigInt(data[1]);
		const now = toBigInt(Math.floor(Date.now() / 1000));

		set_areIncentivesLoaded(now - incentiveBegin <= incentiveEnd);
	}, []);

	return (
		<section className={'grid w-full grid-cols-1 pt-10 md:mb-20 md:px-4 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<IncentiveHeader isIncentivePeriodClosed={!areIncentivesOpen} />
				<IncentiveSelector incentivePeriodOpen={areIncentivesOpen} />
				<IncentiveHistory
					epochToDisplay={epochToDisplay}
					set_epochToDisplay={set_epochToDisplay}
				/>
			</div>
		</section>
	);
}

export default ViewIncentive;
