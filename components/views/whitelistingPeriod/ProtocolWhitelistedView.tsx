import React from 'react';
import IconCheck from 'components/icons/IconCheck';
import {Button} from '@yearn-finance/web-lib/components/Button';

import type {ReactElement} from 'react';

function ProtocolWhitelistedView(): ReactElement {
	return (
		<section className={'box-0 relative mx-auto w-full border-neutral-900 !bg-[#16a34a] p-6 text-neutral-0'}>
			<div className={'col-span-12 font-mono'}>
				<div className={'mb-4'}>
					<div className={'flex flex-col items-center justify-center space-y-2 pb-4 pt-6 text-center'}>
						<IconCheck className={'h-8 w-8 text-neutral-0'} />
						<b>{'Congrats. You’re whitelisted!'}</b>
					</div>
					<p className={'mx-auto w-3/4 text-center text-sm text-neutral-100'}>
						{'Great news, your token is whitelisted to take part in the yETH bootstrapping phase. To learn more about how everything works, check our docs.'}
					</p>

					<div className={'mt-10'}>
						<div className={'mx-auto w-3/4'}>
							<Button variant={'reverted'} className={'w-full'}>
								{'Read the docs'}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default ProtocolWhitelistedView;
