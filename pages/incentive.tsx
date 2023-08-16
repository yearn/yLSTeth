import React from 'react';
import Incentive from 'components/bootstrapViews/Incentive';

import type {ReactElement} from 'react';

export default function IncentivePage(): ReactElement {
	return (
		<div className={'relative mx-auto mb-40 flex min-h-screen w-full flex-col bg-neutral-0 pt-20'}>
			<div className={'relative mx-auto w-full max-w-5xl'}>
				<Incentive />
			</div>
		</div>
	);
}
