import React, {createContext, useContext, useMemo} from 'react';
import useBootstrapIncentives from 'hooks/useBootstrapIncentives';
import useBootstrapPeriods from 'hooks/useBootstrapPeriods';
import useBootstrapVoting from 'hooks/useBootstrapVoting';
import useBootstrapWhitelistedLSD from 'hooks/useBootstrapWhitelistedLSD';

import type {TUseBootstrapIncentivesResp} from 'hooks/useBootstrapIncentives';
import type {TUseBootstrapPeriodsResp} from 'hooks/useBootstrapPeriods';
import type {TUseBootstrapVotingResp} from 'hooks/useBootstrapVoting';
import type {TUseBootstrapWhitelistedLSDResp} from 'hooks/useBootstrapWhitelistedLSD';

export type TUseBootstrapProps = {
	periods: TUseBootstrapPeriodsResp,
	whitelistedLSD: TUseBootstrapWhitelistedLSDResp,
	voting: TUseBootstrapVotingResp,
	incentives: TUseBootstrapIncentivesResp
}
const defaultProps: TUseBootstrapProps = {
	periods: {} as unknown as TUseBootstrapPeriodsResp,
	whitelistedLSD: {} as unknown as TUseBootstrapWhitelistedLSDResp,
	voting: {} as unknown as TUseBootstrapVotingResp,
	incentives: [] as unknown as TUseBootstrapIncentivesResp
};

const Bootstrap = createContext<TUseBootstrapProps>(defaultProps);
export const BootstrapContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const periods = useBootstrapPeriods();
	const whitelistedLSD = useBootstrapWhitelistedLSD();
	const voting = useBootstrapVoting();
	const incentives = useBootstrapIncentives();

	const contextValue = useMemo((): TUseBootstrapProps => ({
		periods,
		whitelistedLSD,
		voting,
		incentives
	}), [periods, whitelistedLSD, voting, incentives]);

	return (
		<Bootstrap.Provider value={contextValue}>
			{children}
		</Bootstrap.Provider>
	);
};


const useBootstrap = (): TUseBootstrapProps => useContext(Bootstrap);
export default useBootstrap;
