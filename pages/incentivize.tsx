import React from 'react';
import Incentivize from 'components/views/Incentivize';

import type {ReactElement} from 'react';

export default function IncentivizePage(): ReactElement {
	return (
		<div className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col bg-neutral-0 pt-20'}>
			<div className={'relative mx-auto w-full max-w-6xl'}>
				<Incentivize />
			</div>
		</div>
	);
}
