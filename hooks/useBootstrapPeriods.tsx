import {useMemo} from 'react';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {useContractReads} from 'wagmi';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';

import type {TAddressWagmi} from '@yearn-finance/web-lib/types';

type TBaseReadContractData = {
	address: TAddressWagmi;
	abi: typeof BOOTSTRAP_ABI;
	chainId: number;
}
type TBaseReadContractRawResult = {
	error: Error;
	result?: undefined;
	status: 'failure';
} | {
	error?: undefined;
	result: bigint;
	status: 'success';
} | undefined

type TBaseReadContractResult = {
	result: bigint | undefined;
	status: 'success' | 'failure' | undefined;
	error?: Error | undefined;
}

function toTBaseReadContractResult(data: TBaseReadContractRawResult): TBaseReadContractResult {
	return {
		result: data?.result,
		status: data?.status,
		error: data?.error
	};
}

export type TUseBootstrapPeriodsResp = {
	whitelistBegin: TBaseReadContractResult;
	whitelistEnd: TBaseReadContractResult;
	incentiveBegin: TBaseReadContractResult;
	incentiveEnd: TBaseReadContractResult;
	depositBegin: TBaseReadContractResult;
	depositEnd: TBaseReadContractResult;
	voteBegin: TBaseReadContractResult;
	voteEnd: TBaseReadContractResult;
	whitelistStatus: 'started' | 'ended' | 'none';
	incentiveStatus: 'started' | 'ended' | 'none';
	depositStatus: 'started' | 'ended' | 'none';
	voteStatus: 'started' | 'ended' | 'none';
}
function useBootstrapPeriods(): TUseBootstrapPeriodsResp {
	const bootstrapContractReadData = useMemo((): TBaseReadContractData => ({
		address: toAddress(process.env.BOOTSTRAP_ADDRESS),
		abi: BOOTSTRAP_ABI,
		chainId: Number(process.env.DEFAULT_CHAINID || 1)
	}), []);

	const {data} = useContractReads({
		contracts: [
			{...bootstrapContractReadData, functionName: 'whitelist_begin'},
			{...bootstrapContractReadData, functionName: 'whitelist_end'},
			{...bootstrapContractReadData, functionName: 'incentive_begin'},
			{...bootstrapContractReadData, functionName: 'incentive_end'},
			{...bootstrapContractReadData, functionName: 'deposit_begin'},
			{...bootstrapContractReadData, functionName: 'deposit_end'},
			{...bootstrapContractReadData, functionName: 'vote_begin'},
			{...bootstrapContractReadData, functionName: 'vote_end'}
		]
	});
	const [whitelistBegin, whitelistEnd, incentiveBegin, incentiveEnd, depositBegin, depositEnd, voteBegin, voteEnd] = data || [];

	const nowBigInt = toBigInt(Math.round(new Date().getTime() / 1000));
	return {
		whitelistBegin: toTBaseReadContractResult(whitelistBegin),
		whitelistEnd: toTBaseReadContractResult(whitelistEnd),
		whitelistStatus: (
			(toBigInt(whitelistBegin?.result) > BigInt(0) && toBigInt(whitelistEnd?.result) > BigInt(0))
				?
				toBigInt(whitelistBegin?.result) > nowBigInt ? 'none' :
					toBigInt(whitelistBegin?.result) < nowBigInt && nowBigInt < toBigInt(whitelistEnd?.result) ? 'started' : 'ended' : 'none'
		),
		incentiveBegin: toTBaseReadContractResult(incentiveBegin),
		incentiveEnd: toTBaseReadContractResult(incentiveEnd),
		incentiveStatus: (
			(toBigInt(incentiveBegin?.result) > BigInt(0) && toBigInt(incentiveEnd?.result) > BigInt(0))
				?
				toBigInt(incentiveBegin?.result) > nowBigInt ? 'none' :
					toBigInt(incentiveBegin?.result) < nowBigInt && nowBigInt < toBigInt(incentiveEnd?.result) ? 'started' : 'ended' : 'none'
		),
		depositBegin: toTBaseReadContractResult(depositBegin),
		depositEnd: toTBaseReadContractResult(depositEnd),
		depositStatus: (
			(toBigInt(depositBegin?.result) > BigInt(0) && toBigInt(depositEnd?.result) > BigInt(0))
				?
				toBigInt(depositBegin?.result) > nowBigInt ? 'none' :
					toBigInt(depositBegin?.result) < nowBigInt && nowBigInt < toBigInt(depositEnd?.result) ? 'started' : 'ended' : 'none'
		),
		voteBegin: toTBaseReadContractResult(voteBegin),
		voteEnd: toTBaseReadContractResult(voteEnd),
		voteStatus: (
			(toBigInt(voteBegin?.result) > BigInt(0) && toBigInt(voteEnd?.result) > BigInt(0))
				?
				toBigInt(voteBegin?.result) > nowBigInt ? 'none' :
					toBigInt(voteBegin?.result) < nowBigInt && nowBigInt < toBigInt(voteEnd?.result) ? 'started' : 'ended' : 'none'
		)
	};
}

export default useBootstrapPeriods;
