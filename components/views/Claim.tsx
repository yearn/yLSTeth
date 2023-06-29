import React, {useCallback, useEffect, useMemo, useState} from 'react';
import useBootstrap from 'contexts/useBootstrap';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {multicall} from 'utils/actions';
import {encodeFunctionData} from 'viem';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {Modal} from '@yearn-finance/web-lib/components/Modal';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {ReactElement} from 'react';
import type {Hex} from 'viem';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

type TClaimDetails = {
	id: string,
	protocolName: string,
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

	const claimableIncentiveByProtocol = useMemo((): TDict<TClaimDetails[]> => {
		const result: TDict<TClaimDetails[]> = {};
		claimableIncentive.forEach((incentive): void => {
			const protocol = incentive.protocolName;
			if (!result[protocol]) {
				result[protocol] = [];
			}
			result[protocol].push(incentive);
		});
		return result;
	}, [claimableIncentive]);

	const totalToClaim = useMemo((): number => (
		claimableIncentive
			.filter((incentive): boolean => incentive.isSelected)
			.reduce((total, incentive): number => total + incentive.value, 0)
	), [claimableIncentive]);

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
		<div className={'w-full max-w-[400px] rounded-sm bg-neutral-0 p-6'}>
			<b className={'text-xl'}>{'Confirm claim'}</b>
			<div className={'mt-8 grid grid-cols-1 gap-4'}>
				<div className={'grid grid-cols-3 gap-4'}>
					<small className={'text-xs text-neutral-500'}>{'Token'}</small>
					<small className={'text-right text-xs text-neutral-500'}>{'Amount'}</small>
					<small className={'text-right text-xs text-neutral-500'}>{'Value, USD'}</small>
				</div>
				{Object.values(claimableIncentiveByProtocol).map((protocol): ReactElement => {
					return (
						<div key={protocol[0].protocolName}>
							<p className={'mb-1 border-b border-neutral-300 pb-1 font-bold text-neutral-900'}>
								{protocol[0].protocolName}
							</p>
							{
								protocol.map((incentive): ReactElement => (
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
					);
				})}
			</div>

			<div className={'mt-20'}>
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

function Claim(): ReactElement {
	const {
		whitelistedLST: {whitelistedLST},
		voting: {voteData, onUpdate: refreshVoteData},
		incentives: {groupIncentiveHistory, claimedIncentives, refreshClaimedIncentives}
	} = useBootstrap();
	const [claimableIncentive, set_claimableIncentive] = useState<TClaimDetails[]>([]);
	const [totalIncentiveValue, set_totalIncentiveValue] = useState<number>(0);
	const [isModalOpen, set_isModalOpen] = useState<boolean>(false);
	const totalVotes = useMemo((): TNormalizedBN => {
		let sum = 0n;
		for (const item of Object.values(whitelistedLST)) {
			sum += item.extra.votes || 0n;
		}
		return toNormalizedBN(sum);
	}, [whitelistedLST]);

	useEffect((): void => {
		if (totalVotes.raw === 0n || !claimedIncentives) {
			return;
		}
		let _totalIncentiveValue = 0;
		const claimData: TClaimDetails[] = [];
		for (const [protocol, voter] of Object.entries(voteData.winners)) {
			if (!voter) {
				continue;
			}
			const incentivesForThisProtocol = groupIncentiveHistory.protocols[protocol];
			if (!incentivesForThisProtocol) {
				continue;
			}
			for (const incentive of incentivesForThisProtocol.incentives) {
				const valueOfThis = (incentive.value * Number(voteData.votesUsed.normalized || 0) / Number(totalVotes.normalized));
				const amountOfThis = toNormalizedBN((incentive.amount * voteData.votesUsed.raw / totalVotes.raw), incentive?.incentiveToken?.decimals || 18);
				const id = `${protocol}-${incentive.incentive}-${voter}`;

				if (claimData.find((item): boolean => item.id === id)) {
					continue;
				}
				if (claimedIncentives.find((item): boolean => item.id === id)) {
					_totalIncentiveValue += valueOfThis;
					continue;
				}
				claimData.push({
					id: id,
					protocolName: incentive.protocolName,
					value: valueOfThis,
					amount: amountOfThis,
					token: incentive.incentiveToken as TTokenInfo,
					isSelected: true,
					multicall: {
						target: toAddress(process.env.BOOTSTRAP_ADDRESS),
						callData: encodeFunctionData({
							abi: BOOTSTRAP_ABI,
							functionName: 'claim_incentive',
							args: [toAddress(protocol), toAddress(incentive.incentive), toAddress(voter)]
						})
					}
				});
				_totalIncentiveValue += valueOfThis;
			}
		}

		performBatchedUpdates((): void => {
			set_claimableIncentive(claimData);
			set_totalIncentiveValue(_totalIncentiveValue);
		});

	}, [voteData.winners, groupIncentiveHistory.protocols, voteData.votesUsedPerProtocol, totalVotes, voteData.votesUsed.normalized, voteData.votesUsed.raw, claimedIncentives]);

	const totalToClaim = useMemo((): number => (
		claimableIncentive.reduce((total, incentive): number => total + incentive.value, 0)
	), [claimableIncentive]);

	const onUpdateIncentive = useCallback((id: string, isSelected: boolean): void => {
		const newClaimableIncentive = [...claimableIncentive];
		const index = newClaimableIncentive.findIndex((item): boolean => item.id === id);
		if (index === -1) {
			return;
		}
		newClaimableIncentive[index].isSelected = isSelected;
		set_claimableIncentive(newClaimableIncentive);
	}, [claimableIncentive]);

	const onClaimedSuccess = useCallback(async (): Promise<void> => {
		set_isModalOpen(false);
		await Promise.all([
			refreshClaimedIncentives(),
			refreshVoteData()
		]);
	}, [refreshClaimedIncentives, refreshVoteData]);

	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<div className={'mb-10 flex w-[52%] flex-col justify-center'}>
					<h1 className={'text-3xl font-black md:text-8xl'}>
						{'Claim'}
					</h1>
					<p className={'pt-8 text-neutral-700'}>{'You did your democratic duty beautifully anon.'}</p>
					<p className={'text-neutral-700'}>{'And now it’s time to claim your ‘good on chain citizen’ rewards. Enjoy!'}</p>
				</div>
				<div className={'flex flex-col md:w-1/2 lg:w-[352px]'}>
					<div className={'mb-4 w-full bg-neutral-100 p-4'}>
						<p className={'pb-2'}>{'Unclaimed incentives, $'}</p>
						<b suppressHydrationWarning className={'font-number text-3xl'}>
							{`$${formatAmount(totalToClaim, 2, 2)}/$${formatAmount(totalIncentiveValue, 2, 2)}`}
						</b>
					</div>
					<Button
						onClick={(): void => set_isModalOpen(true)}
						isDisabled={claimableIncentive.length === 0}
						className={'yearn--button w-full rounded-md !text-sm'}>
						{'Claim all'}
					</Button>
				</div>
			</div>
			<Modal
				className={'small-modal'}
				isOpen={isModalOpen}
				onClose={(): void => set_isModalOpen(false)}>
				<ClaimConfirmationModal
					onUpdateIncentive={onUpdateIncentive}
					claimableIncentive={claimableIncentive}
					onSuccess={onClaimedSuccess}
					onCancel={(): void => set_isModalOpen(false)} />
			</Modal>
		</section>
	);
}

export default Claim;
