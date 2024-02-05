import type {Hex} from 'viem';
import type {TAddress, TToken} from '@builtbymom/web3/types';

/** 🔵 - Yearn *************************************************************************************
 ** The TIndexedTokenInfo type extends the TTokenInfo type by adding an index property. This index
 ** is used to uniquely identify tokens in certain contexts.
 **************************************************************************************************/
export type TIndexedTokenInfo = TToken & {index: number};

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
		candidates: TIndexedTokenInfo[];
	};
	weight: {
		id: Hex;
		participants: TIndexedTokenInfo[];
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
