import assert from 'assert';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {MULTICALL_ABI} from 'utils/abi/multicall3.abi';
import {erc20ABI, readContract} from '@wagmi/core';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {MAX_UINT_256} from '@yearn-finance/web-lib/utils/constants';
import {handleTx, toWagmiProvider} from '@yearn-finance/web-lib/utils/wagmi/provider';
import {assertAddress} from '@yearn-finance/web-lib/utils/wagmi/utils';

import type {Hex} from 'viem';
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
