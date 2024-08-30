import React from 'react';
import Incentive from '@yUSD/components/views/Incentive';

import type {ReactElement} from 'react';

export default function IncentivePage(): ReactElement {
	return (
		<div className={'bg-neutral-0 relative mx-auto mb-40 flex min-h-screen w-full flex-col pt-20'}>
			<div className={'relative mx-auto w-full max-w-5xl'}>
				<Incentive />
			</div>
		</div>
	);
}
