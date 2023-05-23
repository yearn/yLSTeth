import React from 'react';
import useBootstrap from 'contexts/useBootstrap';
import {formatDate} from 'utils';
import {formatDuration} from '@yearn-finance/web-lib/utils/format.time';

import type {ReactElement} from 'react';

function WhitelistTimelineStatus(): ReactElement {
	const {periods} = useBootstrap();
	const {whitelistBegin, whitelistEnd} = periods || {};
	const hasStarted = whitelistBegin?.status === 'success' && (Number(whitelistBegin.result) * 1000) < Date.now();
	const hasEnded = whitelistEnd?.status === 'success' && (Number(whitelistEnd.result) * 1000) < Date.now();
	const startDate = Number(whitelistBegin?.result || 0) * 1000;
	const endDate = Number(whitelistEnd?.result || 0) * 1000;
	const timeSinceStart = startDate - Date.now();
	const timeToEnd = endDate - Date.now();

	if (hasEnded) {
		return (
			<div className={'space-x-1 pt-0 text-sm text-neutral-500'}>
				<span>
					{'The whitelist period has ended '}
					<span className={'tooltip underline decoration-neutral-300 decoration-dashed underline-offset-4'}>
						{formatDuration(timeToEnd, true)}
						<span className={'tooltiptext z-[100000] text-xs'}>
							<p>{`Whitelist will end the ${formatDate(endDate)}`}</p>
						</span>
					</span>
				</span>
			</div>
		);
	}
	if (hasStarted) {
		return (
			<div className={'space-x-1 pt-0 text-sm text-neutral-500'}>
				<span>
					{'The whitelist period has started '}
					<span className={'tooltip underline decoration-neutral-300 decoration-dashed underline-offset-4'}>
						{formatDuration(timeSinceStart, true)}
						<span className={'tooltiptext z-[100000] text-xs'}>
							<p>{`Whitelist started the ${formatDate(startDate)}`}</p>
						</span>
					</span>
					{' and will end '}
					<span className={'tooltip underline decoration-neutral-300 decoration-dashed underline-offset-4'}>
						{formatDuration(timeToEnd, true)}
						<span className={'tooltiptext z-[100000] text-xs'}>
							<p>{`Whitelist will end the ${formatDate(endDate)}`}</p>
						</span>
					</span>
				</span>
			</div>
		);
	}
	return (
		<div className={'space-x-1 pt-0 text-sm text-neutral-500'}>
			<span>
				{'The whitelist period will start '}
				<span className={'tooltip underline decoration-neutral-300 decoration-dashed underline-offset-4'}>
					{formatDuration(timeSinceStart, true)}
					<span className={'tooltiptext z-[100000] text-xs'}>
						<p>{`Whitelist started the ${formatDate(startDate)}`}</p>
					</span>
				</span>
			</span>
		</div>
	);

}

export default WhitelistTimelineStatus;
