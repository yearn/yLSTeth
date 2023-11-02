import React, {Fragment, useState} from 'react';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {ST_YETH_ABI} from 'utils/abi/styETH.abi';
import {unlockFromBootstrap} from 'utils/actions';
import {useContractRead} from 'wagmi';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {type TNormalizedBN,toBigInt,toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ReactElement} from 'react';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

function RenderYETHValue({amount}: {amount: bigint}): ReactElement {
	/* 🔵 - Yearn Finance **************************************************************************
	** Retrieve the locked st-yETH in the bootstrap contract for the current user
	**********************************************************************************************/
	const {data: yETHValue} = useContractRead({
		abi: ST_YETH_ABI,
		address: toAddress(process.env.STYETH_ADDRESS),
		functionName: 'convertToAssets',
		args: [amount],
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		watch: true
	});

	return (
		<p
			suppressHydrationWarning
			className={cl('text-sm block md:text-base text-neutral-500 transition-colors group-hover:text-neutral-0 font-number')}>
			{`~ ${formatAmount(Number(toNormalizedBN(toBigInt(yETHValue)).normalized), 6, 6)} yETH`}
		</p>
	);
}

function UnlockTokens(): ReactElement {
	const {provider} = useWeb3();
	const {address} = useWeb3();
	const [unlockStatus, set_unlockStatus] = useState<TTxStatus>(defaultTxStatus);

	/* 🔵 - Yearn Finance **************************************************************************
	** Retrieve the locked st-yETH in the bootstrap contract for the current user
	**********************************************************************************************/
	const {data: lockedTokens, refetch} = useContractRead({
		abi: BOOTSTRAP_ABI,
		address: toAddress(process.env.BOOTSTRAP_ADDRESS),
		functionName: 'deposits',
		args: [toAddress(address)],
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		select: (data): TNormalizedBN => toNormalizedBN(data)
	});

	/* 🔵 - Yearn Finance **************************************************************************
	** Web3 actions to unlock the tokens.
	**********************************************************************************************/
	async function onUnlock(): Promise<void> {
		const result = await unlockFromBootstrap({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: toAddress(process.env.BOOTSTRAP_ADDRESS),
			amount: toBigInt(lockedTokens?.raw),
			statusHandler: set_unlockStatus
		});
		if (result.isSuccessful) {
			refetch();
		}
	}

	if (toBigInt(lockedTokens?.raw) === 0n) {
		return <Fragment />;
	}

	return (
		<div className={'flex flex-col md:w-1/2 lg:w-[352px]'}>
			<div className={'mb-4 w-full bg-neutral-100 p-4'}>
				<p className={'pb-2'}>{'Your locked st-yETH'}</p>
				<b suppressHydrationWarning className={'font-number text-3xl'}>
					{`${formatAmount(Number(lockedTokens?.normalized), 6, 6)}`}
				</b>
				<RenderYETHValue amount={toBigInt(lockedTokens?.raw)} />
			</div>
			<Button
				onClick={onUnlock}
				isBusy={unlockStatus.pending}
				isDisabled={!unlockStatus.none || !provider || toBigInt(lockedTokens?.raw) === 0n}
				className={'yearn--button w-full rounded-md !text-sm'}>
				{'Unlock'}
			</Button>
			<small className={'mt-2 text-center text-neutral-600'}>{'Keeping your st-yETH in the bootstrap contract remains a completely safe option. Doing so won’t disrupt your holdings; however, transferring it out will reset your voting power.'}</small>
		</div>
	);
}

export {UnlockTokens};
