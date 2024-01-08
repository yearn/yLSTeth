import React, {Fragment, useCallback, useMemo, useState} from 'react';
import {useAsyncTrigger} from 'hooks/useAsyncEffect';
import {useFetch} from 'hooks/useFetch';
import {useYDaemonBaseURI} from 'hooks/useYDaemonBaseURI';
import {VOTE_ABI} from 'utils/abi/vote.abi';
import {getCurrentEpochNumber, getEpoch} from 'utils/epochs';
import {encodeFunctionData, type Hex, type ReadContractParameters} from 'viem';
import {erc20ABI, readContracts} from 'wagmi';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {Modal} from '@yearn-finance/web-lib/components/Modal';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {decodeAsBoolean, decodeAsNumber, decodeAsString} from '@yearn-finance/web-lib/utils/decoder';
import {type TNormalizedBN, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {type TYDaemonPrices, yDaemonPricesSchema} from '@yearn-finance/web-lib/utils/schemas/yDaemonPricesSchema';

import {ClaimIncentiveModal} from './Claim.IncentivesModal';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {ReactElement} from 'react';
import type {TEpoch} from 'utils/types';
import type {TAddress} from '@yearn-finance/web-lib/types';

type TClaimDetails = {
	id: string;
	value: number;
	amount: TNormalizedBN;
	token: TTokenInfo;
	isSelected: boolean;
	multicall: {target: TAddress; callData: Hex};
};

function ClaimIncentives(): ReactElement {
	const {address} = useWeb3();
	const [claimableIncentiveRaw, set_claimableIncentiveRaw] = useState<TClaimDetails[]>([]);
	const [isModalOpen, set_isModalOpen] = useState<boolean>(false);
	const [epochToDisplay, set_epochToDisplay] = useState<number>(getCurrentEpochNumber() - 1);
	const {yDaemonBaseUri} = useYDaemonBaseURI({chainID: Number(process.env.BASE_CHAIN_ID)});
	const {data: prices} = useFetch<TYDaemonPrices>({
		endpoint: `${yDaemonBaseUri}/prices/all`,
		schema: yDaemonPricesSchema
	});

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Create the array matching all the epochs.
	 **********************************************************************************************/
	const epochs = useMemo((): number[] => {
		const epochArray = [];
		for (let i = 0; i <= getCurrentEpochNumber(); i++) {
			epochArray.push(i);
		}
		return epochArray;
	}, []);
	const previousEpochData = useMemo((): TEpoch => getEpoch(epochToDisplay), [epochToDisplay]);

	const getClaimableDataForOneEpoch = useCallback(async () => {
		if (!address || !previousEpochData) {
			set_claimableIncentiveRaw([]);
			return;
		}
		const {merkle} = previousEpochData;
		if (!merkle) {
			set_claimableIncentiveRaw([]);
			return;
		}
		const claimableIncentives = merkle[address];
		if (!claimableIncentives) {
			set_claimableIncentiveRaw([]);
			return;
		}
		const claimData: TClaimDetails[] = [];

		const calls = claimableIncentives
			.map((item): ReadContractParameters[] => {
				return [
					{
						abi: erc20ABI,
						address: item.incentive,
						functionName: 'decimals',
						args: []
					},
					{
						abi: erc20ABI,
						address: item.incentive,
						functionName: 'name',
						args: []
					},
					{
						abi: erc20ABI,
						address: item.incentive,
						functionName: 'symbol',
						args: []
					},
					{
						abi: VOTE_ABI,
						address: toAddress(process.env.VOTE_ADDRESS),
						functionName: 'claimed',
						args: [item.vote, item.incentive, address]
					}
				];
			})
			.flat() as any[];
		const data = await readContracts({contracts: calls});

		let callIndex = 0;
		for (const item of claimableIncentives) {
			const tokenDecimals = decodeAsNumber(data[callIndex++]) || 18;
			const tokenName = decodeAsString(data[callIndex++]) || '';
			const tokenSymbol = decodeAsString(data[callIndex++]) || '';
			const tokenAmount = toNormalizedBN(item.amount, tokenDecimals);
			const isClaimed = decodeAsBoolean(data[callIndex++]);
			if (isClaimed) {
				continue;
			}

			claimData.push({
				id: String(item.proof),
				value: 0,
				amount: tokenAmount,
				token: {
					address: toAddress(item.incentive),
					name: tokenName,
					symbol: tokenSymbol,
					decimals: tokenDecimals,
					chainId: 1,
					logoURI: ''
				},
				isSelected: true,
				multicall: {
					target: toAddress(process.env.VOTE_ADDRESS),
					callData: encodeFunctionData({
						abi: VOTE_ABI,
						functionName: 'claim',
						args: [item.vote, item.incentive, item.amount, item.proof, address]
					})
				}
			});
		}
		set_claimableIncentiveRaw(claimData);
	}, [address, previousEpochData]);

	const getClaimableDataForAllEpochs = useCallback(async () => {
		const claimData: TClaimDetails[] = [];

		for (let i = 0; i <= getCurrentEpochNumber(); i++) {
			const currentEpoch = getEpoch(i);
			if (!address || !currentEpoch) {
				continue;
			}
			const {merkle} = currentEpoch;
			if (!merkle) {
				continue;
			}
			const claimableIncentives = merkle[address];
			if (!claimableIncentives) {
				continue;
			}

			const calls = claimableIncentives
				.map((item): ReadContractParameters[] => {
					return [
						{
							abi: erc20ABI,
							address: item.incentive,
							functionName: 'decimals',
							args: []
						},
						{
							abi: erc20ABI,
							address: item.incentive,
							functionName: 'name',
							args: []
						},
						{
							abi: erc20ABI,
							address: item.incentive,
							functionName: 'symbol',
							args: []
						},
						{
							abi: VOTE_ABI,
							address: toAddress(process.env.VOTE_ADDRESS),
							functionName: 'claimed',
							args: [item.vote, item.incentive, address]
						}
					];
				})
				.flat() as any[];
			const data = await readContracts({contracts: calls});

			let callIndex = 0;
			for (const item of claimableIncentives) {
				const tokenDecimals = decodeAsNumber(data[callIndex++]) || 18;
				const tokenName = decodeAsString(data[callIndex++]) || '';
				const tokenSymbol = decodeAsString(data[callIndex++]) || '';
				const tokenAmount = toNormalizedBN(item.amount, tokenDecimals);
				const isClaimed = decodeAsBoolean(data[callIndex++]);
				if (isClaimed) {
					continue;
				}
				console.log(`Inventive for period ${i}, ${tokenName}: ${tokenAmount.normalized}`);

				claimData.push({
					id: String(item.proof),
					value: 0,
					amount: tokenAmount,
					token: {
						address: toAddress(item.incentive),
						name: tokenName,
						symbol: tokenSymbol,
						decimals: tokenDecimals,
						chainId: 1,
						logoURI: ''
					},
					isSelected: true,
					multicall: {
						target: toAddress(process.env.VOTE_ADDRESS),
						callData: encodeFunctionData({
							abi: VOTE_ABI,
							functionName: 'claim',
							args: [item.vote, item.incentive, item.amount, item.proof, address]
						})
					}
				});
			}
		}
		set_claimableIncentiveRaw(claimData);
	}, [address]);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Callback function used to refresh the claimable data, aka to find, for a given epoch, all
	 ** the incentives you can claim.
	 **********************************************************************************************/
	const onRefreshClaimableData = useAsyncTrigger(async (): Promise<void> => {
		if (epochToDisplay > -1) {
			getClaimableDataForOneEpoch();
		} else {
			getClaimableDataForAllEpochs();
		}
	}, [epochToDisplay, getClaimableDataForOneEpoch, getClaimableDataForAllEpochs]);

	const assignValue = useCallback(
		(_claimableIncentiveRaw: TClaimDetails[]): TClaimDetails[] => {
			if (!prices || !_claimableIncentiveRaw) {
				return _claimableIncentiveRaw;
			}
			for (const incentive of _claimableIncentiveRaw) {
				const tokenPrice = Number(toNormalizedBN(prices[incentive.token.address] || 0, 6).normalized);
				incentive.value = tokenPrice * Number(incentive.amount.normalized);
			}
			return _claimableIncentiveRaw;
		},
		[prices]
	);

	const claimableIncentives = useMemo(
		(): TClaimDetails[] => assignValue(claimableIncentiveRaw),
		[assignValue, claimableIncentiveRaw]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Compute the total amount of incentives you already claimed.
	 **
	 ** @deps: claimableIncentive - The list of all the incentives you can claim.
	 ** @returns: number - The total amount of incentives you can claim.
	 **********************************************************************************************/
	const totalToClaim = useMemo(
		(): number => claimableIncentives.reduce((total, incentive): number => total + incentive.value, 0),
		[claimableIncentives]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Function triggered when the user clicks a checkbox in the confirmation modal. This will mark
	 ** the incentive as selected or not.
	 **
	 ** @params: id - The id of the incentive.
	 ** @params: isSelected - Whether the incentive should be selected or not.
	 ** @deps: claimableIncentives - The list of all the incentives you can claim.
	 **********************************************************************************************/
	const onUpdateIncentive = useCallback(
		(id: string, isSelected: boolean): void => {
			const newClaimableIncentive = [...claimableIncentiveRaw];
			const index = newClaimableIncentive.findIndex((item): boolean => item.id === id);
			if (index === -1) {
				return;
			}
			newClaimableIncentive[index].isSelected = isSelected;
			set_claimableIncentiveRaw(newClaimableIncentive);
		},
		[claimableIncentiveRaw]
	);

	/* 🔵 - Yearn Finance **************************************************************************
	 ** Function triggered when the user has successfully claimed an incentive. This will close the
	 ** modal and refresh the list of claimed incentives and the vote data.
	 **
	 ** @deps: refreshClaimedIncentives - The function to refresh the list of claimed incentives.
	 ** @deps: refreshVoteData - The function to refresh the vote data.
	 **********************************************************************************************/
	const onClaimedSuccess = useCallback(async (): Promise<void> => {
		onRefreshClaimableData();
		set_isModalOpen(false);
	}, [onRefreshClaimableData]);

	return (
		<Fragment>
			<div className={'flex flex-col gap-10 md:flex-row md:gap-20'}>
				<div className={'flex flex-col md:w-1/2 lg:w-[352px]'}>
					<div>
						<p className={'mb-1 text-neutral-600'}>{'Select epoch'}</p>
						<div
							className={cl(
								'grow-1 col-span-5 flex h-10 w-full items-center justify-start rounded-md p-2 bg-neutral-100 md:w-[264px] mb-9'
							)}>
							<select
								className={
									'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 outline-none scrollbar-none'
								}
								onChange={(e): void => set_epochToDisplay(Number(e.target.value))}
								value={epochToDisplay}
								defaultValue={getCurrentEpochNumber()}>
								{epochs.map(
									(index): ReactElement => (
										<option
											key={index}
											value={index}>
											{index === getCurrentEpochNumber() ? 'Current' : `Epoch ${index + 1}`}
										</option>
									)
								)}
								<option value={-1}>{'All'}</option>
							</select>
						</div>
					</div>
					<div className={'mb-4 w-full bg-neutral-100 p-4'}>
						<p className={'pb-2'}>{'Your claimable incentives, $'}</p>
						<b
							suppressHydrationWarning
							className={'font-number text-3xl'}>
							{`$${formatAmount(totalToClaim, 2, 2)}`}
						</b>
						<p
							className={
								'font-number block text-sm text-neutral-500 transition-colors group-hover:text-neutral-0 md:text-base'
							}>
							&nbsp;
						</p>
					</div>
					<Button
						onClick={(): void => set_isModalOpen(true)}
						isDisabled={claimableIncentives.length === 0}
						className={'yearn--button w-full rounded-md !text-sm'}>
						{'Claim'}
					</Button>
				</div>
			</div>
			<Modal
				className={'small-modal'}
				isOpen={isModalOpen}
				onClose={(): void => set_isModalOpen(false)}>
				<ClaimIncentiveModal
					onUpdateIncentive={onUpdateIncentive}
					claimableIncentive={claimableIncentives}
					onSuccess={onClaimedSuccess}
					onCancel={(): void => set_isModalOpen(false)}
				/>
			</Modal>
		</Fragment>
	);
}

export {ClaimIncentives};
