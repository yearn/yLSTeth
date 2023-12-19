import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import defaultTokenList from 'utils/tokenLists.json';
import axios from 'axios';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type {AxiosResponse} from 'axios';
import type {Dispatch, SetStateAction} from 'react';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';

export type TTokenInfo = {
	chainId: number;
	address: TAddress;
	name: string;
	symbol: string;
	decimals: number;
	logoURI: string;
	extra?: {
		totalVotes?: bigint;
		votes?: bigint;
		weight?: number;
	};
};
export type TTokenList = {
	name: string;
	description: string;
	timestamp: string;
	logoURI: string;
	uri: string;
	keywords: string[];
	version: {
		major: number;
		minor: number;
		patch: number;
	};
	tokens: TTokenInfo[];
};

export type TTokenListProps = {
	tokenList: TDict<TTokenInfo>;
	set_tokenList: Dispatch<SetStateAction<TDict<TTokenInfo>>>;
};
const defaultProps: TTokenListProps = {
	tokenList: {},
	set_tokenList: (): void => undefined
};

const TokenList = createContext<TTokenListProps>(defaultProps);
export const TokenListContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const {safeChainID} = useChainID();
	const [tokenList, set_tokenList] = useState<TDict<TTokenInfo>>({});

	const fetchTokensFromLists = useCallback(async (): Promise<void> => {
		const tokenListURIs = [
			`https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/${safeChainID}/etherscan.json`,
			`https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/${safeChainID}/yearn.json`,
			`https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/${safeChainID}/tokenlistooor.json`
		];
		const [fromEtherscan, fromYearn, fromSmol] = await Promise.allSettled(
			tokenListURIs.map(async (eachURI: string): Promise<AxiosResponse> => axios.get(eachURI))
		);
		const tokens: TTokenInfo[] = [];
		if (fromEtherscan.status === 'fulfilled' && fromEtherscan.value.data?.tokens) {
			tokens.push(...(fromEtherscan.value.data as TTokenList).tokens);
		}
		if (fromYearn.status === 'fulfilled' && fromYearn.value.data?.tokens) {
			tokens.push(...(fromYearn.value.data as TTokenList).tokens);
		}
		if (fromSmol.status === 'fulfilled' && fromSmol.value.data?.tokens) {
			tokens.push(...(fromSmol.value.data as TTokenList).tokens);
		}

		const tokenListTokens: TDict<TTokenInfo> = {};
		const defaultList = defaultTokenList as Partial<TTokenList>;
		for (const eachToken of defaultList?.tokens || []) {
			if (!tokenListTokens[toAddress(eachToken.address)]) {
				tokenListTokens[toAddress(eachToken.address)] = eachToken;
			}
		}

		for (const eachToken of tokens) {
			if (!tokenListTokens[toAddress(eachToken.address)]) {
				tokenListTokens[toAddress(eachToken.address)] = eachToken;
			}
		}
		set_tokenList(tokenListTokens);
	}, [safeChainID]);
	useEffect((): void => {
		fetchTokensFromLists();
	}, [fetchTokensFromLists]);

	const contextValue = useMemo(
		(): TTokenListProps => ({
			tokenList: tokenList,
			set_tokenList
		}),
		[tokenList]
	);

	return <TokenList.Provider value={contextValue}>{children}</TokenList.Provider>;
};

export const useTokenList = (): TTokenListProps => useContext(TokenList);
