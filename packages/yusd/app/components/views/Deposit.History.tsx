import {cl} from '@builtbymom/web3/utils';
import IconChevronPlain from '@libIcons/IconChevronPlain';

import type {ReactElement} from 'react';

function HistoryRow(): ReactElement {
	return (
		<div className={'flex flex-col md:grid md:grid-cols-11'}>
			<div className={'col-span-2 flex justify-between'}>
				<p className={'md:hidden'}>{'Block:'}</p>
				<p>{'123456'}</p>
			</div>
			<div className={'col-span-2 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Asset deposited:'}</p>
				<p>{'sDAI'}</p>
			</div>
			<div className={'col-span-1 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Amount:'}</p>
				<p>{'41.652252'}</p>
			</div>
			<div className={'col-span-2 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Amount of st-token recieved:'}</p>
				<p>{'41.652252'}</p>
			</div>
			<div className={'col-span-2 flex justify-between md:justify-end'}>
				<p className={'md:hidden'}>{'Token voted for:'}</p>
				<p>{'sDAI'}</p>
			</div>
		</div>
	);
}

export function DepositHistory(): ReactElement {
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
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'Amount of st-token recieved'}</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'Token voted for'}</p>
				</div>
			</div>

			<div className={'flex max-h-[290px] w-full flex-col gap-4 overflow-y-auto'}>
				<HistoryRow />
				<HistoryRow />
				<HistoryRow />
			</div>
		</div>
	);
}
