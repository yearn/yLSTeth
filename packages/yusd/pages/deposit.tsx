import React from 'react';
import ViewDeposit from '@yUSD/components/views/Deposit';

import type {ReactElement} from 'react';

export default function Bootstrap(): ReactElement {
	return (
		<div
			className={
				'bg-neutral-0 relative mx-auto mb-0 flex min-h-screen w-full flex-col overflow-x-visible pt-20 md:overflow-y-hidden'
			}>
			<div className={'relative mx-auto w-screen max-w-5xl !px-0'}>
				<div
					className={'relative flex flex-row'}
					style={{height: 'calc(100vh - 80px)'}}>
					<ViewDeposit />
				</div>
			</div>
		</div>
	);
}