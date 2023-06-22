import React, {createContext, useContext, useMemo, useState} from 'react';
import useBootstrapPeriods from 'hooks/useBootstrapPeriods';
import useBootstrapWhitelistedLSD from 'hooks/useBootstrapWhitelistedLSD';

import type {TUseBootstrapPeriodsResp} from 'hooks/useBootstrapPeriods';
import type {Dispatch, SetStateAction} from 'react';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';
import type {TTokenInfo} from './useTokenList';

export type TUseBootstrapProps = {
	periods: TUseBootstrapPeriodsResp | undefined,
	whitelistedLSD: TDict<TTokenInfo>,
	selectedToken: TAddress | undefined,
	set_selectedToken: Dispatch<SetStateAction<TAddress | undefined>>,
}
const defaultProps: TUseBootstrapProps = {
	periods: undefined,
	whitelistedLSD: {},
	selectedToken: undefined,
	set_selectedToken: (): void => undefined
};

const Bootstrap = createContext<TUseBootstrapProps>(defaultProps);
export const BootstrapContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const periods = useBootstrapPeriods();
	const {whitelistedLSD} = useBootstrapWhitelistedLSD();
	const [selectedToken, set_selectedToken] = useState<TAddress | undefined>();

	const contextValue = useMemo((): TUseBootstrapProps => ({
		periods,
		whitelistedLSD,
		selectedToken,
		set_selectedToken
	}), [periods, whitelistedLSD, selectedToken]);

	return (
		<Bootstrap.Provider value={contextValue}>
			{children}
		</Bootstrap.Provider>
	);
};


const useBootstrap = (): TUseBootstrapProps => useContext(Bootstrap);
export default useBootstrap;
