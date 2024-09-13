import type {TAddress, TToken} from '@builtbymom/web3/types';

export type TDepositHistory = {
	block: bigint;
	asset: TToken;
	amount: bigint;
	stTokenAmount: bigint;
	votedAsset: TToken;
};

export type TLogTopic = {
	block: bigint;
	decodedEvent: {
		args: {
			asset: TAddress;
			amount: bigint;
			value: bigint;
			voter?: TAddress;
		};
	};
};
