import React, {createContext, useContext, useMemo} from 'react';
import useBootstrapIncentives from '@yUSD/hooks/useBootstrapIncentives';

import type {TUseBootstrapIncentivesResp} from '@yUSD/hooks/useBootstrapIncentives';

export type TUseBootstrapProps = {
	incentives: TUseBootstrapIncentivesResp;
};
const defaultProps: TUseBootstrapProps = {
	incentives: {} as unknown as TUseBootstrapIncentivesResp
};

//TODO: FOR OUR BOOTSTRAP V2, WE PROBABLY NEED TO UPDATE THIS HOOK TO BEHAVE MORE LIKE USEBASKET

const Bootstrap = createContext<TUseBootstrapProps>(defaultProps);
export const BootstrapContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	// const periods = useBootstrapPeriods();
	// const whitelistedLST = useBootstrapWhitelistedLST();
	// const voting = useBootstrapVoting();
	const incentives = useBootstrapIncentives();
	const contextValue = useMemo(
		(): TUseBootstrapProps => ({
			incentives
		}),
		[incentives]
	);

	return <Bootstrap.Provider value={contextValue}>{children}</Bootstrap.Provider>;
};

const useBootstrap = (): TUseBootstrapProps => useContext(Bootstrap);
export default useBootstrap;
