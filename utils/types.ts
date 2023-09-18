import type {TTokenInfo} from 'contexts/useTokenList';
import type {Hex} from 'viem';

/** 🔵 - Yearn *************************************************************************************
** The TIndexedTokenInfo type extends the TTokenInfo type by adding an index property. This index
** is used to uniquely identify tokens in certain contexts.
**************************************************************************************************/
export type TIndexedTokenInfo = TTokenInfo & {index: number};

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
export type TEpoch = {
	index: number;
	inclusion: {
		id: Hex;
		candidates: TIndexedTokenInfo[];
	},
	weight: {
		id: Hex;
		participants: TIndexedTokenInfo[];
	}
}


/** 🔵 - Yearn *************************************************************************************
** The TSortDirection type is used to specify the sorting direction in various parts of the
** application. It can be an empty string (for no sorting), 'desc' for descending order, or 'asc'
** for ascending order.
**************************************************************************************************/
export type TSortDirection = '' | 'desc' | 'asc'
