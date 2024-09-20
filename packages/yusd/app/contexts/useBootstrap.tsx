import React, {createContext, useContext, useMemo} from 'react';
import useBootstrapIncentives from '@yUSD/hooks/useBootstrapIncentives';
import useDepositHistory from '@yUSD/hooks/useDepositHistory';

import type {TUseBootstrapIncentivesResp} from '@yUSD/hooks/useBootstrapIncentives';
import type {TUseDepositHistoryResp} from '@yUSD/hooks/useDepositHistory';

export type TUseBootstrapProps = {
	incentives: TUseBootstrapIncentivesResp;
	depositHistory: TUseDepositHistoryResp;
};
const defaultProps: TUseBootstrapProps = {
	incentives: {} as unknown as TUseBootstrapIncentivesResp,
	depositHistory: {} as unknown as TUseDepositHistoryResp
};

//TODO: FOR OUR BOOTSTRAP V2, WE PROBABLY NEED TO UPDATE THIS HOOK TO BEHAVE MORE LIKE USEBASKET

const Bootstrap = createContext<TUseBootstrapProps>(defaultProps);
export const BootstrapContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	// const periods = useBootstrapPeriods();
	// const whitelistedLST = useBootstrapWhitelistedLST();
	// const voting = useBootstrapVoting();
	const depositHistory = useDepositHistory();
	const incentives = useBootstrapIncentives();
	const contextValue = useMemo(
		(): TUseBootstrapProps => ({
			incentives,
			depositHistory
		}),
		[depositHistory, incentives]
	);

	return <Bootstrap.Provider value={contextValue}>{children}</Bootstrap.Provider>;
};

const useBootstrap = (): TUseBootstrapProps => useContext(Bootstrap);
export default useBootstrap;
