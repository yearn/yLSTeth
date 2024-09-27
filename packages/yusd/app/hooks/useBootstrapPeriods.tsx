import {toBigInt} from '@builtbymom/web3/utils';

export type TUseBootstrapPeriodsResp = {
	incentiveBegin: bigint;
	incentiveEnd: bigint;
	depositBegin: bigint;
	depositEnd: bigint;
	claimBegin: bigint;
	claimEnd: bigint;
	claimStatus: 'started' | 'ended' | 'none';
	incentiveStatus: 'started' | 'ended' | 'none';
	depositStatus: 'started' | 'ended' | 'none';
};
export type TPeriods = {
	INCENTIVE_BEGIN: string;
	INCENTIVE_END: string;
	DEPOSIT_BEGIN: string;
	DEPOSIT_END: string;
	CLAIM_BEGIN: string;
	CLAIM_END: string;
};

function useBootstrapPeriods(): TUseBootstrapPeriodsResp {
	const nowBigInt = toBigInt(Math.round(new Date().getTime() / 1000));
	const incentiveBegin = toBigInt((process.env.PERIODS as unknown as TPeriods).INCENTIVE_BEGIN);
	const incentiveEnd = toBigInt((process.env.PERIODS as unknown as TPeriods).INCENTIVE_END);
	const depositBegin = toBigInt((process.env.PERIODS as unknown as TPeriods).DEPOSIT_BEGIN);
	const depositEnd = toBigInt((process.env.PERIODS as unknown as TPeriods).DEPOSIT_END);
	const claimBegin = toBigInt((process.env.PERIODS as unknown as TPeriods).CLAIM_BEGIN);
	const claimEnd = toBigInt((process.env.PERIODS as unknown as TPeriods).CLAIM_END);

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
		claimBegin,
		claimEnd,
		claimStatus:
			claimBegin > BigInt(0) && claimEnd > BigInt(0)
				? claimBegin > nowBigInt
					? 'none'
					: claimBegin < nowBigInt && nowBigInt < claimEnd
						? 'started'
						: 'ended'
				: 'none'
	};
}

export default useBootstrapPeriods;
