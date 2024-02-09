import React from 'react';
import Claim from 'app/components/views/Claim';

import type {ReactElement} from 'react';

export default function ClaimPage(): ReactElement {
	return (
		<div className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col bg-neutral-0 pt-20'}>
			<div className={'relative mx-auto w-full max-w-5xl'}>
				<Claim />
			</div>
		</div>
	);
}
