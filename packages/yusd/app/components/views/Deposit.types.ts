import type {Hex} from 'viem';
import type {TAddress, TToken} from '@builtbymom/web3/types';

export type TDepositHistory = {
	block: bigint;
	txHash: Hex;
	asset: TToken;
	amount: bigint;
	stTokenAmount: bigint;
	votedAsset: TToken;
};

export type TLogTopic = {
	block: bigint;
	txHash: Hex;
	decodedEvent: {
		args: {
			asset: TAddress;
			amount: bigint;
			value: bigint;
			voter?: TAddress;
			depositor?: TAddress;
		};
	};
};
