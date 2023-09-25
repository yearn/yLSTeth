import assert from 'assert';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {MULTICALL_ABI} from 'utils/abi/multicall3.abi';
import {type Hex,zeroAddress} from 'viem';
import {erc20ABI, readContract} from '@wagmi/core';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {ETH_TOKEN_ADDRESS, MAX_UINT_256, WETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {handleTx, toWagmiProvider} from '@yearn-finance/web-lib/utils/wagmi/provider';
import {assertAddress} from '@yearn-finance/web-lib/utils/wagmi/utils';

import {STYETH_TOKEN, YETH_TOKEN} from './tokens';
import {CURVE_SWAP_ABI} from './abi/curveswap.abi';
import {ST_YETH_ABI} from './abi/styETH.abi';
import {VOTE_ABI} from './abi/vote.abi';
import {YETH_POOL_ABI} from './abi/yETHPool.abi';
import {ZAP_ABI} from './abi/zap.abi';

import type {Connector} from 'wagmi';
import type {TAddress} from '@yearn-finance/web-lib/types';
import type {TWriteTransaction} from '@yearn-finance/web-lib/utils/wagmi/provider';
import type {TTxResponse} from '@yearn-finance/web-lib/utils/web3/transaction';

//Because USDT do not return a boolean on approve, we need to use this ABI
const ALTERNATE_ERC20_APPROVE_ABI = [{'constant': false, 'inputs': [{'name': '_spender', 'type': 'address'}, {'name': '_value', 'type': 'uint256'}], 'name': 'approve', 'outputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}] as const;

/* 🔵 - Yearn Finance **********************************************************
** isApprovedERC20 is a _VIEW_ function that checks if a token is approved for
** a spender.
******************************************************************************/
export async function isApprovedERC20(
	connector: Connector | undefined,
	tokenAddress: TAddress,
	spender: TAddress,
	amount = MAX_UINT_256
): Promise<boolean> {
	const wagmiProvider = await toWagmiProvider(connector);
	const result = await readContract({
		...wagmiProvider,
		abi: erc20ABI,
		address: tokenAddress,
		functionName: 'allowance',
		args: [wagmiProvider.address, spender]
	});
	return (result || 0n) >= amount;
}

/* 🔵 - Yearn Finance **********************************************************
** allowanceOf is a _VIEW_ function that returns the amount of a token that is
** approved for a spender.
******************************************************************************/
type TAllowanceOf = {
	connector: Connector | undefined,
	tokenAddress: TAddress,
	spenderAddress: TAddress
}
export async function allowanceOf(props: TAllowanceOf): Promise<bigint> {
	const wagmiProvider = await toWagmiProvider(props.connector);
	const result = await readContract({
		...wagmiProvider,
		abi: erc20ABI,
		address: props.tokenAddress,
		functionName: 'allowance',
		args: [wagmiProvider.address, props.spenderAddress]
	});
	return result || 0n;
}

/* 🔵 - Yearn Finance **********************************************************
** approveERC20 is a _WRITE_ function that approves a token for a spender.
**
** @param spenderAddress - The address of the spender.
** @param amount - The amount of collateral to deposit.
******************************************************************************/
type TApproveERC20 = TWriteTransaction & {
	spenderAddress: TAddress | undefined;
	amount: bigint;
};
export async function approveERC20(props: TApproveERC20): Promise<TTxResponse> {
	assertAddress(props.spenderAddress, 'spenderAddress');
	assertAddress(props.contractAddress);

	props.onTrySomethingElse = async (): Promise<TTxResponse> => {
		assertAddress(props.spenderAddress, 'spenderAddress');
		return await handleTx(props, {
			address: props.contractAddress,
			abi: ALTERNATE_ERC20_APPROVE_ABI,
			functionName: 'approve',
			args: [props.spenderAddress, props.amount]
		});
	};

	return await handleTx(props, {
		address: props.contractAddress,
		abi: erc20ABI,
		functionName: 'approve',
		args: [props.spenderAddress, props.amount]
	});
}

/* 🔵 - Yearn Finance **********************************************************
** depositETH is a _WRITE_ function that deposits ETH into the bootstrap
** contract in exchange for yETH.
**
** @app - yETH
** @param amount - The amount of collateral to deposit.
******************************************************************************/
type TDepositEth = TWriteTransaction & {
	amount: bigint;
};
export async function depositETH(props: TDepositEth): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(process.env.BOOTSTRAP_ADDRESS, 'BOOTSTRAP_ADDRESS');

	return await handleTx(props, {
		address: process.env.BOOTSTRAP_ADDRESS,
		abi: BOOTSTRAP_ABI,
		functionName: 'deposit',
		value: props.amount
	});
}

/* 🔵 - Yearn Finance **********************************************************
** Incentivize is a _WRITE_ function that incentivizes one of the LST protocols
** with some tokens to vote for it.
**
** @app - yETH
** @param amount - The amount of collateral to deposit.
******************************************************************************/
type TIncentivize = TWriteTransaction & {
	protocolAddress: TAddress;
	incentiveAddress: TAddress;
	amount: bigint;
};
export async function incentivize(props: TIncentivize): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(process.env.BOOTSTRAP_ADDRESS, 'BOOTSTRAP_ADDRESS');
	assertAddress(props.protocolAddress, 'protocolAddress');
	assertAddress(props.incentiveAddress, 'incentiveAddress');

	return await handleTx(props, {
		address: process.env.BOOTSTRAP_ADDRESS,
		abi: BOOTSTRAP_ABI,
		functionName: 'incentivize',
		args: [props.protocolAddress, props.incentiveAddress, props.amount]
	});
}


/* 🔵 - Yearn Finance **********************************************************
** Vote is a _WRITE_ function that can be used to vote for a protocol. Multiple
** votes can be made at the same time.
**
** @app - yETH
** @param protocols - an array of protocols to vote for.
** @param amounts - an array of amounts to vote for each protocol.
******************************************************************************/
type TVote = TWriteTransaction & {
	protocols: TAddress[];
	amounts: bigint[];
};
export async function vote(props: TVote): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amounts.length === props.protocols.length, 'Amount is 0');
	assertAddress(process.env.BOOTSTRAP_ADDRESS, 'BOOTSTRAP_ADDRESS');
	for (const protocol of props.protocols) {
		assertAddress(protocol, protocol);
	}
	const sumAmount = props.amounts.reduce((a, b): bigint => a + b, 0n);
	assert(sumAmount > 0n, 'Amount is 0');

	return await handleTx(props, {
		address: process.env.BOOTSTRAP_ADDRESS,
		abi: BOOTSTRAP_ABI,
		functionName: 'vote',
		args: [props.protocols, props.amounts]
	});
}

/* 🔵 - Yearn Finance **********************************************************
** multicall is a _WRITE_ function that can be used to cast a multicall
**
** @app - common
** @param protocols - an array of protocols to vote for.
** @param amounts - an array of amounts to vote for each protocol.
******************************************************************************/
type TMulticall = TWriteTransaction & {
	multicallData: {target: TAddress, callData: Hex}[];
};
export async function multicall(props: TMulticall): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.multicallData.length > 0, 'Nothing to do');
	const multicallAddress = toAddress('0xcA11bde05977b3631167028862bE2a173976CA11');

	return await handleTx(props, {
		address: multicallAddress,
		abi: MULTICALL_ABI,
		functionName: 'tryAggregate',
		args: [true, props.multicallData],
		value: 0n
	});
}

/* 🔵 - Yearn Finance **********************************************************
** multicall is a _WRITE_ function that can be used to cast a multicall
**
** @app - common
** @param multicallData - an array of multicalls
******************************************************************************/
type TMulticallValue = TWriteTransaction & {
	multicallData: {
		target: TAddress,
		callData: Hex,
		value: bigint,
		allowFailure: boolean
	}[];
};
export async function multicallValue(props: TMulticallValue): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.multicallData.length > 0, 'Nothing to do');
	assertAddress(props.contractAddress, 'ContractAddress');

	const value = props.multicallData.reduce((a, b): bigint => a + b.value, 0n);
	return await handleTx(props, {
		address: props.contractAddress,
		abi: MULTICALL_ABI,
		functionName: 'aggregate3Value',
		args: [props.multicallData],
		value: value
	});
}


/* 🔵 - Yearn Finance **********************************************************
** addLiquidityToPool is a _WRITE_ function that deposits some of the LP tokens
** into the pool in exchange for yETH.
**
** @app - yETH
** @param amount - The amount of collateral to deposit.
******************************************************************************/
type TAddLiquidityToPool = TWriteTransaction & {
	amounts: bigint[];
	estimateOut: bigint;
};
export async function addLiquidityToPool(props: TAddLiquidityToPool): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.estimateOut > 0n, 'EstimateOut is 0');
	assert(props.amounts.some((amount): boolean => amount > 0n), 'Amount is 0');
	assertAddress(process.env.POOL_ADDRESS, 'POOL_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.POOL_ADDRESS),
		abi: YETH_POOL_ABI,
		functionName: 'add_liquidity',
		args: [props.amounts, props.estimateOut]
	});
}

/* 🔵 - Yearn Finance **********************************************************
** removeLiquidityFromPool is a _WRITE_ function that withdraw some of one
** LP tokens from the pool.
**
** @app - yETH
** @param index - The index of the LP token to get.
** @param amount - The amount of yETH to remove.
** @param minOut - The minimum amount of LP to receive.
******************************************************************************/
type TRemoveLiquidityFromPool = TWriteTransaction & {
	amount: bigint;
	minOuts: bigint[];
};
export async function removeLiquidityFromPool(props: TRemoveLiquidityFromPool): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.minOuts.some((minOut): boolean => minOut > 0n), 'MinOut is 0');
	assertAddress(process.env.POOL_ADDRESS, 'POOL_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.POOL_ADDRESS),
		abi: YETH_POOL_ABI,
		functionName: 'remove_liquidity',
		args: [props.amount, props.minOuts]
	});
}

/* 🔵 - Yearn Finance **********************************************************
** removeLiquiditySingleFromPool is a _WRITE_ function that withdraw some of one
** LP tokens from the pool.
**
** @app - yETH
** @param index - The index of the LP token to get.
** @param amount - The amount of yETH to remove.
** @param minOut - The minimum amount of LP to receive.
******************************************************************************/
type TRemoveLiquiditySingleFromPool = TWriteTransaction & {
	index: bigint;
	amount: bigint;
	minOut: bigint;
};
export async function removeLiquiditySingleFromPool(props: TRemoveLiquiditySingleFromPool): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.minOut > 0n, 'minOut is 0');
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.index >= 0n, 'Index is negative');
	assert(props.index <= 4n, 'Index is too large');
	assertAddress(process.env.POOL_ADDRESS, 'POOL_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.POOL_ADDRESS),
		abi: YETH_POOL_ABI,
		functionName: 'remove_liquidity_single',
		args: [props.index, props.amount, props.minOut]
	});
}


/* 🔵 - Yearn Finance **********************************************************
** stakeYETH is a _WRITE_ function that deposits yETH into the st-yETH contract
** in exchange for shares of st-yETH.
**
** @app - yETH
** @param amount - The amount of collateral to deposit.
******************************************************************************/
type TStakeYETH = TWriteTransaction & {
	amount: bigint;
};
export async function stakeYETH(props: TStakeYETH): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(process.env.STYETH_ADDRESS, 'STYETH_ADDRESS');

	return await handleTx(props, {
		address: STYETH_TOKEN.address,
		abi: ST_YETH_ABI,
		functionName: 'deposit',
		args: [props.amount]
	});
}

/* 🔵 - Yearn Finance **********************************************************
** unstakeYETH is a _WRITE_ function that deposits yETH into the st-yETH contract
** in exchange for shares of st-yETH.
**
** @app - yETH
** @param amount - The amount of collateral to deposit.
******************************************************************************/
type TUnstakeYETH = TWriteTransaction & {
	amount: bigint;
};
export async function unstakeYETH(props: TUnstakeYETH): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(STYETH_TOKEN.address, 'STYETH_TOKEN');

	return await handleTx(props, {
		address: STYETH_TOKEN.address,
		abi: ST_YETH_ABI,
		functionName: 'withdraw',
		args: [props.amount]
	});
}


/* 🔵 - Yearn Finance **********************************************************
** swapLST is a _WRITE_ function that swaps one of the LST tokens for another.
**
** @app - yETH
** @param lstTokenFromIndex - The index of the LST token to swap from
** @param lstTokenToIndex - The index of the LST token to swap to
** @param amount - The amount of LST tokens from to swap
** @param minAmountOut - The minimum amount of LST tokens to receive
******************************************************************************/
type TSwapLST = TWriteTransaction & {
	lstTokenFromIndex: bigint;
	lstTokenToIndex: bigint;
	amount: bigint;
	minAmountOut: bigint;
};
export async function swapLST(props: TSwapLST): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.minAmountOut > 0n, 'minAmountOut is 0');
	assert(props.lstTokenFromIndex >= 0n, 'lstTokenFromIndex is 0');
	assert(props.lstTokenToIndex >= 0n, 'lstTokenToIndex is 0');
	assert(props.lstTokenFromIndex <= 4n, 'lstTokenFromIndex is too high');
	assert(props.lstTokenToIndex <= 4n, 'lstTokenToIndex is too high');
	assert(props.lstTokenFromIndex !== props.lstTokenToIndex, 'lstTokenFromIndex and lstTokenToIndex are the same');
	assertAddress(process.env.POOL_ADDRESS, 'POOL_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.POOL_ADDRESS),
		abi: YETH_POOL_ABI,
		functionName: 'swap',
		args: [props.lstTokenFromIndex, props.lstTokenToIndex, props.amount, props.minAmountOut]
	});
}


/* 🔵 - Yearn Finance **********************************************************
** swapOutLST is a _WRITE_ function that swaps one of the LST tokens for another.
** The main difference between this and swapLST is that this function will
** get the exact amount to receive.
**
** @app - yETH
** @param lstTokenFromIndex - The index of the LST token to swap from
** @param lstTokenToIndex - The index of the LST token to swap to
** @param amount - The amount of LST tokens to to receive
** @param maxAmountIn - The maximum amount of LST tokens to send
******************************************************************************/
type TSwapOutLST = TWriteTransaction & {
	lstTokenFromIndex: bigint;
	lstTokenToIndex: bigint;
	amount: bigint;
	maxAmountIn: bigint;
};
export async function swapOutLST(props: TSwapOutLST): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.maxAmountIn > 0n, 'maxAmountIn is 0');
	assert(props.lstTokenFromIndex >= 0n, 'lstTokenFromIndex is 0');
	assert(props.lstTokenToIndex >= 0n, 'lstTokenToIndex is 0');
	assert(props.lstTokenFromIndex <= 4n, 'lstTokenFromIndex is too high');
	assert(props.lstTokenToIndex <= 4n, 'lstTokenToIndex is too high');
	assert(props.lstTokenFromIndex !== props.lstTokenToIndex, 'lstTokenFromIndex and lstTokenToIndex are the same');
	assertAddress(process.env.POOL_ADDRESS, 'POOL_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.POOL_ADDRESS),
		abi: YETH_POOL_ABI,
		functionName: 'swap_exact_out',
		args: [props.lstTokenFromIndex, props.lstTokenToIndex, props.amount, props.maxAmountIn]
	});
}


/* 🔵 - Yearn Finance **********************************************************
** depositAndStake is a _WRITE_ function that deposits some of the LP tokens
** into the pool in exchange for st-yETH.
**
** @app - yETH
** @param amount - The amount of collateral to deposit.
******************************************************************************/
type TDepositAndStake = TWriteTransaction & {
	amounts: bigint[];
	estimateOut: bigint;
};
export async function depositAndStake(props: TDepositAndStake): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.estimateOut > 0n, 'EstimateOut is 0');
	assert(props.amounts.some((amount): boolean => amount > 0n), 'Amount is 0');
	assertAddress(process.env.ZAP_ADDRESS, 'ZAP_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.ZAP_ADDRESS),
		abi: ZAP_ABI,
		functionName: 'add_liquidity',
		args: [props.amounts, props.estimateOut]
	});
}


/* 🔵 - Yearn Finance **********************************************************
** depositIncentive is a _WRITE_ function that deposits incentives for a given
** choice of vote.
**
** @app - yETH
** @param vote - byte32 id of the vote
** @param choice - index of the choice, 0 always being no change
** @param tokenAsIncentive - address of the token to incentivize
** @param amount - The amount of incentives to deposit.
******************************************************************************/
type TDepositIncentive = TWriteTransaction & {
	vote: Hex;
	choice: bigint;
	tokenAsIncentive: TAddress;
	amount: bigint
};
export async function depositIncentive(props: TDepositIncentive): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.choice >= 0n, 'choice is negative');
	assertAddress(props.tokenAsIncentive, 'tokenAsIncentive');
	assertAddress(process.env.VOTE_ADDRESS, 'VOTE_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.VOTE_ADDRESS),
		abi: VOTE_ABI,
		functionName: 'deposit',
		args: [props.vote, props.choice, props.tokenAsIncentive, props.amount]
	});
}

/* 🔵 - Yearn Finance **********************************************************
** depositAndStake is a _WRITE_ function that deposits some of the LP tokens
** into the pool in exchange for st-yETH.
**
** @app - yETH
** @param amount - The amount of collateral to deposit.
******************************************************************************/
type TCurveExchangeMultiple = TWriteTransaction & {
	amount: bigint;
	estimateOut: bigint;
};
export async function curveExchangeMultiple(props: TCurveExchangeMultiple): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.estimateOut > 0n, 'EstimateOut is 0');
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.contractAddress);

	return await handleTx(props, {
		address: toAddress(props.contractAddress),
		abi: CURVE_SWAP_ABI,
		functionName: 'exchange_multiple',
		value: props.amount,
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
			props.amount,
			props.amount * 995n / 1000n
		]
	});
}
