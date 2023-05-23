import {useMemo} from 'react';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {useContractReads} from 'wagmi';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toWagmiAddress} from '@yearn-finance/web-lib/utils/address';

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
}
function useBootstrapPeriods(): TUseBootstrapPeriodsResp {
	const {chainID} = useChainID();
	const bootstrapContractReadData = useMemo((): TBaseReadContractData => ({
		address: toWagmiAddress(process.env.BOOTSTRAP_ADDRESS),
		abi: BOOTSTRAP_ABI,
		chainId: chainID
	}), [chainID]);

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

	return {
		whitelistBegin: toTBaseReadContractResult(whitelistBegin),
		whitelistEnd: toTBaseReadContractResult(whitelistEnd),
		incentiveBegin: toTBaseReadContractResult(incentiveBegin),
		incentiveEnd: toTBaseReadContractResult(incentiveEnd),
		depositBegin: toTBaseReadContractResult(depositBegin),
		depositEnd: toTBaseReadContractResult(depositEnd),
		voteBegin: toTBaseReadContractResult(voteBegin),
		voteEnd: toTBaseReadContractResult(voteEnd)
	};
}

export default useBootstrapPeriods;
