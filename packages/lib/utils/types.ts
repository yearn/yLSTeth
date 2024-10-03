import {z} from 'zod';
import {addressSchema} from '@builtbymom/web3/types';

import type {Hex} from 'viem';
import type {TAddress, TDict, TNormalizedBN, TToken} from '@builtbymom/web3/types';

/** 🔵 - Yearn *************************************************************************************
 ** The TIndexedTokenInfo type extends the TTokenInfo type by adding an index property. This index
 ** is used to uniquely identify tokens in certain contexts.
 **************************************************************************************************/
export type TIndexedTokenInfo = TToken & {index: number} & {
	extra?: {
		votes: bigint;
		totalVotes: bigint;
		weight: number;
	};
};

/**************************************************************************************************
 ** TEpoch is a type that represents an epoch in the system. An epoch is a period of time in the
 ** system's operation. Each epoch has an index, an inclusion object, and a weight object.
 **
 ** The index is a unique identifier for the epoch.
 **
 ** The inclusion object contains an id and a list of candidates. Each candidate is a TTokenInfo
 ** object with an additional index property.
 **
 ** The weight object contains an id and a list of participants. Each participant is a TTokenInfo
 ** object with an additional index property.
 **************************************************************************************************/
export type TMerkle = {
	vote: Hex;
	incentive: TAddress;
	amount: bigint;
	proof: Hex[];
};
export type TEpoch = {
	index: number;
	incentiveAPR?: number;
	inclusion: {
		id: Hex;
	};
	weight: {
		id: Hex;
	};
	merkle: {
		[key: Hex]: TMerkle[];
	};
};

/** 🔵 - Yearn *************************************************************************************
 ** The TSortDirection type is used to specify the sorting direction in various parts of the
 ** application. It can be an empty string (for no sorting), 'desc' for descending order, or 'asc'
 ** for ascending order.
 **************************************************************************************************/
export type TSortDirection = '' | 'desc' | 'asc';

/** 🔵 - Yearn *************************************************************************************
 ** The TEstOutWithBonusPenalty type is used to represent the estimated output with a bonus or
 ** penalty. It contains two properties: value and bonusOrPenalty.
 **
 ** - The value is a bigint that represents the estimated output value.
 ** - The bonusOrPenalty is a number that represents the bonus or penalty applied to the estimated
 ** output. It can be positive (for a bonus) or negative (for a penalty).
 **************************************************************************************************/
export type TEstOutWithBonusPenalty = {value: bigint; bonusOrPenalty: number; vb: bigint};

/** 🔵 - Yearn *************************************************************************************
 ** Humanized Price Schema
 **************************************************************************************************/
export const yDaemonPriceSchema = z.string().or(z.number());
export const yDaemonPricesSchema = z.record(addressSchema, yDaemonPriceSchema);
export type TYDaemonPrices = z.infer<typeof yDaemonPricesSchema>;

/** 🔵 - Yearn *************************************************************************************
 ** Proposal structure stored on snapshot
 **************************************************************************************************/
export type TProposalRoot = {
	address: string;
	sig: string;
	hash: string;
	data: TProposalData;
};

export type TProposalData = {
	domain: TProposalDomain;
	types: TProposalTypes;
	message: TProposalMessage;
};

export type TProposalDomain = {
	name: string;
	version: string;
};

export type TProposalTypes = {
	Proposal: TProposalProposal[];
};

export type TProposalProposal = {
	name: string;
	type: string;
};

export type TProposalMessage = {
	space: string;
	type: string;
	title: string;
	body: string;
	discussion: string;
	choices: string[];
	start: number;
	end: number;
	snapshot: number;
	plugins: string;
	app: string;
	from: string;
	timestamp: number;
};

export const proposalSchema = z.object({
	address: z.string(),
	sig: z.string(),
	hash: z.string(),
	data: z.object({
		domain: z.object({
			name: z.string(),
			version: z.string()
		}),
		types: z.object({
			Proposal: z.array(
				z.object({
					name: z.string(),
					type: z.string()
				})
			)
		}),
		message: z.object({
			space: z.string(),
			type: z.string(),
			title: z.string(),
			body: z.string(),
			discussion: z.string(),
			choices: z.array(z.string()),
			start: z.number(),
			end: z.number(),
			snapshot: z.number(),
			plugins: z.string(),
			app: z.string(),
			from: z.string(),
			timestamp: z.number()
		})
	})
});

/** 🔵 - Yearn *************************************************************************************
 ** Proposal structure stored onchain
 **************************************************************************************************/
export type TOnChainProposal = {
	title: string;
	description: string;
};

export const onChainProposalSchema = z.object({
	title: z.string(),
	description: z.string()
});

/** 🔵 - Yearn *************************************************************************************
 ** TBasket is a type that represents a basket of tokens. It contains the basic TIndexedTokenInfo
 ** properties, but is extended with additional properties.
 **************************************************************************************************/
export type TBasketItem = TIndexedTokenInfo & {
	rate: TNormalizedBN;
	weight: TNormalizedBN;
	targetWeight: TNormalizedBN;
	poolAllowance: TNormalizedBN;
	zapAllowance: TNormalizedBN;
	poolSupply: TNormalizedBN;
	virtualPoolSupply: TNormalizedBN;
	weightRatio: number;
	index: number;
	voteForEpoch: {
		vote: TNormalizedBN;
		totalVotes: TNormalizedBN;
		ratio: number;
	};
	poolStats?: {
		amountInPool: TNormalizedBN;
		amountInPoolPercent: number;
		currentBeaconEquivalentValue: TNormalizedBN;
		targetWeight: TNormalizedBN;
		currentEquilibrumWeight: TNormalizedBN;
		currentBandPlus: TNormalizedBN;
		currentBandMin: TNormalizedBN;
		distanceFromTarget: number;
		weightRamps: TNormalizedBN;
	};
};
export type TBasket = TBasketItem[];

export type TTokenIncentive = TToken & {amount: TNormalizedBN; depositor: TAddress};
export type TIncentives = TDict<TDict<TTokenIncentive[]>>;
