import React, {createContext, useContext, useMemo} from 'react';
import useBootstrapIncentives from '@yUSD/hooks/useBootstrapIncentives';
import useBootstrapPeriods from '@yUSD/hooks/useBootstrapPeriods';
import useBootstrapVoting from '@yUSD/hooks/useBootstrapVoting';
import useDepositHistory from '@yUSD/hooks/useDepositHistory';
import {possibleTokensToVoteFor} from '@yUSD/utils/constants';

import type {TUseBootstrapIncentivesResp} from '@yUSD/hooks/useBootstrapIncentives';
import type {TUseBootstrapPeriodsResp} from '@yUSD/hooks/useBootstrapPeriods';
import type {TUseBootstrapVotingResp} from '@yUSD/hooks/useBootstrapVoting';
import type {TUseDepositHistoryResp} from '@yUSD/hooks/useDepositHistory';
import type {TIndexedTokenInfo} from '@libUtils/types';

export type TUseBootstrapProps = {
	incentives: TUseBootstrapIncentivesResp;
	depositHistory: TUseDepositHistoryResp;
	voting: TUseBootstrapVotingResp;
	periods: TUseBootstrapPeriodsResp;
	assets: TIndexedTokenInfo[];
};
const defaultProps: TUseBootstrapProps = {
	incentives: {} as unknown as TUseBootstrapIncentivesResp,
	depositHistory: {} as unknown as TUseDepositHistoryResp,
	voting: {} as unknown as TUseBootstrapVotingResp,
	periods: {} as unknown as TUseBootstrapPeriodsResp,
	assets: []
};

const Bootstrap = createContext<TUseBootstrapProps>(defaultProps);
export const BootstrapContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const assets = useMemo(() => Object.values(possibleTokensToVoteFor), []);
	const periods = useBootstrapPeriods();
	const voting = useBootstrapVoting();
	const depositHistory = useDepositHistory();
	const incentives = useBootstrapIncentives();
	const contextValue = useMemo(
		(): TUseBootstrapProps => ({
			incentives,
			depositHistory,
			voting,
			assets,
			periods
		}),
		[assets, depositHistory, incentives, voting, periods]
	);

	return <Bootstrap.Provider value={contextValue}>{children}</Bootstrap.Provider>;
};

const useBootstrap = (): TUseBootstrapProps => useContext(Bootstrap);
export default useBootstrap;
