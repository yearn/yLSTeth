/* eslint-disable @typescript-eslint/consistent-type-assertions */

import React, {createContext, useContext, useMemo, useState} from 'react';
import {INCLUSION_ABI} from 'app/utils/abi/inclusion.abi';
import {INCLUSION_INCENTIVE_ABI} from 'app/utils/abi/inclusionIncentives.abi';
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
import {getBlockNumber, getClient, readContract, readContracts} from '@wagmi/core';

import type {TIncentives, TIndexedTokenInfo, TTokenIncentive} from 'app/utils/types';
import type {TAddress, TDict} from '@builtbymom/web3/types';

type TUseInclusionProps = {
	candidates: TIndexedTokenInfo[];
	inclusionIncentives: TIncentives;
	refreshCandidates: () => Promise<void>;
	refreshIncentives: () => Promise<void>;
	isLoaded: boolean;
	areIncentivesLoaded: boolean;
};
const defaultProps: TUseInclusionProps = {
	candidates: [],
	inclusionIncentives: {},
	refreshCandidates: async (): Promise<void> => undefined,
	refreshIncentives: async (): Promise<void> => undefined,
	isLoaded: false,
	areIncentivesLoaded: false
};

const InclusionContext = createContext<TUseInclusionProps>(defaultProps);
export const InclusionContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const [candidates, set_candidates] = useState<TIndexedTokenInfo[]>([]);
	const [inclusionIncentives, set_inclusionIncentives] = useState<TIncentives>({});
	const [areIncentivesLoaded, set_areIncentivesLoaded] = useState(false);

	const {data: epoch} = useReadContract({
		address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
		abi: INCLUSION_ABI,
		functionName: 'epoch',
		chainId: Number(process.env.DEFAULT_CHAIN_ID)
	});

	/**************************************************************************
	 * Retrieve the list of candidates for the inclusion vote
	 *************************************************************************/
	const refreshInclusionList = useAsyncTrigger(async (): Promise<void> => {
		if (!epoch) return;
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
				price: toNormalizedBN(0n, 18),
				index: i + 1
			});
		}
		set_candidates(candidatesTokens);
	}, [epoch]);

	/**************************************************************************
	 * Once we have the list of candidates, it's possible for us to try to
	 * retrieve the list of incentives for each candidate
	 *************************************************************************/
	const refreshInclusionIncentives = useAsyncTrigger(async (): Promise<void> => {
		if (!epoch) return;
		if (!candidates.length) return;
		const rangeLimit = 800n;
		const epochStartBlock = 19439849n; //getEpochStartBlock(Number(epoch));
		const epochEndBlock = 19439851n; //getEpochEndBlock(Number(epoch));
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
						epoch: epoch
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
		const tokens: TDict<TTokenIncentive> = {};
		for (let i = 0; i < detectedIncentives.length; i++) {
			const tokenAddress = detectedIncentives[i].token;
			const tokenName = decodeAsString(tokensData[i]);
			const tokenSymbol = decodeAsString(tokensData[i + detectedIncentives.length]);
			const tokenDecimals = decodeAsNumber(tokensData[i + detectedIncentives.length * 2]);
			const amount = toNormalizedBN(detectedIncentives[i].amount, tokenDecimals);
			tokens[toAddress(tokenAddress)] = {
				address: toAddress(tokenAddress),
				name: tokenName,
				symbol: tokenSymbol,
				decimals: tokenDecimals,
				chainID: Number(process.env.DEFAULT_CHAIN_ID),
				balance: zeroNormalizedBN,
				price: zeroNormalizedBN,
				depositor: detectedIncentives[i].depositor,
				value: 0,
				amount
			};
		}

		/**********************************************************************
		 * Once this is done, we should have an object where the keys are the
		 * token addresses and the values are the TToken objects.
		 * We can now create two set of objects:
		 * - One where the key is the candidate address and the value is the
		 *   list of incentives for this candidate
		 * - One where the key is the depositors address and the value is the
		 *   list of incentives for this depositor
		 *********************************************************************/
		const byCandidate: TDict<TDict<TTokenIncentive[]>> = {};
		for (const incentive of detectedIncentives) {
			const {candidate, token} = incentive;
			if (!byCandidate[candidate]) byCandidate[candidate] = {};
			if (!byCandidate[candidate][token]) byCandidate[candidate][token] = [];
			byCandidate[candidate][token].push(tokens[token]);
		}

		set_areIncentivesLoaded(true);
		set_inclusionIncentives(byCandidate);
	}, [candidates.length, epoch]);

	const contextValue = useMemo(
		(): TUseInclusionProps => ({
			candidates,
			inclusionIncentives,
			refreshCandidates: refreshInclusionList,
			refreshIncentives: refreshInclusionIncentives,
			isLoaded: candidates.length > 0,
			areIncentivesLoaded
		}),
		[candidates, inclusionIncentives, refreshInclusionList, refreshInclusionIncentives, areIncentivesLoaded]
	);

	return <InclusionContext.Provider value={contextValue}>{children}</InclusionContext.Provider>;
};

const useInclusion = (): TUseInclusionProps => useContext(InclusionContext);
export default useInclusion;
