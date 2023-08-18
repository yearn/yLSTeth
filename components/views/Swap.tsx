import React, {useCallback, useEffect, useMemo, useState} from 'react';
import assert from 'assert';
import TokenInput from 'components/common/TokenInput';
import IconSwapSVG from 'components/icons/IconSwap';
import useLST from 'contexts/useLST';
import useWallet from 'contexts/useWallet';
import {ESTIMATOR_ABI} from 'utils/abi/estimator.abi';
import {approveERC20} from 'utils/actions';
import {ETH_TOKEN} from 'utils/tokens';
import {erc20ABI, useContractRead, useContractReads} from 'wagmi';
import {Button} from '@yearn-finance/web-lib/components/Button';
import useWeb3 from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {MAX_UINT_256} from '@yearn-finance/web-lib/utils/constants';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TLST} from 'contexts/useLST';
import type {ReactElement} from 'react';
import type {TUseBalancesTokens} from '@yearn-finance/web-lib/hooks/useBalances';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

function ViewSwapBox(): ReactElement {
	const {isActive, provider, address} = useWeb3();
	const {lst, onUpdateLST} = useLST();
	const {refresh} = useWallet();
	const [selectedFromLST, set_selectedFromLST] = useState<TLST>(lst[0]);
	const [selectedToLST, set_selectedToLST] = useState<TLST>(lst[1]);
	const [fromAmount, set_fromAmount] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [toAmount, set_toAmount] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [txStatus, set_txStatus] = useState<TTxStatus>(defaultTxStatus);
	const [lastInput, set_lastInput] = useState<'from' | 'to'>('from');

	/* 🔵 - Yearn Finance **************************************************************************
	** If the user wants to swap, he first needs to approve the pool to spend the token he wants
	** to spend. This is done by calling the approve function on the ERC20 token contract.
	**********************************************************************************************/
	const {data: allowance, refetch: refreshAllowance} = useContractRead({
		address: selectedFromLST.address,
		abi: erc20ABI,
		functionName: 'allowance',
		args: [toAddress(address), toAddress(process.env.POOL_ADDRESS)]
	});
	const hasAllowance = useMemo((): boolean => {
		if (!fromAmount || !allowance) {
			return false;
		}
		return toBigInt(allowance) >= toBigInt(fromAmount.raw);
	}, [allowance, fromAmount]);

	/* 🔵 - Yearn Finance **************************************************************************
	** We use get_dy and get_dx to estimate the amount of tokens we will receive. The difference is:
	** - get_dy is using exact input amount, calculate output amount
	** - get_dx is using exact output amount, calculate input amount
	** We use useContractReads to call both functions at the same time and display the one we want
	** based on the user input.
	**********************************************************************************************/
	const {data: dyAndDx} = useContractReads({
		enabled: true,
		keepPreviousData: true,
		contracts: [
			{
				abi: ESTIMATOR_ABI,
				address: toAddress(process.env.ESTIMATOR_ADDRESS),
				functionName: 'get_dy',
				chainId: 1337,
				args: [toBigInt(selectedFromLST.index), toBigInt(selectedToLST.index), fromAmount.raw]
			},
			{
				abi: ESTIMATOR_ABI,
				address: toAddress(process.env.ESTIMATOR_ADDRESS),
				functionName: 'get_dx',
				chainId: 1337,
				args: [toBigInt(selectedToLST.index), toBigInt(selectedFromLST.index), toAmount.raw]
			}
		]
	});

	useEffect((): void => {
		if (dyAndDx) {
			const dy = dyAndDx?.[0]?.result as bigint;
			const dx = dyAndDx?.[1]?.result as bigint;
			if (lastInput === 'from') {
				set_toAmount(toNormalizedBN(dy));
			} else {
				set_fromAmount(toNormalizedBN(dx));
			}
		}
	}, [dyAndDx, lastInput]);



	/* 🔵 - Yearn Finance **************************************************************************
	** If the user is updating the fromToken, we need to update the toToken if it's the same token
	** as the fromToken. This is to prevent the user from swapping the same token to itself.
	**********************************************************************************************/
	const onUpdateFromToken = useCallback((token: TLST): void => {
		performBatchedUpdates((): void => {
			if (token.address === selectedToLST.address) {
				set_selectedToLST(selectedFromLST);
			}
			set_selectedFromLST(token);
		});
	}, [selectedFromLST, selectedToLST.address]);

	/* 🔵 - Yearn Finance **************************************************************************
	** If the user clicks the switch button, we need to swap the fromToken and toToken.
	**********************************************************************************************/
	const onSwitchTokens = useCallback((): void => {
		performBatchedUpdates((): void => {
			set_lastInput(lastInput === 'from' ? 'to' : 'from');
			set_selectedFromLST(selectedToLST);
			set_selectedToLST(selectedFromLST);
			set_fromAmount(toAmount);
			set_toAmount(fromAmount);
		});
	}, [fromAmount, lastInput, selectedFromLST, selectedToLST, toAmount]);

	/* 🔵 - Yearn Finance **************************************************************************
	** If the user is updating the toToken, we need to update the fromToken if it's the same token
	** as the toToken. This is to prevent the user from swapping the same token to itself.
	**********************************************************************************************/
	const onUpdateToToken = useCallback((token: TLST): void => {
		performBatchedUpdates((): void => {
			if (token.address === selectedFromLST.address) {
				set_selectedFromLST(selectedToLST);
			}
			set_selectedToLST(token);
		});
	}, [selectedFromLST, selectedToLST]);

	/* 🔵 - Yearn Finance **************************************************************************
	** If the user is updating the fromAmount and the fromToken is yETH, then update the toAmount
	** with the st-yETH rate.
	**********************************************************************************************/
	const onUpdateFromAmount = useCallback((newAmount: TNormalizedBN): void => {
		performBatchedUpdates((): void => {
			set_fromAmount(newAmount);
			set_lastInput('from');
		});
	}, []);

	/* 🔵 - Yearn Finance **************************************************************************
	** If the user is updating the toAmount and the fromToken is st-yETH, then update the fromAmount
	** with the st-yETH rate.
	**********************************************************************************************/
	const onUpdateToAmount = useCallback((newAmount: TNormalizedBN): void => {
		performBatchedUpdates((): void => {
			set_toAmount(newAmount);
			set_lastInput('to');
		});
	}, []);

	/* 🔵 - Yearn Finance **************************************************************************
	** Web3 action to allow the pool to spend the user's from token.
	**********************************************************************************************/
	const onApprove = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(fromAmount.raw > 0n, 'Amount must be greater than 0');

		const result = await approveERC20({
			connector: provider,
			contractAddress: selectedFromLST.address,
			spenderAddress: toAddress(process.env.POOL_ADDRESS),
			amount: fromAmount.raw,
			statusHandler: set_txStatus
		});
		if (result.isSuccessful) {
			refreshAllowance();
			await refresh([
				{...ETH_TOKEN, token: ETH_TOKEN.address},
				...lst.map((item): TUseBalancesTokens => ({...item, token: item.address}))
			]);
		}
	}, [fromAmount.raw, isActive, provider, refresh, refreshAllowance, selectedFromLST.address, lst]);

	return (
		<div className={'col-span-18 py-10 pr-[72px]'}>
			<div className={'flex w-full flex-col !rounded-md bg-neutral-100'}>
				<h2 className={'text-xl font-black'}>
					{'Swap tokens'}
				</h2>
				<div className={'pt-4'}>
					<div>
						<b className={'text-purple-300'}>
							{'APR: -'}
						</b>
					</div>

					<div className={'mt-5 grid'}>
						<TokenInput
							key={selectedFromLST.address}
							token={selectedFromLST}
							tokens={lst}
							onChangeToken={onUpdateFromToken}
							value={fromAmount}
							allowance={toNormalizedBN(allowance || 0n)}
							onChange={onUpdateFromAmount} />
						<div className={'mb-8 mt-6 flex w-full justify-center'}>
							<button
								tabIndex={-1}
								className={'cursor-pointer'}
								onClick={onSwitchTokens}>
								<IconSwapSVG />
							</button>
						</div>
						<TokenInput
							key={selectedToLST.address}
							token={selectedToLST}
							tokens={lst}
							onChangeToken={onUpdateToToken}
							value={toAmount}
							allowance={toNormalizedBN(MAX_UINT_256)}
							shouldCheckAllowance={false}
							shouldCheckBalance={false}
							onChange={onUpdateToAmount} />
					</div>


				</div>
				<div className={'mt-10 flex justify-start'}>
					<Button
						isBusy={txStatus.pending}
						isDisabled={!txStatus.none || fromAmount.raw === 0n}
						onClick={(): void => {
							if (!hasAllowance) {
								onApprove();
							} else {
								onSwap();
							}
						}}
						className={'w-[184px]'}>
						{hasAllowance ? 'Swap' : 'Approve'}
					</Button>
				</div>
			</div>
		</div>
	);
}

function ViewDetails(): ReactElement {
	return (
		<div className={'col-span-12 py-10 pl-[72px]'}>
			<div className={'mb-10 flex w-full flex-col !rounded-md bg-neutral-100'}>
				<h2 className={'text-xl font-black'}>
					{'Details'}
				</h2>
				<dl className={'grid grid-cols-3 gap-2 pt-4'}>
					<dt className={'col-span-2'}>{'yETH per st-yETH'}</dt>
					<dd className={'text-right font-bold'}>{'1,053443'}</dd>

					<dt className={'col-span-2'}>{'Your share of the pool'}</dt>
					<dd className={'text-right font-bold'}>{'0.00%'}</dd>

					<dt className={'col-span-2'}>{'Swap fee'}</dt>
					<dd className={'text-right font-bold'}>{'0.03%'}</dd>
				</dl>
			</div>
			<div>
				<h2 className={'text-xl font-black'}>
					{'Info'}
				</h2>
				<p className={'whitespace-break-spaces pt-4 text-neutral-600'}>
					{'Like Draper said - it’s gonna be a super small description. Well, not like ultra small. It will take some room. It’s always nice to put some copy, and it’s good for balance.\n\n'}

					{'We can put useful links here as well.'}
				</p>
			</div>
		</div>

	);
}

function ViewSwap(): ReactElement {
	return (
		<section className={'relative px-[72px]'}>
			<div className={'grid grid-cols-30 divide-x-2 divide-neutral-300'}>
				<ViewSwapBox />
				<ViewDetails />
			</div>
		</section>
	);
}

export default ViewSwap;
