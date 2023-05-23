import React from 'react';
import IconLoader from '@yearn-finance/web-lib/icons/IconLoader';

import type {ReactElement} from 'react';

function ProtocolAppliedView(): ReactElement {
	return (
		<section className={'box-900 relative mx-auto w-full border-neutral-900 p-6'}>
			<div className={'col-span-12 font-mono'}>
				<div className={'mb-4'}>
					<div className={'flex flex-col items-center justify-center space-y-2 pb-4 pt-6 text-center'}>
						<IconLoader className={'h-8 w-8 animate-spin text-neutral-0'} />
						<b>{'Thanks for your application.'}</b>
					</div>

					<p className={'mx-auto w-3/4 text-center text-sm text-neutral-300'}>
						{'Our LSD fairies will review your application so feel free to check back here from time to time on the status of your application.'}
					</p>
					<div className={'mt-10'}>
						<p className={'mx-auto w-3/4 pb-2 text-center text-xs text-neutral-300'}>
							{'(And here’s a link to your form in case you missed it the first time).'}
						</p>
						<a
							target={'_blank'}
							rel={'noopener noreferrer'}
							href={'https://form-for-draper.com'}>
							<div className={'mx-auto w-3/4 cursor-alias items-center justify-center border border-dashed border-neutral-400 bg-neutral-100 p-2 text-center font-mono text-sm text-neutral-900 transition-colors hover:bg-neutral-200'}>
								{'https://form-for-draper.com'}
							</div>
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}

export default ProtocolAppliedView;
