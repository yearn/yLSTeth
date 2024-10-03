import React, {createContext, useContext, useMemo} from 'react';
import useBootstrapIncentives from '@yUSD/hooks/useBootstrapIncentives';
import useBootstrapPeriods from '@yUSD/hooks/useBootstrapPeriods';
import useBootstrapVoting from '@yUSD/hooks/useBootstrapVoting';
import useBootstrapWhitelistedLST from '@yUSD/hooks/useBootstrapWhitelistedLST';

import type {TUseBootstrapIncentivesResp} from '@yUSD/hooks/useBootstrapIncentives';
import type {TUseBootstrapPeriodsResp} from '@yUSD/hooks/useBootstrapPeriods';
import type {TUseBootstrapVotingResp} from '@yUSD/hooks/useBootstrapVoting';
import type {TUseBootstrapWhitelistedLSTResp} from '@yUSD/hooks/useBootstrapWhitelistedLST';

export type TUseBootstrapProps = {
	periods: TUseBootstrapPeriodsResp;
	whitelistedLST: TUseBootstrapWhitelistedLSTResp;
	voting: TUseBootstrapVotingResp;
	incentives: TUseBootstrapIncentivesResp;
};
const defaultProps: TUseBootstrapProps = {
	periods: {} as unknown as TUseBootstrapPeriodsResp,
	whitelistedLST: {} as unknown as TUseBootstrapWhitelistedLSTResp,
	voting: {} as unknown as TUseBootstrapVotingResp,
	incentives: {} as unknown as TUseBootstrapIncentivesResp
};

//TODO: FOR OUR BOOTSTRAP V2, WE PROBABLY NEED TO UPDATE THIS HOOK TO BEHAVE MORE LIKE USEBASKET

const Bootstrap = createContext<TUseBootstrapProps>(defaultProps);
export const BootstrapContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const periods = useBootstrapPeriods();
	const whitelistedLST = useBootstrapWhitelistedLST();
	const voting = useBootstrapVoting();
	const incentives = useBootstrapIncentives();

	const contextValue = useMemo(
		(): TUseBootstrapProps => ({
			periods,
			whitelistedLST,
			voting,
			incentives
		}),
		[periods, whitelistedLST, voting, incentives]
	);

	return <Bootstrap.Provider value={contextValue}>{children}</Bootstrap.Provider>;
};

const useBootstrap = (): TUseBootstrapProps => useContext(Bootstrap);
export default useBootstrap;
