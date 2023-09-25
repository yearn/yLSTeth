import React, {useCallback, useState} from 'react';
import assert from 'assert';
import TokenInput from 'components/common/TokenInput';
import useLST from 'contexts/useLST';
import useWallet from 'contexts/useWallet';
import useAPR from 'hooks/useAPR';
import {CURVE_SWAP_ABI} from 'utils/abi/curveswap.abi';
import {curveExchangeMultiple} from 'utils/actions';
import {LST} from 'utils/constants';
import {ETH_TOKEN, YETH_TOKEN} from 'utils/tokens';
import {zeroAddress} from 'viem';
import curve from '@curvefi/api';
import {useMountEffect, useUpdateEffect} from '@react-hookz/web';
import {readContract} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {type TUseBalancesTokens} from '@yearn-finance/web-lib/hooks/useBalances';
import {IconChevronBottom} from '@yearn-finance/web-lib/icons/IconChevronBottom';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {ETH_TOKEN_ADDRESS, MAX_UINT_256, WETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TLST} from 'hooks/useLSTData';
import type {ReactElement} from 'react';
import type {TEstOutWithBonusPenalty} from 'utils/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';
import type {PoolTemplate} from '@curvefi/api/lib/pools';

function ViewDepositETH({onChangeTab, estimateOut, onEstimateOut}: {
	onChangeTab: VoidFunction,
	estimateOut: TEstOutWithBonusPenalty,
	onEstimateOut: (val: TEstOutWithBonusPenalty) => void
}): ReactElement {
	const {isActive, provider} = useWeb3();
	const {slippage, onUpdateLST} = useLST();
	const APR = useAPR();
	const {refresh} = useWallet();
	const [txStatus, set_txStatus] = useState<TTxStatus>(defaultTxStatus);
	const [tokenToReceiveVsEth] = useState<TLST>(YETH_TOKEN as TLST);
	const [fromEthAmount, set_fromEthAmount] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [curvePoolFromAPI, set_curvePoolFromAPI] = useState<PoolTemplate | undefined>(undefined);
	const [hasDeposited, set_hasDeposited] = useState<boolean>(false);

	/** 🔵 - Yearn *************************************************************************************
	** The following block of code is responsible for initializing the Curve API and fetching the pools.
	** We are using the 'useMountEffect' hook to ensure this operation is performed once the component
	** is mounted, and only once
	**
	** The 'init' function is called with the 'JsonRpc' provider and the URL of the JSON RPC server.
	** The 'fetchPools' function is then called to retrieve the list of available pools.
	**
	** Finally, we retrieve the pool with the id 'factory-v2-347' and store it in the
	** 'curvePoolFromAPI' state variable. This pool is the one used to swap ETH for yETH.
	**************************************************************************************************/
	useMountEffect(async (): Promise<void> => {
		await curve.init('JsonRpc', {url: process.env.JSON_RPC_URL?.[1] || 'https://eth.llamarpc.com'}, {chainId: 1});
		await curve.factory.fetchPools();
		const pool = curve.getPool('factory-v2-347');
		set_curvePoolFromAPI(pool);
	});

	/* 🔵 - Yearn Finance **************************************************************************
	** The following block of code is responsible for estimating the output of a swap operation.
	** In this case, we are calling the `get_exchange_multiple_amount` function of the contract at
	** address '0x99a58482BD75cbab83b27EC03CA68fF489b5788f'.
	** This function takes three arguments:
	** - an array of token addresses
	** - an array of token amounts
	** - the amount of ETH to swap
	**
	** The function returns the estimated amount of tokens that will be received in the swap.
	** This estimated amount is then passed to the `onEstimateOut` function whenever it changes.
	**
	** We also use this occasion to retrieve the swap price impact from the curve pool.
	**********************************************************************************************/
	const onUpdateFromAmount = useCallback(async (newAmount: TNormalizedBN, currentSlippage: bigint): Promise<void> => {
		set_fromEthAmount(newAmount);
		let pool = curvePoolFromAPI;
		if (!pool) {
			await curve.init('JsonRpc', {url: process.env.JSON_RPC_URL?.[1] || 'https://eth.llamarpc.com'}, {chainId: 1});
			await curve.factory.fetchPools();
			pool = curve.getPool('factory-v2-347') as PoolTemplate;
			set_curvePoolFromAPI(pool);
		}
		const result = await Promise.allSettled([
			readContract({
				address: toAddress(process.env.CURVE_SWAP_ADDRESS),
				abi: CURVE_SWAP_ABI,
				functionName: 'get_exchange_multiple_amount',
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				args: [
					[
						ETH_TOKEN_ADDRESS,
						WETH_TOKEN_ADDRESS,
						WETH_TOKEN_ADDRESS,
						toAddress(process.env.CURVE_YETH_POOL_ADDRESS),
						YETH_TOKEN.address,
						toAddress(zeroAddress),
						toAddress(zeroAddress),
						toAddress(zeroAddress),
						toAddress(zeroAddress)
					],
					[
						[0n, 0n, 15n],
						[0n, 1n, 1n],
						[0n, 0n, 0n],
						[0n, 0n, 0n]
					],
					newAmount.raw || 0n
				]
			}),
			pool.swapPriceImpact(WETH_TOKEN_ADDRESS, YETH_TOKEN.address, newAmount.normalized)
		]);
		const estimateOut = result[0].status === 'fulfilled' ? result[0].value : 0n;
		const priceImpact = result[1].status === 'fulfilled' ? result[1].value : 0;

		const estimateOutWith1PercentSlippage: bigint = estimateOut - (estimateOut * currentSlippage / 10000n);
		onEstimateOut({value: estimateOutWith1PercentSlippage, bonusOrPenalty: -priceImpact});
	}, [curvePoolFromAPI, onEstimateOut]);

	useUpdateEffect((): void => {
		onUpdateFromAmount(fromEthAmount, slippage);
	}, [slippage]);


	const onDeposit = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');

		const result = await curveExchangeMultiple({
			connector: provider,
			contractAddress: toAddress(process.env.CURVE_SWAP_ADDRESS),
			amount: fromEthAmount.raw,
			estimateOut: toBigInt(estimateOut.value),
			statusHandler: set_txStatus
		});
		if (result.isSuccessful) {
			onUpdateLST();
			await refresh([
				{...ETH_TOKEN, token: ETH_TOKEN.address},
				{...YETH_TOKEN, token: YETH_TOKEN.address},
				...LST.map((item): TUseBalancesTokens => ({...item, token: item.address}))
			]);
			onEstimateOut({value: toBigInt(0), bonusOrPenalty: 0});
			set_fromEthAmount(toNormalizedBN(0));
			set_hasDeposited(true);
		}
	}, [estimateOut.value, fromEthAmount.raw, isActive, onEstimateOut, onUpdateLST, provider, refresh]);

	return (
		<>
			<div className={'mt-5 grid pt-4'}>
				<TokenInput
					allowance={toNormalizedBN(MAX_UINT_256)}
					shouldCheckAllowance={false}
					token={ETH_TOKEN as TLST}
					value={fromEthAmount}
					onChange={(v): void => {
						onUpdateFromAmount(v, slippage);
					}} />
				<div className={'mb-9 mt-6 flex w-full justify-center'}>
					<button className={'cursor-pointer'}>
						<IconChevronBottom className={'h-4 w-4'} />
					</button>
				</div>
				<TokenInput
					allowance={toNormalizedBN(MAX_UINT_256)}
					shouldCheckAllowance={false}
					shouldCheckBalance={false}
					token={tokenToReceiveVsEth}
					// tokens={[YETH_TOKEN as TLST, STYETH_TOKEN as TLST]}
					// onChangeToken={(token): void => set_tokenToReceiveVsEth(token)}
					value={toNormalizedBN(toBigInt(estimateOut.value))}
					onChange={(): void => undefined}
					isDisabled />
			</div>
			<div className={'mt-10 flex justify-start'}>
				<div className={'flex w-full flex-row space-x-4'}>
					<Button
						onClick={async (): Promise<void> => {
							onDeposit();
						}}
						isBusy={txStatus.pending}
						isDisabled={!provider || toBigInt(estimateOut.value) === 0n}
						className={'w-full md:w-[184px]'}>
						{'Confirm'}
					</Button>
				</div>
			</div>
			<div
				onClick={(): void => onChangeTab()}
				className={cl('mt-10 flex cursor-pointer flex-row items-center justify-between space-x-4 rounded-md bg-purple-300 p-4 text-white transition-all hover:bg-purple-300/90 hover:shadow-lg', !hasDeposited ? 'hidden pointer-events-none' : 'pointer-events-auto')}>
				<div>
					<b className={'text-sm'}>{'Nice deposit!'}</b>
					<p className={'text-sm'}>
						{'Now, let\'s go earn you up to '}
						<b suppressHydrationWarning>{formatAmount(APR, 2, 2)}</b>
						{'% on your yETH'}
					</p>
				</div>
				<IconChevronBottom className={'h-6 w-6 -rotate-90'} />
			</div>
		</>

	);
}

export {ViewDepositETH};
