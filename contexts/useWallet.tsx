import React, {createContext, memo, useCallback, useContext, useMemo, useState} from 'react';
import {LST} from 'utils/constants';
import {STYETH_TOKEN, YETH_TOKEN} from 'utils/tokens';
import {useLocalStorageValue, useMountEffect, useUpdateEffect} from '@react-hookz/web';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {type TUseBalancesTokens,useBalances} from '@yearn-finance/web-lib/hooks/useBalances';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {getNetwork} from '@yearn-finance/web-lib/utils/wagmi/utils';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TDict} from '@yearn-finance/web-lib/types';
import type {TBalanceData} from '@yearn-finance/web-lib/types/hooks';
import type {TTokenInfo} from './useTokenList';


export type TWalletContext = {
	balances: TDict<TBalanceData>,
	balancesNonce: number,
	isLoading: boolean,
	walletProvider: string,
	refresh: (tokenList?: TUseBalancesTokens[], shouldSaveInStorage?: boolean) => Promise<TDict<TBalanceData>>,
	refreshWithList: (tokenList: TDict<TTokenInfo>) => Promise<TDict<TBalanceData>>,
	set_walletProvider: Dispatch<SetStateAction<string>>,
}

const defaultProps = {
	balances: {},
	balancesNonce: 0,
	isLoading: true,
	walletProvider: 'NONE',
	refresh: async (): Promise<TDict<TBalanceData>> => ({}),
	refreshWithList: async (): Promise<TDict<TBalanceData>> => ({}),
	set_walletProvider: (): void => undefined
};

/* 🔵 - Yearn Finance **********************************************************
** This context controls most of the user's wallet data we may need to
** interact with our app, aka mostly the balances and the token prices.
******************************************************************************/
const WalletContext = createContext<TWalletContext>(defaultProps);
export const WalletContextApp = memo(function WalletContextApp({children}: {children: ReactElement}): ReactElement {
	const {provider, isActive} = useWeb3();
	const {safeChainID} = useChainID();
	const [walletProvider, set_walletProvider] = useState('NONE');
	const {value: extraTokens, set: saveExtraTokens} = useLocalStorageValue<TUseBalancesTokens[]>('yeth/tokens', {defaultValue: []});

	const availableTokens = useMemo((): TUseBalancesTokens[] => {
		const tokens: TUseBalancesTokens[] = [];
		/* 🔵 - Yearn Finance **************************************************
		** First, let's add yETH and st-yETH
		**********************************************************************/
		tokens.push({
			token: YETH_TOKEN.address,
			decimals: YETH_TOKEN.decimals,
			name: YETH_TOKEN.name,
			symbol: YETH_TOKEN.symbol
		});
		tokens.push({
			token: STYETH_TOKEN.address,
			decimals: STYETH_TOKEN.decimals,
			name: STYETH_TOKEN.name,
			symbol: STYETH_TOKEN.symbol
		});

		/* 🔵 - Yearn Finance **************************************************
		** Then add the wrapped ETH token if it exists
		**********************************************************************/
		const {wrappedToken} = getNetwork(safeChainID).contracts;
		if (wrappedToken) {
			tokens.push({
				token: ETH_TOKEN_ADDRESS,
				decimals: wrappedToken.decimals,
				name: wrappedToken.coinName,
				symbol: wrappedToken.coinSymbol
			});
		}

		/* 🔵 - Yearn Finance **************************************************
		** Finally, add all the current LST tokens
		**********************************************************************/
		for (const token of LST) {
			tokens.push({
				token: token.address,
				decimals: token.decimals,
				name: token.name,
				symbol: token.symbol
			});
		}

		return tokens;
	}, [safeChainID]);

	const {data: balances, update, updateSome, nonce, isLoading} = useBalances({tokens: availableTokens});

	const onRefresh = useCallback(async (tokenToUpdate?: TUseBalancesTokens[], shouldSaveInStorage?: boolean): Promise<TDict<TBalanceData>> => {
		if (tokenToUpdate) {
			const updatedBalances = await updateSome(tokenToUpdate);
			if (shouldSaveInStorage) {
				saveExtraTokens([...(extraTokens || []), ...tokenToUpdate]);
			}
			return updatedBalances;
		}
		const updatedBalances = await update();
		return updatedBalances;
	}, [update, updateSome, saveExtraTokens, extraTokens]);

	const onRefreshWithList = useCallback(async (newTokenList: TDict<TTokenInfo>): Promise<TDict<TBalanceData>> => {
		const withDefaultTokens = [...Object.values(newTokenList)];
		const tokens: TUseBalancesTokens[] = [];
		withDefaultTokens
			.filter((token): boolean => token.chainId === safeChainID)
			.forEach((token): void => {
				tokens.push({token: token.address, decimals: Number(token.decimals), name: token.name, symbol: token.symbol});
			});
		const tokensToFetch = tokens.filter((token): boolean => {
			return !availableTokens.find((availableToken): boolean => availableToken.token === token.token);
		});
		if (tokensToFetch.length > 0) {
			return await onRefresh(tokensToFetch);
		}
		return balances;
	}, [balances, onRefresh, safeChainID, availableTokens]);

	const onLoadExtraTokens = useCallback(async (): Promise<void> => {
		if (extraTokens) {
			await updateSome(extraTokens);
		}
	}, [extraTokens, updateSome]);

	useMountEffect((): void => {
		if (!isActive) {
			performBatchedUpdates((): void => {
				set_walletProvider('NONE');
			});
		}
	});

	useUpdateEffect((): void => {
		if (isActive) {
			onLoadExtraTokens();
		}
	}, [isActive, onLoadExtraTokens]);

	/* 🔵 - Yearn Finance ******************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	const contextValue = useMemo((): TWalletContext => ({
		balances: provider ? balances : {},
		balancesNonce: nonce,
		isLoading: isLoading || false,
		refresh: onRefresh,
		refreshWithList: onRefreshWithList,
		walletProvider,
		set_walletProvider
	}), [provider, balances, nonce, isLoading, onRefresh, onRefreshWithList, walletProvider]);

	return (
		<WalletContext.Provider value={contextValue}>
			{children}
		</WalletContext.Provider>
	);
});


export const useWallet = (): TWalletContext => useContext(WalletContext);
export default useWallet;
