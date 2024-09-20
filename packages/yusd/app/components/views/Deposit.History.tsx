import {type ReactElement, type ReactNode} from 'react';
import {formatTAmount} from '@builtbymom/web3/utils';

import type {TDepositHistory} from './Deposit.types';

/************************************************************************************************
 ** HistoryRowSkeleton: Renders a skeleton row for the deposit history
 ** - Used as a placeholder while loading actual data
 ** - Mimics the structure of a real history row with placeholder elements
 ************************************************************************************************/
function HistoryRowSkeleton(): ReactElement {
	return (
		<div className={'flex flex-col md:grid md:grid-cols-11'}>
			<div className={'col-span-2 flex justify-between md:justify-start'}>
				<p className={'md:hidden'}>{'Block:'}</p>
				<div className={'skeleton-lg h-4 w-20'} />
			</div>
			<div className={'col-span-2 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Asset deposited:'}</p>
				<div className={'skeleton-lg h-4 w-20'} />
			</div>
			<div className={'col-span-1 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Amount:'}</p>
				<div className={'skeleton-lg h-4 w-20'} />
			</div>
			<div className={'col-span-2 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Amount of st-token recieved:'}</p>
				<div className={'skeleton-lg h-4 w-20'} />
			</div>
			<div className={'col-span-2 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Token voted for:'}</p>
				<div className={'skeleton-lg h-4 w-20'} />
			</div>
		</div>
	);
}

/************************************************************************************************
 ** HistoryRow: Renders a single row of deposit history
 ** - Displays information about a single deposit transaction
 ** - Shows block number, deposited asset, amount, received st-tokens, and voted asset
 ** @param {TDepositHistory} props - The deposit history data for this row
 ************************************************************************************************/
function HistoryRow({block, asset, amount, stTokenAmount, votedAsset}: TDepositHistory): ReactElement {
	return (
		<div className={'flex flex-col md:grid md:grid-cols-11'}>
			<div className={'col-span-2 flex justify-between md:justify-start'}>
				<p className={'md:hidden'}>{'Block:'}</p>
				<p>{block.toString()}</p>
			</div>
			<div className={'col-span-2 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Asset deposited:'}</p>
				<p>{asset.symbol}</p>
			</div>
			<div className={'col-span-1 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Amount:'}</p>
				<p>{formatTAmount({value: amount, decimals: asset.decimals})}</p>
			</div>
			<div className={'col-span-2 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Amount of st-token recieved:'}</p>
				<p>{formatTAmount({value: stTokenAmount, decimals: votedAsset.decimals})}</p>
			</div>
			<div className={'col-span-2 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Token voted for:'}</p>
				<p>{votedAsset.symbol}</p>
			</div>
		</div>
	);
}

/************************************************************************************************
 ** HistoryContent: Renders the content of the deposit history
 ** - Handles different states: loading, no history, and displaying history
 ** - Renders skeleton rows while loading, a message for no history, or actual history rows
 ** @param {TDepositHistory[]} history - Array of deposit history items
 ** @param {boolean} isLoading - Flag indicating if the data is still loading
 ************************************************************************************************/
function HistoryContent({history, isLoading}: {history: TDepositHistory[]; isLoading: boolean}): ReactNode {
	if (isLoading) {
		return Array(3)
			.fill(null)
			.map((_, index) => <HistoryRowSkeleton key={index} />);
	}

	if (history.length === 0) {
		return (
			<div className={'flex flex-col items-center justify-center'}>
				<p className={'text-neutral-500'}>{'No history yet'}</p>
			</div>
		);
	}

	return history.map(item => (
		<HistoryRow
			key={item.block}
			{...item}
		/>
	));
}

/************************************************************************************************
 ** DepositHistory: Main component for displaying the deposit history
 ** - Renders a header with column titles and the history content
 ** - Handles both loading state and actual history display
 ** @param {TDepositHistory[]} history - Array of deposit history items to display
 ** @param {boolean} isLoading - Flag indicating if the data is still loading
 ************************************************************************************************/
export function DepositHistory({history, isLoading}: {history: TDepositHistory[]; isLoading: boolean}): ReactElement {
	return (
		<div>
			<div
				aria-label={'header'}
				className={'mb-6 mt-8 hidden grid-cols-11 border-t-2 border-[#D9D9D9] pt-6 md:grid'}>
				<div className={'col-span-2'}>
					<p className={'text-xs text-neutral-500'}>{'Block'}</p>
				</div>
				<div className={'col-span-2 flex justify-end gap-1'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'Asset deposited'}</p>
				</div>
				<div className={'col-span-1 flex justify-end'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'Amount'}</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'Amount of st-token recieved'}</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'Token voted for'}</p>
				</div>
			</div>
			<div className={'flex max-h-[290px] w-full flex-col gap-4 overflow-y-auto'}>
				<HistoryContent
					history={history}
					isLoading={isLoading}
				/>
			</div>
		</div>
	);
}
