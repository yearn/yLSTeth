import React from 'react';
import useBootstrap from '@yUSD/contexts/useBootstrap';

import {DepositHeader} from './Deposit.Header';
import {DepositHistory} from './Deposit.History';
import {DepositSelector} from './Deposit.Selector';

import type {ReactElement} from 'react';

function ViewDeposit(): ReactElement {
	const {
		depositHistory: {history, loading, refetchLogs}
	} = useBootstrap();

	return (
		<section className={'grid w-full grid-cols-1 pt-10 md:mb-20 md:px-4 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<DepositHeader isIncentivePeriodClosed={false} />
				<DepositSelector refetchLogs={refetchLogs} />
				<DepositHistory
					history={history || []}
					isLoading={loading.isLoading}
				/>
			</div>
		</section>
	);
}

export default ViewDeposit;
