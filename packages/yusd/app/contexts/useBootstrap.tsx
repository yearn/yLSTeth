import React, {createContext, useContext, useMemo} from 'react';
import useBootstrapIncentives from '@yUSD/hooks/useBootstrapIncentives';
import useBootstrapVoting from '@yUSD/hooks/useBootstrapVoting';
import useDepositHistory from '@yUSD/hooks/useDepositHistory';
import {possibleTokensToVoteFor} from '@yUSD/utils/constants';

import type {TUseBootstrapIncentivesResp} from '@yUSD/hooks/useBootstrapIncentives';
import type {TUseBootstrapVotingResp} from '@yUSD/hooks/useBootstrapVoting';
import type {TUseDepositHistoryResp} from '@yUSD/hooks/useDepositHistory';
import type {TIndexedTokenInfo} from '@libUtils/types';

export type TUseBootstrapProps = {
	incentives: TUseBootstrapIncentivesResp;
	depositHistory: TUseDepositHistoryResp;
	voting: TUseBootstrapVotingResp;
	assets: TIndexedTokenInfo[];
};
const defaultProps: TUseBootstrapProps = {
	incentives: {} as unknown as TUseBootstrapIncentivesResp,
	depositHistory: {} as unknown as TUseDepositHistoryResp,
	voting: {} as unknown as TUseBootstrapVotingResp,
	assets: []
};

//TODO: FOR OUR BOOTSTRAP V2, WE PROBABLY NEED TO UPDATE THIS HOOK TO BEHAVE MORE LIKE USEBASKET

const Bootstrap = createContext<TUseBootstrapProps>(defaultProps);
export const BootstrapContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	// const periods = useBootstrapPeriods();
	// const whitelistedLST = useBootstrapWhitelistedLST();
	const assets = useMemo(() => Object.values(possibleTokensToVoteFor), []);
	const voting = useBootstrapVoting();
	const depositHistory = useDepositHistory();
	const incentives = useBootstrapIncentives();
	const contextValue = useMemo(
		(): TUseBootstrapProps => ({
			incentives,
			depositHistory,
			voting,
			assets
		}),
		[assets, depositHistory, incentives, voting]
	);

	return <Bootstrap.Provider value={contextValue}>{children}</Bootstrap.Provider>;
};

const useBootstrap = (): TUseBootstrapProps => useContext(Bootstrap);
export default useBootstrap;
