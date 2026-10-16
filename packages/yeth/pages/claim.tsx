import React from 'react';
import Claim from '@yETH/components/views/Claim';

import type {ReactElement} from 'react';

export default function ClaimPage(): ReactElement {
	return (
		<div className={'bg-neutral-0 relative mx-auto mb-0 flex min-h-screen w-full flex-col pt-20'}>
			<div className={'max relative mx-auto w-full'}>
				<Claim />
			</div>
		</div>
	);
}
