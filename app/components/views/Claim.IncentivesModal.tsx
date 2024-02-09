import React, {useMemo, useState} from 'react';
import {multicall} from 'app/actions';
import {type Hex} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {formatAmount, toAddress, truncateHex} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {Button} from '@yearn-finance/web-lib/components/Button';

import type {ReactElement} from 'react';
import type {TAddress, TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

type TClaimDetails = {
	id: string;
	value: number;
	amount: TNormalizedBN;
	token: TToken;
	isSelected: boolean;
	multicall: {target: TAddress; callData: Hex};
};
function ClaimIncentiveModal({
	claimableIncentive,
	onUpdateIncentive,
	onSuccess,
	onCancel
}: {
	claimableIncentive: TClaimDetails[];
	onUpdateIncentive: (id: string, isSelected: boolean) => void;
	onSuccess: VoidFunction;
	onCancel: VoidFunction;
}): ReactElement {
	const {provider} = useWeb3();
	const [claimStatus, set_claimStatus] = useState<TTxStatus>(defaultTxStatus);
	const hasSelected = useMemo(
		(): boolean => claimableIncentive.some((incentive): boolean => incentive.isSelected),
		[claimableIncentive]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Calculate the total amount of incentives you asked to claim, excluding the one you didn't
	 ** select.
	 **
	 ** @deps: claimableIncentive - the list of all claimable incentives.
	 ** @returns: number - the total amount of incentives you asked to claim.
	 **********************************************************************************************/
	const totalToClaim = useMemo(
		(): number =>
			claimableIncentive
				.filter((incentive): boolean => incentive.isSelected)
				.reduce((total, incentive): number => total + incentive.value, 0),
		[claimableIncentive]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Web3 actions to claim the incentives you selected. This is triggered via a multicall3.
	 **********************************************************************************************/
	async function onClaim(): Promise<void> {
		const result = await multicall({
			connector: provider,
			contractAddress: toAddress(process.env.BOOTSTRAP_ADDRESS),
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			multicallData: claimableIncentive
				.filter((incentive): boolean => incentive.isSelected)
				.map((incentive): {target: TAddress; callData: Hex} => incentive.multicall),
			statusHandler: set_claimStatus
		});
		if (result.isSuccessful) {
			onSuccess();
		}
	}

	return (
		<div className={'w-full max-w-[400px] rounded-sm bg-neutral-0 py-6'}>
			<b className={'px-6 text-xl'}>{'Confirm claim'}</b>
			<div className={'mt-8 grid grid-cols-1 gap-4'}>
				<div className={'grid grid-cols-3 gap-4 px-6'}>
					<small className={'text-xs text-neutral-500'}>{'Token'}</small>
					<small className={'text-right text-xs text-neutral-500'}>{'Amount'}</small>
					<small className={'text-right text-xs text-neutral-500'}>{'Value, USD'}</small>
				</div>
				<div
					className={
						'scrollbar-show max-h-[400px] overflow-y-scroll border-y border-neutral-200 bg-neutral-100/60'
					}>
					<div className={'grid grid-cols-1 gap-4 px-6 py-4'}>
						{claimableIncentive.map(
							(incentive): ReactElement => (
								<div
									key={incentive.id}
									className={'grid grid-cols-3 gap-4'}>
									<label className={'flex cursor-pointer items-center'}>
										<input
											onChange={(e): void => onUpdateIncentive(incentive.id, e.target.checked)}
											checked={incentive.isSelected}
											type={'checkbox'}
											className={
												'focus:ring-purple-300 mr-2 size-3 rounded-sm border-0 border-neutral-400 bg-neutral-200 text-purple-300 indeterminate:ring-2 focus:bg-neutral-200 focus:ring-2 focus:ring-offset-neutral-100'
											}
										/>
										<p>{incentive.token.symbol || truncateHex(incentive.token.address, 6)}</p>
									</label>
									<b className={'text-right'}>{formatAmount(incentive.amount.normalized, 6, 6)}</b>
									<b className={'text-right'}>{`$${formatAmount(incentive.value, 2, 2)}`}</b>
								</div>
							)
						)}
					</div>
				</div>
			</div>

			<div className={'mt-20 px-6'}>
				<Button
					onClick={onClaim}
					isBusy={claimStatus.pending}
					isDisabled={!hasSelected || !provider}
					className={'yearn--button w-full rounded-md !text-sm'}>
					{`Claim $${formatAmount(totalToClaim, 2, 2)}`}
				</Button>
				<button
					onClick={onCancel}
					className={
						'mt-2 h-10 w-full text-center text-neutral-500 transition-colors hover:text-neutral-900'
					}>
					{'Cancel'}
				</button>
			</div>
		</div>
	);
}

export {ClaimIncentiveModal};
