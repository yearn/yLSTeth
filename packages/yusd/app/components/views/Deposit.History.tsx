import {type ReactElement} from 'react';
import {cl, formatTAmount} from '@builtbymom/web3/utils';
import IconChevronPlain from '@libIcons/IconChevronPlain';

import type {TToken} from '@builtbymom/web3/types';

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

export type TDepositHistory = {
	block: bigint;
	asset: TToken;
	amount: bigint;
	stTokenAmount: bigint;
	votedAsset: TToken;
};

export function DepositHistory({history, isLoading}: {history: TDepositHistory[]; isLoading: boolean}): ReactElement {
	return (
		<div>
			{isLoading ? (
				'Loading...'
			) : (
				<>
					<div
						aria-label={'header'}
						className={'mb-6 mt-8 hidden grid-cols-11 border-t-2 border-[#D9D9D9] pt-6 md:grid'}>
						<div className={'col-span-2'}>
							<p className={'text-xs text-neutral-500'}>{'Block'}</p>
						</div>
						<div className={'col-span-2 flex justify-end gap-1'}>
							<p className={'group flex flex-row text-xs text-neutral-500'}>{'Asset deposited'}</p>
							<IconChevronPlain
								className={cl(
									'yearn--sort-chevron text-neutral-500 transition-all group-hover:text-neutral-500'
								)}
							/>
						</div>
						<div className={'col-span-1 flex justify-end'}>
							<p className={'group flex flex-row text-xs text-neutral-500'}>{'Amount'}</p>
						</div>
						<div className={'col-span-2 flex justify-end'}>
							<p className={'group flex flex-row text-xs text-neutral-500'}>
								{'Amount of st-token recieved'}
							</p>
						</div>
						<div className={'col-span-2 flex justify-end'}>
							<p className={'group flex flex-row text-xs text-neutral-500'}>{'Token voted for'}</p>
						</div>
					</div>
					<div className={'flex max-h-[290px] w-full flex-col gap-4 overflow-y-auto'}>
						{history.map(item => (
							<HistoryRow
								key={item.block}
								{...item}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
}
