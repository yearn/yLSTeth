import {serialize} from 'wagmi';
import {erc20ABI, multicall} from '@wagmi/core';
import AGGREGATE3_ABI from '@yearn-finance/web-lib/utils/abi/aggregate.abi';
import {toAddress, toWagmiAddress} from '@yearn-finance/web-lib/utils/address';
import {ETH_TOKEN_ADDRESS, MULTICALL3_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {decodeAsBigInt} from '@yearn-finance/web-lib/utils/decoder';
import {toNormalizedValue} from '@yearn-finance/web-lib/utils/format.bigNumber';

import type {TMinBalanceData, TUseBalancesTokens} from 'hooks/useBalances';
import type {NextApiRequest, NextApiResponse} from 'next';
import type {ContractFunctionConfig} from 'viem';
import type {TDict} from '@yearn-finance/web-lib/types';

type TPerformCall = {
	chainID: number,
	address: string,
	tokens: TUseBalancesTokens[]
}
async function getBatchBalances({
	chainID,
	address,
	tokens
}: TPerformCall): Promise<TDict<TMinBalanceData>> {
	const data: TDict<TMinBalanceData> = {};
	const calls: ContractFunctionConfig[] = [];
	for (const element of tokens) {
		const	{token} = element;
		const	ownerAddress = address;
		const	isEth = toAddress(token) === toAddress(ETH_TOKEN_ADDRESS);
		if (isEth) {
			calls.push({address: toWagmiAddress(MULTICALL3_ADDRESS), abi: AGGREGATE3_ABI, functionName: 'getEthBalance', args: [ownerAddress]});
		} else {
			calls.push({address: toWagmiAddress(token), abi: erc20ABI, functionName: 'balanceOf', args: [ownerAddress]});
		}
	}
	try {
		const results = await multicall({contracts: calls as never[], chainId: chainID});

		let		rIndex = 0;
		for (const element of tokens) {
			const {token, symbol, name, decimals} = element;
			const balanceOf = decodeAsBigInt(results[rIndex++]);
			data[toAddress(token)] = {
				decimals: Number(decimals || 18),
				symbol: symbol,
				name: name,
				raw: balanceOf,
				normalized: toNormalizedValue(balanceOf, Number(decimals || 18)),
				force: element.force
			};
		}
	} catch (error) {
		console.warn(error);
	}
	return data;
}

export type TGetBatchBalancesResp = {balances: string, chainID: number};
export default async function handler(req: NextApiRequest, res: NextApiResponse<TGetBatchBalancesResp>): Promise<void> {
	const	balances = await getBatchBalances({
		chainID: Number(req.body.chainID),
		address: req.body.address as string,
		tokens: req.body.tokens as unknown as TUseBalancesTokens[]
	});
	return res.status(200).json({balances: serialize(balances), chainID: req.body.chainID});
}
