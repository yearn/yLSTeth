import React, {Fragment, useCallback, useMemo, useState} from 'react';
import assert from 'assert';
import {erc20Abi} from 'viem';
import {useReadContract} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {
	formatAmount,
	MAX_UINT_256,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import BOOTSTRAP_ABI from '@libAbi/bootstrap.abi';
import {ST_YETH_ABI} from '@libAbi/styETH.abi';
import {RenderAmount} from '@libComponents/RenderAmount';
import TokenInput from '@libComponents/TokenInput';
import useAPR from '@libHooks/useAPR';
import IconSwapSVG from '@libIcons/IconSwap';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {stakeYETH, unstakeYETH} from '@yETH/actions';
import {ETH_TOKEN, STYETH_TOKEN, YETH_TOKEN} from '@yETH/tokens';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TBasketItem} from '@libUtils/types';

function ViewStakeUnstake(): ReactElement {
	const {isActive, provider, address} = useWeb3();
	const {getBalance, onRefresh} = useWallet();
	const {APR} = useAPR();
	const [currentView, set_currentView] = useState<'stake' | 'unstake'>('stake');
	const [fromAmount, set_fromAmount] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [toAmount, set_toAmount] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [txStatus, set_txStatus] = useState<TTxStatus>(defaultTxStatus);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Retrieve the yETH/st-yETH rate.
	 ** 1 st-yETH = rate
	 **********************************************************************************************/
	const {data: rate} = useReadContract({
		address: STYETH_TOKEN.address,
		abi: ST_YETH_ABI,
		functionName: 'convertToShares',
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		args: [toBigInt(1e18)]
	});

	/* 🔵 - Yearn Finance **************************************************************************
	 ** If the user wants to stake, he first needs to approve the staking contract to spend his
	 ** yETH. Thus, we need to check the user's allowance.
	 **********************************************************************************************/
	const {data: allowance, refetch: refreshAllowance} = useReadContract({
		address: YETH_TOKEN.address,
		abi: erc20Abi,
		functionName: 'allowance',
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		args: [toAddress(address), STYETH_TOKEN.address]
	});
	const hasAllowance = useMemo((): boolean => {
		if (!fromAmount || !allowance) {
			return false;
		}
		if (currentView === 'stake') {
			return toBigInt(allowance) >= toBigInt(fromAmount.raw);
		}
		return true;
	}, [allowance, currentView, fromAmount]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** If the user is updating the fromAmount and the fromToken is yETH, then update the toAmount
	 ** with the st-yETH rate.
	 **********************************************************************************************/
	const onUpdateFromAmount = useCallback(
		(newAmount: TNormalizedBN): void => {
			set_fromAmount(newAmount);
			if (currentView === 'stake') {
				set_toAmount(toNormalizedBN((newAmount.raw * toBigInt(rate)) / toBigInt(1e18), 18));
			} else {
				set_toAmount(toNormalizedBN((newAmount.raw * toBigInt(1e18)) / (rate || 1n), 18));
			}
		},
		[currentView, rate]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** If the user is updating the toAmount and the fromToken is st-yETH, then update the fromAmount
	 ** with the st-yETH rate.
	 **********************************************************************************************/
	const onUpdateToAmount = useCallback(
		(newAmount: TNormalizedBN): void => {
			set_toAmount(newAmount);
			if (currentView === 'stake') {
				set_fromAmount(toNormalizedBN((newAmount.raw * toBigInt(1e18)) / (rate || 1n), 18));
			} else {
				set_fromAmount(toNormalizedBN((newAmount.raw * toBigInt(rate)) / toBigInt(1e18), 18));
			}
		},
		[currentView, rate]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Web3 action to allow the staking contract to spend the user's yETH.
	 **********************************************************************************************/
	const onApprove = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(fromAmount.raw > 0n, 'Amount must be greater than 0');

		const result = await approveERC20({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: YETH_TOKEN.address,
			spenderAddress: STYETH_TOKEN.address,
			amount: fromAmount.raw,
			statusHandler: set_txStatus
		});
		if (result.isSuccessful) {
			refreshAllowance();
			await onRefresh([ETH_TOKEN, STYETH_TOKEN, YETH_TOKEN]);
		}
	}, [fromAmount.raw, isActive, provider, onRefresh, refreshAllowance]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Web3 action to stake the user's yETH.
	 **********************************************************************************************/
	const onStake = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(fromAmount.raw > 0n, 'Amount must be greater than 0');

		const result = await stakeYETH({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: STYETH_TOKEN.address,
			amount: fromAmount.raw,
			statusHandler: set_txStatus
		});
		if (result.isSuccessful) {
			await onRefresh([ETH_TOKEN, STYETH_TOKEN, YETH_TOKEN]);
			set_fromAmount(zeroNormalizedBN);
			set_toAmount(zeroNormalizedBN);
		}
	}, [fromAmount.raw, isActive, provider, onRefresh]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Web3 action to unstake the user's st-yETH.
	 **********************************************************************************************/
	const onUnstake = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(fromAmount.raw > 0n, 'Amount must be greater than 0');

		const result = await unstakeYETH({
			connector: provider,
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			contractAddress: STYETH_TOKEN.address,
			amount: fromAmount.raw,
			statusHandler: set_txStatus
		});
		if (result.isSuccessful) {
			await onRefresh([ETH_TOKEN, STYETH_TOKEN, YETH_TOKEN]);
			set_fromAmount(zeroNormalizedBN);
			set_toAmount(zeroNormalizedBN);
		}
	}, [fromAmount.raw, isActive, provider, onRefresh]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** If the user clicks the switch button, we need to swap the fromToken and toToken.
	 **********************************************************************************************/
	const onSwitchTokens = useCallback((): void => {
		set_currentView(currentView === 'stake' ? 'unstake' : 'stake');
		set_fromAmount(toAmount);
		set_toAmount(fromAmount);
	}, [currentView, fromAmount, toAmount]);

	return (
		<div className={'col-span-18 py-6 pr-0 md:py-10 md:pr-72'}>
			<h2 className={'text-xl font-black'}>{currentView === 'stake' ? 'Stake yETH' : 'Unstake st-yETH'}</h2>
			<div className={'pt-4'}>
				<div>
					<span className={'tooltip'}>
						<b
							suppressHydrationWarning
							className={'text-purple-300'}>
							{`APR: ~${formatAmount(APR, 2, 2)}%`}
						</b>
						<span className={'tooltipLight !-inset-x-24 top-full mt-2 !w-auto'}>
							<div
								suppressHydrationWarning
								className={
									'text-neutral-0 w-fit rounded-md border border-neutral-700 bg-neutral-900 p-1 px-2 text-center text-xs font-medium'
								}>
								{
									"APY is calculated based on last week's yETH yield generated by the protocol, streamed to st-yETH holders this week"
								}
							</div>
						</span>
					</span>
				</div>

				<div className={'mt-5 grid'}>
					<TokenInput
						allowance={toNormalizedBN(allowance || 0n, 18)}
						token={(currentView === 'stake' ? YETH_TOKEN : STYETH_TOKEN) as TBasketItem}
						value={fromAmount}
						onChange={onUpdateFromAmount}
					/>
					<div className={'mb-8 mt-6 flex w-full justify-center'}>
						<button
							className={'cursor-pointer'}
							onClick={onSwitchTokens}>
							<IconSwapSVG />
						</button>
					</div>
					<TokenInput
						shouldCheckAllowance={false}
						shouldCheckBalance={false}
						allowance={toNormalizedBN(MAX_UINT_256, 18)}
						token={(currentView === 'stake' ? STYETH_TOKEN : YETH_TOKEN) as TBasketItem}
						value={toAmount}
						onChange={onUpdateToAmount}
					/>
				</div>
			</div>
			<div className={'mt-10 flex justify-start'}>
				<Button
					isBusy={txStatus.pending}
					isDisabled={
						!txStatus.none || fromAmount.raw === 0n || !provider || currentView === 'stake'
							? fromAmount.raw >
								getBalance({address: YETH_TOKEN.address, chainID: YETH_TOKEN.chainID})?.raw
							: fromAmount.raw >
								getBalance({address: STYETH_TOKEN.address, chainID: STYETH_TOKEN.chainID})?.raw
					}
					onClick={(): void => {
						if (currentView === 'stake' && !hasAllowance) {
							onApprove();
						} else if (currentView === 'stake') {
							onStake();
						} else {
							onUnstake();
						}
					}}
					className={'w-full md:w-[184px]'}>
					{currentView === 'stake' ? (hasAllowance ? 'Stake' : 'Approve') : 'Unstake'}
				</Button>
			</div>
		</div>
	);
}

function ViewDetails(): ReactElement {
	const {address} = useWeb3();
	const {getBalance} = useWallet();
	const {data: rate} = useReadContract({
		address: STYETH_TOKEN.address,
		abi: ST_YETH_ABI,
		functionName: 'convertToAssets',
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		args: [toBigInt(1e18)]
	});

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Retrieve the user's balance of yETH.
	 **********************************************************************************************/
	const balanceOf = useMemo((): TNormalizedBN => {
		return toNormalizedBN(
			getBalance({address: STYETH_TOKEN.address, chainID: STYETH_TOKEN.chainID})?.raw || 0,
			STYETH_TOKEN.decimals
		);
	}, [getBalance]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Retrieve the totalSupply of st-yETH. Based on that and the user's balance, calculate the
	 ** user's share of the pool.
	 **********************************************************************************************/
	const {data: totalSupply} = useReadContract({
		address: STYETH_TOKEN.address,
		abi: ST_YETH_ABI,
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		functionName: 'totalSupply'
	});

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Retrieve the locked st-yETH in the bootstrap contract for the current user
	 **********************************************************************************************/
	const {data: lockedTokens} = useReadContract({
		abi: BOOTSTRAP_ABI,
		address: toAddress(process.env.BOOTSTRAP_ADDRESS),
		functionName: 'deposits',
		args: [toAddress(address)],
		chainId: Number(process.env.DEFAULT_CHAIN_ID)
	});

	return (
		<div className={'col-span-12 py-6 pl-0 md:py-10 md:pl-72'}>
			<div className={'mb-10 flex w-full flex-col !rounded-md bg-neutral-100'}>
				<h2 className={'text-xl font-black'}>{'Details'}</h2>
				<dl className={'grid grid-cols-3 gap-2 pt-4'}>
					<dt className={'col-span-2'}>{'yETH per st-yETH'}</dt>
					<dd
						suppressHydrationWarning
						className={'text-right font-bold'}>
						{formatAmount(toNormalizedBN(toBigInt(rate), 18).normalized, 6, 6)}
					</dd>

					<dt className={'col-span-2'}>{'Your share of the pool'}</dt>
					<dd className={'text-right font-bold'}>
						<RenderAmount
							value={
								Number(
									toNormalizedBN(
										((toBigInt(lockedTokens) + balanceOf.raw) * toBigInt(1e18)) /
											(totalSupply || 1n),
										18
									).normalized
								) || 0
							}
							symbol={'percent'}
							decimals={6}
						/>
					</dd>

					{lockedTokens && lockedTokens >= 0n ? (
						<>
							<dt className={'col-span-2'}>{'Your bootstrap st-yETH'}</dt>
							<dd className={'text-right font-bold'}>
								{formatAmount(toNormalizedBN(lockedTokens || 0n, 18).normalized, 6, 6)}
							</dd>
						</>
					) : (
						<Fragment />
					)}
				</dl>
			</div>
			<div>
				<h2 className={'text-xl font-black'}>{'Info'}</h2>
				<p className={'whitespace-break-spaces pt-4 text-neutral-600'}>
					{
						'Stake your yETH into st-yETH to start earning liquid staking yield.\n\nYou can unstake back into yETH at any time.\n\nStaked yETH is used in protocol governance, you accrue voting power over time by simply holding st-yETH. Moving or unstaking it resets your voting power.'
					}

					{lockedTokens && lockedTokens >= 0n ? (
						<>
							{'Your st-yETH from the yETH bootstrap has a lock period. See details above for more info.'}
						</>
					) : (
						<Fragment />
					)}
				</p>
			</div>
		</div>
	);
}

function ViewStake(): ReactElement {
	return (
		<section className={'relative px-4 md:px-72'}>
			<div
				className={
					'md:grid-cols-30 grid grid-cols-1 divide-x-0 divide-y-2 divide-neutral-300 md:divide-x-2 md:divide-y-0'
				}>
				<ViewStakeUnstake />
				<ViewDetails />
			</div>
		</section>
	);
}

export default ViewStake;
