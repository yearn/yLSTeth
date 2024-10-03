import {toBigInt} from '@builtbymom/web3/utils';

export type TUseBootstrapPeriodsResp = {
	incentiveBegin: bigint;
	incentiveEnd: bigint;
	depositBegin: bigint;
	depositEnd: bigint;
	voteBegin: bigint;
	voteEnd: bigint;
	incentiveStatus: 'started' | 'ended' | 'none';
	depositStatus: 'started' | 'ended' | 'none';
	voteStatus: 'started' | 'ended' | 'none';
};
export type TPeriods = {
	INCENTIVE_BEGIN: string;
	INCENTIVE_END: string;
	DEPOSIT_BEGIN: string;
	DEPOSIT_END: string;
	VOTE_BEGIN: string;
	VOTE_END: string;
};

function useBootstrapPeriods(): TUseBootstrapPeriodsResp {
	const nowBigInt = toBigInt(Math.round(new Date().getTime() / 1000));
	const incentiveBegin = toBigInt((process.env.PERIODS as unknown as TPeriods).INCENTIVE_BEGIN);
	const incentiveEnd = toBigInt((process.env.PERIODS as unknown as TPeriods).INCENTIVE_END);
	const depositBegin = toBigInt((process.env.PERIODS as unknown as TPeriods).DEPOSIT_BEGIN);
	const depositEnd = toBigInt((process.env.PERIODS as unknown as TPeriods).DEPOSIT_END);
	const voteBegin = toBigInt((process.env.PERIODS as unknown as TPeriods).VOTE_BEGIN);
	const voteEnd = toBigInt((process.env.PERIODS as unknown as TPeriods).VOTE_END);

	return {
		incentiveBegin,
		incentiveEnd,
		incentiveStatus:
			incentiveBegin > BigInt(0) && incentiveEnd > BigInt(0)
				? incentiveBegin > nowBigInt
					? 'none'
					: incentiveBegin < nowBigInt && nowBigInt < incentiveEnd
						? 'started'
						: 'ended'
				: 'none',
		depositBegin,
		depositEnd,
		depositStatus:
			depositBegin > BigInt(0) && depositEnd > BigInt(0)
				? depositBegin > nowBigInt
					? 'none'
					: depositBegin < nowBigInt && nowBigInt < depositEnd
						? 'started'
						: 'ended'
				: 'none',
		voteBegin,
		voteEnd,
		voteStatus:
			voteBegin > BigInt(0) && voteEnd > BigInt(0)
				? voteBegin > nowBigInt
					? 'none'
					: voteBegin < nowBigInt && nowBigInt < voteEnd
						? 'started'
						: 'ended'
				: 'none'
	};
}

export default useBootstrapPeriods;
