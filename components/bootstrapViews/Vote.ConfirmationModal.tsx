import React, {useCallback, useMemo, useState} from 'react';
import assert from 'assert';
import {vote} from 'utils/actions';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {ReactElement} from 'react';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

function VoteConfirmationModal({
	whitelistedLST,
	voteToSend,
	onSuccess,
	onCancel
}: {
	whitelistedLST: TDict<TTokenInfo>;
	voteToSend: TDict<TNormalizedBN>;
	onSuccess: VoidFunction;
	onCancel: VoidFunction;
}): ReactElement {
	const {isActive, provider} = useWeb3();
	const [voteStatus, set_voteStatus] = useState<TTxStatus>(defaultTxStatus);

	const protocols = useMemo(
		(): TAddress[] =>
			Object.values(whitelistedLST)
				.filter((lst): boolean => voteToSend[lst.address]?.raw > 0n)
				.map((lst): TAddress => lst.address),
		[whitelistedLST, voteToSend]
	);

	const amounts = useMemo(
		(): bigint[] =>
			Object.values(voteToSend)
				.filter((amount): boolean => amount.raw > 0n)
				.map((amount): bigint => amount.raw),
		[voteToSend]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Web3 action to incentivize a given protocol with a given token and amount.
	 **********************************************************************************************/
	const onVote = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');

		const result = await vote({
			connector: provider,
			chainID: Number(process.env.BASE_CHAIN_ID),
			contractAddress: toAddress(process.env.BOOTSTRAP_ADDRESS),
			protocols: protocols,
			amounts: amounts,
			statusHandler: set_voteStatus
		});
		if (result.isSuccessful) {
			onSuccess();
		}
	}, [isActive, provider, protocols, amounts, onSuccess]);

	return (
		<div className={'w-full max-w-[400px] rounded-sm bg-neutral-0 p-6'}>
			<b className={'text-xl'}>{'Confirm votes'}</b>
			<div className={'mt-8 grid grid-cols-1 gap-4'}>
				<div className={'flex flex-row items-center justify-between'}>
					<small className={'text-xs text-neutral-500'}>{'LST'}</small>
					<small className={'text-xs text-neutral-500'}>{'Votes, st-yETH'}</small>
				</div>
				{Object.values(whitelistedLST)
					.filter((lst): boolean => voteToSend[lst.address]?.raw > 0n)
					.map(
						(lst): ReactElement => (
							<div
								key={lst.address}
								className={'flex flex-row items-center justify-between'}>
								<p>{lst.symbol || truncateHex(lst.address, 6)}</p>
								<b>{formatAmount(voteToSend[lst.address]?.normalized, 6, 6)}</b>
							</div>
						)
					)}
			</div>

			<div className={'mt-20'}>
				<Button
					onClick={onVote}
					isBusy={voteStatus.pending}
					isDisabled={protocols.length !== amounts.length || protocols.length === 0}
					className={'yearn--button w-full rounded-md !text-sm'}>
					{'Confirm'}
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

export {VoteConfirmationModal};
