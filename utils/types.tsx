import type {ReactElement} from 'react';
import type {TNDict} from '@yearn-finance/web-lib/types';

// eslint-disable-next-line @typescript-eslint/naming-convention
export type Maybe<T> = T | null | undefined;

export type TPossibleStatus = 'pending' | 'expired' | 'fulfilled' | 'cancelled' | 'invalid'
export type TPossibleFlowStep = 'valid' | 'invalid' | 'pending' | 'undetermined';

export type TToken = {
	label: string;
	symbol: string;
	decimals: number;
	value: string;
	icon?: ReactElement;
}

export type TAddresses = {
	eth?: string;
	opt?: string;
	bsc?: string;
	gno?: string;
	matic?: string;
	ftm?: string;
	arb?: string;
}
export type TNetworkData = {name: string, label: string};
export const PossibleNetworks: TNDict<TNetworkData> = {
	1: {name: 'Ethereum', label: 'eth'},
	10: {name: 'Optimism', label: 'opt'},
	56: {name: 'Binance Smart Chain', label: 'bsc'},
	100: {name: 'Gnosis', label: 'gno'},
	137: {name: 'Polygon', label: 'matic'},
	250: {name: 'Fantom', label: 'ftm'},
	42161: {name: 'Arbitrum', label: 'arb'}
};

export type TReceiverProps = {
	UUID: string;
	address: string;
	name: string;
	ensHandle: string;
	lensHandle: string;
	description: string;
	about: string;
	avatar: string;
	cover: string;
	email: string;
	website: string;
	telegram: string;
	twitter: string;
	github: string;
	reddit: string;
	discord: string;
	isCreated: boolean;
	isVerified: boolean;
	isOwner: boolean;
	uniqueGivers?: number;
	identitySource: 'on-chain' | 'off-chain';
	order?: number;
	addresses: TAddresses;
} & {mutate: () => void};

export type TDonationsProps = {
	UUID: string;
	from: string
	to: string
	token: string
	fromENS: string
	tokenName: string
	amountRaw: string
	txHash: string
	message: string
	amount: number
	value: number
	pricePerToken: number
	chainID: number
	decimals: number
	time: number
	isVerified: boolean
}

export type TGoal = {
	UUID: string;
	startDate: number;
	endDate: number;
	value: number;
	received: number;
}
