import {useMemo} from 'react';
import {ST_YETH_ABI} from 'utils/abi/styETH.abi';
import {useContractRead} from 'wagmi';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

function useAPR(): number {
	const {data} = useContractRead({
		address: toAddress(process.env.STYETH_ADDRESS),
		abi: ST_YETH_ABI,
		functionName: 'get_amounts'
	});

	const calculateSecondLeftInWeek = (): number => {
		const secondInWeek = 604800;
		const currentTimestamp = Math.floor(Date.now() / 1000);
		return secondInWeek - (currentTimestamp % secondInWeek);
	};

	const estimatedAPR = useMemo((): number => {
		if (!data) {
			return 0;
		}
		const [, streamingAmount, unlockedAmount] = data;
		const _streamingAmount = toNormalizedBN(streamingAmount);
		const _unlockedAmount = toNormalizedBN(unlockedAmount);
		const secondInYear = 31_536_000;
		const secondLeftInWeek = calculateSecondLeftInWeek();
		const _estimatedAPR =
			(Number(_streamingAmount.normalized) * secondInYear) /
			secondLeftInWeek /
			Number(_unlockedAmount.normalized);
		return _estimatedAPR * 100;
	}, [data]);

	return estimatedAPR;
}

export default useAPR;
