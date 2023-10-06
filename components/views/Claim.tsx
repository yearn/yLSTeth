import React, {useCallback, useEffect, useMemo, useState} from 'react';
import useBootstrap from 'contexts/useBootstrap';
import {useFetch} from 'hooks/useFetch';
import {useTimer} from 'hooks/useTimer';
import {useYDaemonBaseURI} from 'hooks/useYDaemonBaseURI';
import {VOTE_ABI} from 'utils/abi/vote.abi';
import {multicall} from 'utils/actions';
import {getPreviousEpoch} from 'utils/epochs';
import {encodeFunctionData, type Hex, type ReadContractParameters} from 'viem';
import {erc20ABI, readContracts} from 'wagmi';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {Modal} from '@yearn-finance/web-lib/components/Modal';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {decodeAsBoolean, decodeAsNumber, decodeAsString} from '@yearn-finance/web-lib/utils/decoder';
import {type TNormalizedBN,toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {type TYDaemonPrices,yDaemonPricesSchema} from '@yearn-finance/web-lib/utils/schemas/yDaemonPricesSchema';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {ReactElement} from 'react';
import type {TAddress} from '@yearn-finance/web-lib/types';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

type TClaimDetails = {
	id: string,
	value: number,
	amount: TNormalizedBN,
	token: TTokenInfo,
	isSelected: boolean,
	multicall: {target: TAddress, callData: Hex}
}
function ClaimConfirmationModal({claimableIncentive, onUpdateIncentive, onSuccess, onCancel}: {
	claimableIncentive: TClaimDetails[],
	onUpdateIncentive: (id: string, isSelected: boolean) => void,
	onSuccess: VoidFunction,
	onCancel: VoidFunction
}): ReactElement {
	const {provider} = useWeb3();
	const [claimStatus, set_claimStatus] = useState<TTxStatus>(defaultTxStatus);
	const hasSelected = useMemo((): boolean => claimableIncentive.some((incentive): boolean => incentive.isSelected), [claimableIncentive]);


	/* 🔵 - Yearn Finance **************************************************************************
	** Calculate the total amount of incentives you asked to claim, excluding the one you didn't
	** select.
	**
	** @deps: claimableIncentive - the list of all claimable incentives.
	** @returns: number - the total amount of incentives you asked to claim.
	**********************************************************************************************/
	const totalToClaim = useMemo((): number => (
		claimableIncentive
			.filter((incentive): boolean => incentive.isSelected)
			.reduce((total, incentive): number => total + incentive.value, 0)
	), [claimableIncentive]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Web3 actions to claim the incentives you selected. This is triggered via a multicall3.
	**********************************************************************************************/
	async function onClaim(): Promise<void> {
		const result = await multicall({
			connector: provider,
			contractAddress: toAddress(process.env.BOOTSTRAP_ADDRESS),
			multicallData: (
				claimableIncentive
					.filter((incentive): boolean => incentive.isSelected)
					.map((incentive): {target: TAddress, callData: Hex} => incentive.multicall)
			),
			statusHandler: set_claimStatus
		});
		if (result.isSuccessful) {
			onSuccess();
		}
	}

	return (
		<div className={'w-full max-w-[400px] rounded-sm bg-neutral-0 py-6'}>
			<b className={'px-6 text-xl'}>{'Confirm claim'}</b>
			<div className={'mt-8 grid grid-cols-1 gap-4'}>
				<div className={'grid grid-cols-3 gap-4 px-6'}>
					<small className={'text-xs text-neutral-500'}>{'Token'}</small>
					<small className={'text-right text-xs text-neutral-500'}>{'Amount'}</small>
					<small className={'text-right text-xs text-neutral-500'}>{'Value, USD'}</small>
				</div>
				<div className={'scrollbar-show max-h-[400px] overflow-y-scroll border-y border-neutral-200 bg-neutral-100/60'}>
					<div className={'grid grid-cols-1 gap-4 px-6 py-4'}>
						{
							claimableIncentive.map((incentive): ReactElement => (
								<div
									key={incentive.id}
									className={'grid grid-cols-3 gap-4'}>
									<label className={'flex cursor-pointer items-center'}>
										<input
											onChange={(e): void => onUpdateIncentive(incentive.id, e.target.checked)}
											checked={incentive.isSelected}
											type={'checkbox'}
											className={'focus:ring-purple-300 mr-2 h-3 w-3 rounded-sm border-0 border-neutral-400 bg-neutral-200 text-purple-300 indeterminate:ring-2 focus:bg-neutral-200 focus:ring-2 focus:ring-offset-neutral-100'} />
										<p>{incentive.token.symbol || truncateHex(incentive.token.address, 6)}</p>
									</label>
									<b className={'text-right'}>
										{formatAmount(incentive.amount.normalized, 6, 6)}
									</b>
									<b className={'text-right'}>
										{`$${formatAmount(incentive.value, 2, 2)}`}
									</b>
								</div>
							))
						}
					</div>
				</div>
			</div>

			<div className={'mt-20 px-6'}>
				<Button
					onClick={onClaim}
					isBusy={claimStatus.pending}
					isDisabled={!hasSelected || !provider}
					className={'yearn--button w-full rounded-md !text-sm'}>
					{`Claim ${formatAmount(totalToClaim, 6, 6)}`}
				</Button>
				<button
					onClick={onCancel}
					className={'mt-2 h-10 w-full text-center text-neutral-500 transition-colors hover:text-neutral-900'}>
					{'Cancel'}
				</button>
			</div>
		</div>
	);
}

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {voteEnd} = periods || {};
	const time = useTimer({endTime: Number(voteEnd)});
	return <>{`in ${time}`}</>;
}

function ClaimHeading(): ReactElement {
	const {periods: {voteStatus}} = useBootstrap();
	if (voteStatus === 'ended') {
		return (
			<div className={'mb-10 flex w-[52%] flex-col justify-center'}>
				<h1 className={'text-3xl font-black md:text-8xl'}>
					{'Claim'}
				</h1>
				<p className={'pt-8 text-neutral-700'}>{'You did your democratic duty beautifully anon.'}</p>
				<p className={'text-neutral-700'}>{'And now it’s time to claim your ‘good on chain citizen’ rewards. Enjoy!'}</p>
			</div>
		);
	}

	return (
		<div className={'mb-10 flex w-3/4 flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>
				{'Claim'}
				<span suppressHydrationWarning className={'text-xs font-normal italic text-neutral-400'}>
					{'Soon ™️'}
				</span>
			</h1>
			<b
				suppressHydrationWarning
				className={'font-number mt-4 text-4xl leading-10 text-purple-300'}>
				<Timer />
			</b>
			<p className={'pt-8 text-neutral-700'}>{'If you voted for any LSTs you’d like to see included in yETH, you’re eligble to recieve incentives from the top 5 protocols (even if you didn’t vote for them).'}</p>
			<p className={'text-neutral-700'}>{' But hold your horses anon, you can claim soon.'}</p>
		</div>
	);
}

function Claim(): ReactElement {
	const {address} = useWeb3();
	const [claimableIncentiveRaw, set_claimableIncentiveRaw] = useState<TClaimDetails[]>([]);
	const [isModalOpen, set_isModalOpen] = useState<boolean>(false);
	const previousEpochData = getPreviousEpoch();
	const {yDaemonBaseUri} = useYDaemonBaseURI({chainID: Number(process.env.BASE_CHAIN_ID)});
	const {data: prices} = useFetch<TYDaemonPrices>({
		endpoint: `${yDaemonBaseUri}/prices/all`,
		schema: yDaemonPricesSchema
	});

	const getClaimDetailsCallData = useCallback(async (): Promise<void> => {
		if (!address || !previousEpochData) {
			return;
		}
		const {merkle} = previousEpochData;
		if (!merkle) {
			return;
		}
		const claimableIncentives = merkle[address];
		if (!claimableIncentives) {
			return;
		}
		const claimData: TClaimDetails[] = [];

		const calls = claimableIncentives.map((item): ReadContractParameters[] => {
			return ([
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
					args: [
						item.vote,
						item.incentive,
						address
					]
				}
			]);
		}).flat() as any[];
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
						args: [
							item.vote,
							item.incentive,
							item.amount,
							item.proof
						]
					})
				}
			});
		}
		set_claimableIncentiveRaw(claimData);
	}, [address, previousEpochData]);

	const assignValue = useCallback((_claimableIncentiveRaw: TClaimDetails[]): TClaimDetails[] => {
		if (!prices || !_claimableIncentiveRaw) {
			return _claimableIncentiveRaw;
		}
		for (const incentive of _claimableIncentiveRaw) {
			const tokenPrice = Number(toNormalizedBN(prices[incentive.token.address] || 0, 6).normalized);
			incentive.value = tokenPrice * Number(incentive.amount.normalized);
		}
		return _claimableIncentiveRaw;
	}, [prices]);

	useEffect((): void => {
		getClaimDetailsCallData();
	}, [getClaimDetailsCallData]);

	const claimableIncentives = useMemo((): TClaimDetails[] => assignValue(claimableIncentiveRaw), [assignValue, claimableIncentiveRaw]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Compute the total amount of incentives you already claimed.
	**
	** @deps: claimableIncentive - The list of all the incentives you can claim.
	** @returns: number - The total amount of incentives you can claim.
	**********************************************************************************************/
	const totalToClaim = useMemo((): number => (
		claimableIncentives.reduce((total, incentive): number => total + incentive.value, 0)
	), [claimableIncentives]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Function triggered when the user clicks a checkbox in the confirmation modal. This will mark
	** the incentive as selected or not.
	**
	** @params: id - The id of the incentive.
	** @params: isSelected - Whether the incentive should be selected or not.
	** @deps: claimableIncentives - The list of all the incentives you can claim.
	**********************************************************************************************/
	const onUpdateIncentive = useCallback((id: string, isSelected: boolean): void => {
		const newClaimableIncentive = [...claimableIncentiveRaw];
		const index = newClaimableIncentive.findIndex((item): boolean => item.id === id);
		if (index === -1) {
			return;
		}
		newClaimableIncentive[index].isSelected = isSelected;
		set_claimableIncentiveRaw(newClaimableIncentive);
	}, [claimableIncentiveRaw]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Function triggered when the user has successfully claimed an incentive. This will close the
	** modal and refresh the list of claimed incentives and the vote data.
	**
	** @deps: refreshClaimedIncentives - The function to refresh the list of claimed incentives.
	** @deps: refreshVoteData - The function to refresh the vote data.
	**********************************************************************************************/
	const onClaimedSuccess = useCallback(async (): Promise<void> => {
		set_isModalOpen(false);
	}, []);


	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<ClaimHeading />
				<div className={'flex flex-col gap-10 md:flex-row md:gap-6'}>
					<div className={'flex flex-col md:w-1/2 lg:w-[352px]'}>
						<div className={'mb-4 w-full bg-neutral-100 p-4'}>
							<p className={'pb-2'}>{'Your claimable incentives, $'}</p>
							<b suppressHydrationWarning className={'font-number text-3xl'}>
								{`$${formatAmount(totalToClaim, 2, 2)}`}
							</b>
						</div>
						<Button
							onClick={(): void => set_isModalOpen(true)}
							isDisabled={claimableIncentives.length === 0}
							className={'yearn--button w-full rounded-md !text-sm'}>
							{'Claim'}
						</Button>
					</div>
				</div>
			</div>
			<Modal
				className={'small-modal'}
				isOpen={isModalOpen}
				onClose={(): void => set_isModalOpen(false)}>
				<ClaimConfirmationModal
					onUpdateIncentive={onUpdateIncentive}
					claimableIncentive={claimableIncentives}
					onSuccess={onClaimedSuccess}
					onCancel={(): void => set_isModalOpen(false)} />
			</Modal>
		</section>
	);
}

export default Claim;
