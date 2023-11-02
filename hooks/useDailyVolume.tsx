/* eslint-disable @typescript-eslint/consistent-type-assertions */
import {useMemo, useState} from 'react';
import {useYDaemonBaseURI} from 'hooks/useYDaemonBaseURI';
import {YETH_POOL_ABI} from 'utils/abi/yETHPool.abi';
import {LST} from 'utils/constants';
import {yDaemonPricesSchema} from 'utils/schemas/yDaemonPricesSchema';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {getClient} from '@yearn-finance/web-lib/utils/wagmi/utils';

import {useAsyncTrigger} from './useAsyncEffect';
import {useFetch} from './useFetch';

import type {TYDaemonPrices} from 'utils/schemas/yDaemonPricesSchema';
import type {TAddress} from '@yearn-finance/web-lib/types';

type TSwapEvent = {
	amountIn: bigint,
	amountOut: bigint,
	tokenIn: TAddress,
	tokenOut: TAddress,
}

function useDailyVolume(): number {
	const [swapEvents, set_swapEvents] = useState<TSwapEvent[]>([]);
	const [isFetchingDailyVolume, set_isFetchingDailyVolume] = useState(false);
	const {yDaemonBaseUri} = useYDaemonBaseURI({chainID: Number(process.env.BASE_CHAIN_ID)});
	const {data: prices} = useFetch<TYDaemonPrices>({
		endpoint: `${yDaemonBaseUri}/prices/some/${LST.map((token): string => token.address).join(',')}}?humanized=true`,
		schema: yDaemonPricesSchema
	});


	/* 🔵 - Yearn Finance **************************************************************************
	** Connect to the node and listen for all the events since the deployment of the contracts.
	** We need to filter the Swaps even to compute the total amount of tokens swapped and estimate
	** the daily volume.
	**
	** @deps: none
	**********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		set_isFetchingDailyVolume(true);
		const publicClient = getClient(Number(process.env.DEFAULT_CHAIN_ID));
		const rangeLimit = toBigInt(process.env.RANGE_LIMIT);
		const currentBlockNumber = await publicClient.getBlockNumber();
		const lastDay = currentBlockNumber - toBigInt(7200);
		const swapEvents: TSwapEvent[] = [];
		for (let i = lastDay; i < currentBlockNumber; i += rangeLimit) {
			const logs = await publicClient.getLogs({
				address: toAddress(process.env.POOL_ADDRESS),
				events: YETH_POOL_ABI.filter((abiItem): boolean => abiItem.type === 'event' && abiItem.name === 'Swap'),
				fromBlock: i,
				toBlock: i + rangeLimit
			});
			for (const log of logs) {
				const {
					amount_in: amountIn,
					amount_out: amountOut,
					asset_in: assetIn,
					asset_out: assetOut
				} = log.args as unknown as {amount_in: bigint, amount_out: bigint, asset_in: bigint, asset_out: bigint};
				swapEvents.push({
					amountIn,
					amountOut,
					tokenIn: toAddress(LST.find((token): boolean => token.index === Number(assetIn))?.address),
					tokenOut: toAddress(LST.find((token): boolean => token.index === Number(assetOut))?.address)
				});

			}
		}
		set_swapEvents(swapEvents);
		set_isFetchingDailyVolume(false);
	}, []);


	/* 🔵 - Yearn Finance **************************************************************************
	** Compute the volume in USD based on the swap and the tokenPrice. In order to do this we need
	** to do the sum of all the swaps and multiply the amountIn by the tokenPrice.
	** This formula is for FE display only and should not be used for any calculation purposes as
	** price is price now.
	**
	** @deps: isFetchingDailyVolume - indicates if the daily volume is being fetched
	** @deps: prices - the prices of the tokens
	** @deps: swapEvents - the swap events
	**********************************************************************************************/
	const volumeUSD = useMemo((): number => {
		if (isFetchingDailyVolume || !prices || swapEvents.length === 0) {
			return 0;
		}
		let _volumeUSD = 0;
		for (const swap of swapEvents) {
			_volumeUSD += Number(prices[swap.tokenIn]) * Number(toNormalizedBN(swap.amountIn).normalized);
		}
		return _volumeUSD;
	}, [isFetchingDailyVolume, prices, swapEvents]);


	return (volumeUSD);
}

export default useDailyVolume;
