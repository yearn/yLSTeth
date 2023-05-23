import React from 'react';
import WhitelistTimelineStatus from 'components/WhitelistTimelineStatus';
import IconLoader from '@yearn-finance/web-lib/icons/IconLoader';

import type {ReactElement} from 'react';

function AppliedView(): ReactElement {
	return (
		<div>
			<div className={'col-span-12 mt-6 rounded border border-neutral-200 bg-neutral-100 px-6 py-4 font-mono'}>
				<div className={'mb-4'}>
					<div className={'flex flex-col items-center justify-center space-y-2 pb-4 pt-6 text-center'}>
						<IconLoader className={'h-8 w-8 animate-spin text-neutral-900'} />
						<b>{'We are reviewing your application.'}</b>
					</div>

					<p className={'mx-auto w-3/4 text-center text-sm text-neutral-500'}>
						{'As we want to ensure that we have a diverse set of suppliers, we will be reviewing applications on a rolling basis. We will notify you if you have been whitelisted.'}
					</p>
					<a
						target={'_blank'}
						rel={'noopener noreferrer'}
						href={'https://form-for-draper.com'}>
						<div className={'mt-4 w-full cursor-alias items-center justify-center border border-dashed border-neutral-400 bg-neutral-0 p-4 text-center font-mono transition-colors hover:bg-neutral-50'}>
							{'https://form-for-draper.com'}
						</div>
					</a>
				</div>
				<div>

				</div>
			</div>
		</div>
	);
}

function ProtocolAppliedView(): ReactElement {
	return (
		<section className={'box-0 relative mx-auto w-full border-neutral-900 p-6'}>
			<div className={'w-full md:w-3/4'}>
				<b>{'Whitelisting'}</b>
				<p className={'text-sm text-neutral-500'}>
					{'First, we need some suppliers. If you got some gud stuff, send us a sample.'}
				</p>
				<WhitelistTimelineStatus />
			</div>
			<AppliedView />
		</section>
	);
}

export default ProtocolAppliedView;
