import React, {useState} from 'react';
import IconCheck from 'components/icons/IconCheck';
import WhitelistTimelineStatus from 'components/WhitelistTimelineStatus';
import useBootstrap from 'contexts/useBootstrap';
import {useIntervalEffect} from '@react-hookz/web';
import {formatDuration} from '@yearn-finance/web-lib/utils/format.time';

import type {ReactElement} from 'react';

function WhitelistedView(): ReactElement {
	const {periods} = useBootstrap();
	const {whitelistEnd} = periods || {};
	const startDate = Number(whitelistEnd?.result || 0) * 1000;
	const [timeToStart, set_timeToStart] = useState(startDate);

	useIntervalEffect((): void => {
		set_timeToStart(Number(whitelistEnd?.result || 0) * 1000 - Date.now());
	}, 500);

	return (
		<div>
			<div className={'col-span-12 mt-6 rounded border border-neutral-200 bg-neutral-100 px-6 py-4 font-mono'}>
				<div className={'mb-4'}>
					<div className={'flex flex-col items-center justify-center space-y-2 pb-4 pt-6 text-center'}>
						<IconCheck className={'h-8 w-8 text-[#16a34a]'} />
						<b>{'You are whitelisted!'}</b>
					</div>

					<p className={'mx-auto w-3/4 text-center text-sm text-neutral-500'}>
						{'Congratulations! You are whitelisted and can now do some cool stuff with your LSDs! You will even be able to bribe people to influence the initial yETH composition (It\'s called democracy)'}
					</p>
					<div className={'mt-4 w-full cursor-alias items-center justify-center border border-dashed border-neutral-400 bg-neutral-0 p-4 text-center font-mono transition-colors hover:bg-neutral-50'}>
						{`Bribing period will start ${formatDuration(timeToStart, true)}`}
					</div>
				</div>
				<div>

				</div>
			</div>
		</div>
	);
}

function ProtocolWhitelistedView(): ReactElement {
	return (
		<section className={'box-0 relative mx-auto w-full border-neutral-900 p-6'}>
			<div className={'w-full md:w-3/4'}>
				<b>{'Whitelisting'}</b>
				<p className={'text-sm text-neutral-500'}>
					{'First, we need some suppliers. If you got some gud stuff, send us a sample.'}
				</p>
				<WhitelistTimelineStatus />
			</div>

			<WhitelistedView />
		</section>
	);
}

export default ProtocolWhitelistedView;
