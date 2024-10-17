import React from 'react';

import {IncentiveHeader} from './Incentive.Header';
import {IncentiveHistory} from './Incentive.History';
import {IncentiveSelector} from './Incentive.Selector';

import type {ReactElement} from 'react';

function ViewIncentive(): ReactElement {
	return (
		<section className={'grid w-full grid-cols-1 pt-10 md:mb-20 md:px-4 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<IncentiveHeader />
				<IncentiveSelector />
				<IncentiveHistory />
			</div>
		</section>
	);
}

export default ViewIncentive;
