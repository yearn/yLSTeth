import React, {Fragment, useEffect, useState} from 'react';
import {useBlockNumber, useReadContract} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount, toAddress, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import BOOTSTRAP_ABI from '@libAbi/bootstrap.abi';
import {ST_YETH_ABI} from '@libAbi/styETH.abi';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {unlockFromBootstrap} from '@yETH/actions';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

function RenderYETHValue({amount}: {amount: bigint}): ReactElement {
	/* 🔵 - Yearn Finance **************************************************************************
	 ** Retrieve the locked st-yETH in the bootstrap contract for the current user
	 **********************************************************************************************/
	const {data: blockNumber} = useBlockNumber({watch: true});
	const {data: yETHValue, refetch} = useReadContract({
		abi: ST_YETH_ABI,
		address: toAddress(process.env.STYETH_ADDRESS),
		functionName: 'convertToAssets',
		args: [amount],
		chainId: Number(process.env.DEFAULT_CHAIN_ID)
	});

	useEffect(() => {
		refetch();
	}, [blockNumber, refetch]);

	return (
		<p
			suppressHydrationWarning
			className={cl(
				'text-sm block md:text-base text-neutral-500 transition-colors group-hover:text-neutral-0 font-number'
			)}>
			{`~ ${formatAmount(Number(toNormalizedBN(toBigInt(yETHValue), 18).normalized), 6, 6)} yETH`}
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
	const {data: lockedTokens, refetch} = useReadContract({
		abi: BOOTSTRAP_ABI,
		address: toAddress(process.env.BOOTSTRAP_ADDRESS),
		functionName: 'deposits',
		args: [toAddress(address)],
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		query: {
			select: (data): TNormalizedBN => toNormalizedBN(data, 18)
		}
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
				<p className={'pb-2'}>{'Your bootstrap st-yETH'}</p>
				<b
					suppressHydrationWarning
					className={'font-number text-3xl'}>
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
			<small className={'mt-2 text-center text-neutral-600'}>
				{
					'Keeping your st-yETH in the bootstrap contract remains a completely safe option. Doing so won’t disrupt your holdings; however, transferring it out will reset your voting power.'
				}
			</small>
		</div>
	);
}

export {UnlockTokens};
