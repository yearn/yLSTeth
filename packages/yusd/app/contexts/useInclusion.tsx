/* eslint-disable @typescript-eslint/consistent-type-assertions */

import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {erc20Abi} from 'viem';
import {getLogs} from 'viem/actions';
import {useReadContract} from 'wagmi';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	decodeAsAddress,
	decodeAsNumber,
	decodeAsString,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {INCLUSION_ABI} from '@libAbi/inclusion.abi';
import {INCLUSION_INCENTIVE_ABI} from '@libAbi/inclusionIncentives.abi';
import {getBlockNumber, getClient, readContract, readContracts} from '@wagmi/core';
import {getEpochEndBlock, getEpochStartBlock} from '@yUSD/utils/epochs';

import type {TAddress, TDict, TNDict} from '@builtbymom/web3/types';
import type {TIncentives, TIndexedTokenInfo, TTokenIncentive} from '@libUtils/types';

type TUseInclusionProps = {
	candidates: TIndexedTokenInfo[];
	inclusionIncentives: TIncentives;
	refreshCandidates: () => Promise<void>;
	refreshIncentives: () => Promise<void>;
	refreshEpochIncentives: (epoch: bigint) => Promise<void>;
	getIncentivesForEpoch: (epoch: bigint) => {data: TIncentives; hasData: boolean};
	isLoaded: boolean;
	areIncentivesLoaded: boolean;
	epoch: bigint | undefined;
};
const defaultProps: TUseInclusionProps = {
	candidates: [],
	inclusionIncentives: {},
	refreshCandidates: async (): Promise<void> => undefined,
	refreshIncentives: async (): Promise<void> => undefined,
	refreshEpochIncentives: async (): Promise<void> => undefined,
	getIncentivesForEpoch: (): {data: TIncentives; hasData: boolean} => ({data: {}, hasData: false}),
	isLoaded: false,
	areIncentivesLoaded: false,
	epoch: undefined
};

const InclusionContext = createContext<TUseInclusionProps>(defaultProps);
export const InclusionContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const [isLoaded, set_isLoaded] = useState(false);
	const [candidates, set_candidates] = useState<TIndexedTokenInfo[]>([]);
	const [inclusionIncentives, set_inclusionIncentives] = useState<TIncentives>({});
	const [areIncentivesLoaded, set_areIncentivesLoaded] = useState(false);
	const [pastInclusionIncentives, set_pastInclusionIncentives] = useState<
		TNDict<{data: TIncentives; hasData: boolean}>
	>({});

	const {data: epoch} = useReadContract({
		address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
		abi: INCLUSION_ABI,
		functionName: 'epoch',
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		query: {
			select: (data): bigint => toBigInt(data)
		}
	});

	/**************************************************************************
	 * Retrieve the list of candidates for the inclusion vote
	 *************************************************************************/
	const refreshInclusionList = useAsyncTrigger(async (): Promise<void> => {
		if (!epoch) {
			return;
		}
		/**********************************************************************
		 * Then, we want to retrieve the number of candidates for the current
		 * epoch. This will allow us to retrieve the list of candidates
		 *********************************************************************/
		const numCandidates = await readContract(retrieveConfig(), {
			address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
			abi: INCLUSION_ABI,
			functionName: 'num_candidates',
			chainId: Number(process.env.DEFAULT_CHAIN_ID),
			args: [epoch]
		});

		/**********************************************************************
		 * Then, we retrieve the list of candidates for the current epoch. We
		 * need to add 1 to the number of candidates because the first entry
		 * is always `no change`.
		 *********************************************************************/
		const allCandidates = await readContracts(retrieveConfig(), {
			contracts: Array.from({length: Number(numCandidates)}, (_, i) => ({
				address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
				abi: INCLUSION_ABI,
				functionName: 'candidates',
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				args: [epoch, i + 1]
			}))
		});

		/**********************************************************************
		 * Once we have the candidates, we need to retrieve the information
		 * about the token added to built a proper TToken object. This includes
		 * at least the token name, symbol and decimals
		 *********************************************************************/
		const candidateAddresses = allCandidates.map(candidate => decodeAsAddress(candidate));
		const tokens = await readContracts(retrieveConfig(), {
			contracts: [
				...candidateAddresses.map(candidate => ({
					address: toAddress(candidate),
					abi: erc20Abi,
					functionName: 'name',
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				})),
				...candidateAddresses.map(candidate => ({
					address: toAddress(candidate),
					abi: erc20Abi,
					functionName: 'symbol',
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				})),
				...candidateAddresses.map(candidate => ({
					address: toAddress(candidate),
					abi: erc20Abi,
					functionName: 'decimals',
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				}))
			]
		});

		/**********************************************************************
		 * And now we can build the list of candidates with the information
		 * we have retrieved
		 *********************************************************************/
		const candidatesTokens: TIndexedTokenInfo[] = [];
		for (let i = 0; i < candidateAddresses.length; i++) {
			const candidateName = decodeAsString(tokens[i]);
			const candidateSymbol = decodeAsString(tokens[i + candidateAddresses.length]);
			const candidateDecimals = decodeAsNumber(tokens[i + candidateAddresses.length * 2]);
			candidatesTokens.push({
				address: candidateAddresses[i],
				name: candidateName,
				symbol: candidateSymbol,
				decimals: candidateDecimals,
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				balance: toNormalizedBN(0n, candidateDecimals),
				value: 0,
				index: i + 1
			});
		}
		set_candidates(candidatesTokens);
		set_isLoaded(true);
	}, [epoch]);

	/**************************************************************************
	 * Once we have the list of candidates, it's possible for us to try to
	 * retrieve the list of incentives for each candidate
	 *************************************************************************/
	const refreshInclusionIncentives = useCallback(async (_epoch: bigint): Promise<void> => {
		const rangeLimit = toBigInt(Number(process.env.RANGE_LIMIT));
		const epochStartBlock = getEpochStartBlock(Number(_epoch));
		const epochEndBlock = getEpochEndBlock(Number(_epoch));
		const currentBlock = await getBlockNumber(retrieveConfig());
		const checkUpToBlock = epochEndBlock < currentBlock ? epochEndBlock : currentBlock;
		const publicClient = getClient(retrieveConfig());

		type TDetectedIncentives = {
			amount: bigint;
			candidate: TAddress;
			depositor: TAddress;
			token: TAddress;
		};
		const detectedIncentives: TDetectedIncentives[] = [];
		if (publicClient) {
			for (let i = epochStartBlock; i < checkUpToBlock; i += rangeLimit) {
				const events = await getLogs(publicClient, {
					address: toAddress(process.env.INCLUSION_INCENTIVES_ADDRESS),
					event: INCLUSION_INCENTIVE_ABI[0],
					fromBlock: i,
					toBlock: i + rangeLimit,
					args: {
						epoch: _epoch
					}
				});
				for (const log of events) {
					detectedIncentives.push({
						amount: toBigInt(log.args.amount),
						candidate: toAddress(log.args.candidate),
						depositor: toAddress(log.args.depositor),
						token: toAddress(log.args.token)
					});
				}
			}
		}

		/**********************************************************************
		 * Once we have all the incentives for the current epoch, we can assign
		 * them to the candidates. However, we first need to retrieve the
		 * information about the token added to built a proper TToken object.
		 * To avoid duplicate calls, we will build a map of unique token
		 * address
		 *********************************************************************/
		const tokensData = await readContracts(retrieveConfig(), {
			contracts: [
				...detectedIncentives.map(item => ({
					address: toAddress(item.token),
					abi: erc20Abi,
					functionName: 'name',
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				})),
				...detectedIncentives.map(item => ({
					address: toAddress(item.token),
					abi: erc20Abi,
					functionName: 'symbol',
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				})),
				...detectedIncentives.map(item => ({
					address: toAddress(item.token),
					abi: erc20Abi,
					functionName: 'decimals',
					chainId: Number(process.env.DEFAULT_CHAIN_ID)
				}))
			]
		});
		const byCandidate: TDict<TDict<TTokenIncentive[]>> = {};
		for (let i = 0; i < detectedIncentives.length; i++) {
			const {candidate, token} = detectedIncentives[i];
			if (!byCandidate[candidate]) {
				byCandidate[candidate] = {};
			}
			if (!byCandidate[candidate][token]) {
				byCandidate[candidate][token] = [];
			}

			const tokenAddress = detectedIncentives[i].token;
			const tokenName = decodeAsString(tokensData[i]);
			const tokenSymbol = decodeAsString(tokensData[i + detectedIncentives.length]);
			const tokenDecimals = decodeAsNumber(tokensData[i + detectedIncentives.length * 2]);
			const amount = toNormalizedBN(detectedIncentives[i].amount, tokenDecimals);
			byCandidate[candidate][token].push({
				address: toAddress(tokenAddress),
				name: tokenName,
				symbol: tokenSymbol,
				decimals: tokenDecimals,
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				balance: zeroNormalizedBN,
				depositor: detectedIncentives[i].depositor,
				value: 0,
				amount
			});
		}

		set_areIncentivesLoaded(true);
		set_inclusionIncentives(byCandidate);
		set_pastInclusionIncentives(prev => ({...prev, [Number(_epoch)]: {data: byCandidate, hasData: true}}));
	}, []);

	const triggerInclusionIncentivesRefresh = useAsyncTrigger(async (): Promise<void> => {
		if (!epoch) {
			return;
		}
		await refreshInclusionIncentives(epoch);

		//For the claim section, we need the previous epoch incentives
		refreshInclusionIncentives(epoch - 1n);
	}, [epoch, refreshInclusionIncentives]);

	/**************************************************************************
	 * getIncentivesForEpoch is a function that will retrieve the incentives
	 * for a given epoch.
	 *************************************************************************/
	const getIncentivesForEpoch = useCallback(
		(_epoch: bigint): {data: TIncentives; hasData: boolean} => {
			if (!pastInclusionIncentives[Number(_epoch)]) {
				return {data: {}, hasData: false};
			}
			return pastInclusionIncentives[Number(_epoch)];
		},
		[pastInclusionIncentives]
	);

	const contextValue = useMemo(
		(): TUseInclusionProps => ({
			candidates,
			inclusionIncentives,
			refreshCandidates: refreshInclusionList,
			refreshIncentives: triggerInclusionIncentivesRefresh,
			refreshEpochIncentives: refreshInclusionIncentives,
			getIncentivesForEpoch,
			isLoaded: isLoaded,
			areIncentivesLoaded,
			epoch
		}),
		[
			candidates,
			inclusionIncentives,
			isLoaded,
			getIncentivesForEpoch,
			refreshInclusionList,
			refreshInclusionIncentives,
			triggerInclusionIncentivesRefresh,
			areIncentivesLoaded,
			epoch
		]
	);

	return <InclusionContext.Provider value={contextValue}>{children}</InclusionContext.Provider>;
};

const useInclusion = (): TUseInclusionProps => useContext(InclusionContext);
export default useInclusion;
