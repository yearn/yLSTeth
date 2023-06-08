import React, {createContext, useContext, useMemo, useState} from 'react';
import useBootstrapPeriods from 'hooks/useBootstrapPeriods';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {useContractReads} from 'wagmi';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {isZeroAddress, toAddress} from '@yearn-finance/web-lib/utils/address';

import type {TUseBootstrapPeriodsResp} from 'hooks/useBootstrapPeriods';
import type {Dispatch, SetStateAction} from 'react';
import type {TAddress} from '@yearn-finance/web-lib/types';

export type TUseBootstrapProps = {
	periods: TUseBootstrapPeriodsResp | undefined,
	selectedToken: TAddress | undefined,
	set_selectedToken: Dispatch<SetStateAction<TAddress | undefined>>,
	hasApplied: boolean,
	isWhitelisted: boolean,
	updateApplicationStatus: any
}
const defaultProps: TUseBootstrapProps = {
	periods: undefined,
	selectedToken: undefined,
	set_selectedToken: (): void => undefined,
	hasApplied: false,
	isWhitelisted: false,
	updateApplicationStatus: async (): Promise<void> => undefined
};

const Bootstrap = createContext<TUseBootstrapProps>(defaultProps);
export const BootstrapContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const {chainID} = useChainID();
	const periods = useBootstrapPeriods();
	const [selectedToken, set_selectedToken] = useState<TAddress | undefined>();
	const {data, refetch, isSuccess} = useContractReads({
		contracts: [
			{
				address: toAddress(process.env.BOOTSTRAP_ADDRESS),
				abi: BOOTSTRAP_ABI,
				chainId: chainID,
				functionName: 'has_applied',
				args: [toAddress(selectedToken)]
			},
			{
				address: toAddress(process.env.BOOTSTRAP_ADDRESS),
				abi: BOOTSTRAP_ABI,
				chainId: chainID,
				functionName: 'is_whitelisted',
				args: [toAddress(selectedToken)]
			}
		],
		enabled: false
	});
	const [applied, whitelisted] = data || [];
	const hasValidInput = isSuccess && !isZeroAddress(selectedToken);
	const hasApplied = hasValidInput ? applied?.status === 'success' && applied?.result : false;
	const isWhitelisted = hasValidInput ? whitelisted?.status === 'success' && whitelisted?.result : false;

	const	contextValue = useMemo((): TUseBootstrapProps => ({
		periods,
		selectedToken,
		set_selectedToken,
		hasApplied,
		isWhitelisted,
		updateApplicationStatus: refetch
	}), [hasApplied, isWhitelisted, periods, refetch, selectedToken]);

	return (
		<Bootstrap.Provider value={contextValue}>
			{children}
		</Bootstrap.Provider>
	);
};


const useBootstrap = (): TUseBootstrapProps => useContext(Bootstrap);
export default useBootstrap;
