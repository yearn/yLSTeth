import {useMemo} from 'react';
import {useReadContract} from 'wagmi';
import {toAddress, toNormalizedBN} from '@builtbymom/web3/utils';
import {ST_YETH_ABI} from '@libAbi/styETH.abi';

function useAPR(): {APR: number; isLoaded: boolean} {
	const {data} = useReadContract({
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
			return -1;
		}
		const [, streamingAmount, unlockedAmount] = data;
		const _streamingAmount = toNormalizedBN(streamingAmount, 18);
		const _unlockedAmount = toNormalizedBN(unlockedAmount, 18);
		const secondInYear = 31_536_000;
		const secondLeftInWeek = calculateSecondLeftInWeek();
		const _estimatedAPR =
			(Number(_streamingAmount.normalized) * secondInYear) /
			secondLeftInWeek /
			Number(_unlockedAmount.normalized);
		return _estimatedAPR * 100;
	}, [data]);

	return {APR: estimatedAPR === -1 ? 0 : estimatedAPR, isLoaded: estimatedAPR !== -1};
}

export default useAPR;
