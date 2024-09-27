import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {encodeFunctionData} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {cl, decodeAsBigInt, formatAmount, toAddress, toNormalizedBN, truncateHex} from '@builtbymom/web3/utils';
import {defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import BOOTSTRAP_ABI_NEW from '@libAbi/bootstrap.abi.new';
import {readContracts} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {Modal} from '@yearn-finance/web-lib/components/Modal';
import {multicall} from '@yUSD/actions';
import useBootstrap from '@yUSD/contexts/useBootstrap';
import {usePrices} from '@yUSD/contexts/usePrices';

import {Timer} from './Timer';

import type {ReactElement} from 'react';
import type {Hex} from 'viem';
import type {TAddress, TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TIndexedTokenInfo} from '@libUtils/types';

type TClaimDetails = {
	id: string;
	protocolName: string;
	value: number;
	amount: TNormalizedBN;
	token: TIndexedTokenInfo;
	isSelected: boolean;
	multicall: {target: TAddress; callData: Hex};
};
function ClaimConfirmationModal({
	claimableIncentive,
	onUpdateIncentive,
	onSuccess,
	onCancel
}: {
	claimableIncentive: TClaimDetails[];
	onUpdateIncentive: (id: string, isSelected: boolean) => void;
	onSuccess: VoidFunction;
	onCancel: VoidFunction;
}): ReactElement {
	const {provider} = useWeb3();
	const [claimStatus, set_claimStatus] = useState<TTxStatus>(defaultTxStatus);
	const hasSelected = useMemo(
		(): boolean => claimableIncentive.some((incentive): boolean => incentive.isSelected),
		[claimableIncentive]
	);

	/************************************************************************************************
	 ** Group, for each protocol, the list of incentives you can claim.
	 **
	 ** @deps: claimableIncentive - the list of all claimable incentives.
	 ** @returns: {protocolName: [incentives]} - a dictionary of protocolName to incentives.
	 **********************************************************************************************/
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

	/************************************************************************************************
	 ** Calculate the total amount of incentives you asked to claim, excluding the one you didn't
	 ** select.
	 **
	 ** @deps: claimableIncentive - the list of all claimable incentives.
	 ** @returns: number - the total amount of incentives you asked to claim.
	 **********************************************************************************************/
	const totalToClaim = useMemo(
		(): number =>
			claimableIncentive
				.filter((incentive): boolean => incentive.isSelected)
				.reduce((total, incentive): number => total + incentive.value, 0),
		[claimableIncentive]
	);

	/************************************************************************************************
	 ** Web3 actions to claim the incentives you selected. This is triggered via a multicall3.
	 **********************************************************************************************/
	async function onClaim(): Promise<void> {
		const result = await multicall({
			connector: provider,
			chainID: Number(process.env.BASE_CHAIN_ID),
			contractAddress: toAddress(process.env.DEPOSIT_ADDRESS),
			multicallData: claimableIncentive
				.filter((incentive): boolean => incentive.isSelected)
				.map((incentive): {target: TAddress; callData: Hex} => incentive.multicall),
			statusHandler: set_claimStatus
		});
		if (result.isSuccessful) {
			onSuccess();
		}
	}

	return (
		<div className={'bg-neutral-0 w-full max-w-[400px] rounded-sm py-6'}>
			<b className={'px-6 text-xl'}>{'Confirm claim'}</b>
			<div className={'mt-8 grid grid-cols-1 gap-4'}>
				<div className={'grid grid-cols-3 gap-4 px-6'}>
					<small className={'text-xs text-neutral-500'}>{'Token'}</small>
					<small className={'text-right text-xs text-neutral-500'}>{'Amount'}</small>
					<small className={'text-right text-xs text-neutral-500'}>{'Value, USD'}</small>
				</div>
				<div
					className={
						'scrollbar-show max-h-[400px] overflow-y-scroll border-y border-neutral-200 bg-neutral-100/60'
					}>
					<div className={'grid grid-cols-1 gap-4 px-6 py-4'}>
						{Object.values(claimableIncentiveByProtocol).map((protocol): ReactElement => {
							return (
								<div key={protocol[0].protocolName}>
									<p className={'mb-1 border-b border-neutral-300 pb-1 font-bold text-neutral-900'}>
										{protocol[0].protocolName}
									</p>
									{protocol.map(
										(incentive): ReactElement => (
											<div
												key={incentive.id}
												className={'grid grid-cols-3 gap-4'}>
												<label className={'flex cursor-pointer items-center'}>
													<input
														onChange={(e): void =>
															onUpdateIncentive(incentive.id, e.target.checked)
														}
														checked={incentive.isSelected}
														type={'checkbox'}
														className={
															'mr-2 size-3 rounded-sm border-0 border-neutral-400 bg-neutral-200 text-purple-300 indeterminate:ring-2 focus:bg-neutral-200 focus:ring-2 focus:ring-purple-300 focus:ring-offset-neutral-100'
														}
													/>
													<p>
														{incentive.token.symbol ||
															truncateHex(incentive.token.address, 6)}
													</p>
												</label>
												<b className={'text-right tabular-nums'}>
													{formatAmount(incentive.amount.normalized, 6, 6)}
												</b>
												<b className={'text-right tabular-nums'}>
													{`$${formatAmount(incentive.value, 2, 2)}`}
												</b>
											</div>
										)
									)}
								</div>
							);
						})}
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
					className={
						'mt-2 h-10 w-full text-center text-neutral-500 transition-colors hover:text-neutral-900'
					}>
					{'Cancel'}
				</button>
			</div>
		</div>
	);
}

function ClaimHeading(): ReactElement {
	const {
		periods: {claimBegin, claimStatus}
	} = useBootstrap();

	return (
		<div className={'mb-10 flex w-3/4 flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>
				{'Claim'}
				<span
					suppressHydrationWarning
					className={'text-xs font-normal italic text-neutral-400'}>
					{'Soon ™️'}
				</span>
			</h1>
			<b
				suppressHydrationWarning
				className={'font-number mt-4 text-4xl leading-10 text-purple-300'}>
				<Timer
					endTime={Number(claimBegin)}
					status={claimStatus}
				/>
			</b>
			<p className={'pt-8 text-neutral-700'}>
				{
					'If you voted for any LSTs you’d like to see included in yETH, you’re eligble to recieve incentives from the top 5 protocols (even if you didn’t vote for them).'
				}
			</p>
			<p className={'text-neutral-700'}>{' But hold your horses anon, you can claim soon.'}</p>
		</div>
	);
}

function Claim(): ReactElement {
	const {getPrice} = usePrices();
	const {address, provider} = useWeb3();
	const {
		voting: {voteData, onUpdate: refreshVoteData},
		incentives: {groupIncentiveHistory, claimedIncentives, refreshClaimedIncentives}
	} = useBootstrap();
	const [availableToClaim, set_availableToClaim] = useState<TDict<TNormalizedBN>>({});
	const [claimableIncentive, set_claimableIncentive] = useState<TClaimDetails[]>([]);
	const [claimableRefund, set_claimableRefund] = useState<TClaimDetails[]>([]);
	const [totalRefundValue, set_totalRefundValue] = useState<number>(0);
	const [isModalOpen, set_isModalOpen] = useState<boolean>(false);
	const [className] = useState('pointer-events-none opacity-40');
	const [refundStatus, set_refundStatus] = useState<TTxStatus>(defaultTxStatus);

	/************************************************************************************************
	 ** Get Claimable Incentives
	 ** This useAsyncTrigger hook fetches and calculates the claimable incentives for the user.
	 **
	 ** Process:
	 ** 1. Check if claimed incentives data is available
	 ** 2. Prepare multicall data for each winner protocol and their incentives
	 ** 3. Execute multicall to get claimable amounts for each incentive
	 ** 4. Process results and store in 'claimable' object
	 ** 5. Update state with available claimable incentives
	 **
	 ** Dependencies:
	 ** - address: User's wallet address
	 ** - claimedIncentives: Previously claimed incentives
	 ** - groupIncentiveHistory: History of incentives grouped by protocol
	 ** - voteData.winners: List of winning protocols
	 ************************************************************************************************/
	const refreshClaimableIncentives = useAsyncTrigger(async (): Promise<void> => {
		if (!claimedIncentives) {
			return;
		}
		const claimable: TDict<TNormalizedBN> = {};

		const multicallReadDataIDs = [];
		const multicallReadData = [];
		for (const protocol of voteData.winners) {
			const incentivesForThisProtocol = groupIncentiveHistory.protocols[protocol];
			if (!incentivesForThisProtocol) {
				continue;
			}
			for (const incentive of incentivesForThisProtocol.incentives) {
				multicallReadDataIDs.push(`${protocol}-${incentive.incentive}`);
				multicallReadData.push({
					address: toAddress(process.env.DEPOSIT_ADDRESS),
					abi: BOOTSTRAP_ABI_NEW,
					functionName: 'claimable_incentive',
					args: [toAddress(protocol), toAddress(incentive.incentive), toAddress(address)]
				});
			}
		}
		const results = await readContracts(retrieveConfig(), {
			contracts: multicallReadData as any
		});

		let i = 0;
		for (const protocol of voteData.winners) {
			const incentivesForThisProtocol = groupIncentiveHistory.protocols[protocol];
			if (!incentivesForThisProtocol) {
				continue;
			}
			for (const incentive of incentivesForThisProtocol.incentives) {
				const id = `${protocol}-${incentive.incentive}`;
				claimable[id] = toNormalizedBN(decodeAsBigInt(results[i]), incentive.incentiveToken?.decimals || 18);
				i++;
			}
		}
		set_availableToClaim(claimable);
	}, [address, claimedIncentives, groupIncentiveHistory.protocols, voteData.winners]);

	/************************************************************************************************
	 ** Once the data are loaded, we need to compute the total incentives you can claim. The
	 ** incentives are rewards you got for voting to the yEth composition. The rewards are the ones
	 ** in the top 5 protocols (winners), even if you didn't vote for them.
	 ** It will not run of you didn't vote for any whitelistedLSTs.
	 **
	 ** @deps: winners - The top 5 protocols that won the vote.
	 ** @deps: protocols - The list of all protocols, including the winners, with the incentives.
	 ** @deps: votesUsedPerProtocol - The number of votes you did for each protocol.
	 ** @deps: totalVotes - The total number of votes casted for all the lst.
	 ** @deps: votesUsed - The total number of votes you casted for the winners.
	 ** @deps: claimedIncentives - The list of all the incentives you already claimed.
	 ** @deps: address - The connected wallet address.
	 **********************************************************************************************/
	useEffect((): void => {
		if (!claimedIncentives || !availableToClaim) {
			return;
		}
		let _totalRefundValue = 0;
		const claimData: TClaimDetails[] = [];
		const refundData: TClaimDetails[] = [];

		/************************************************************************************************
		 ** This section processes claimable incentives for winning protocols:
		 ** 1. Iterates through each winning protocol and its incentivized tokens.
		 ** 2. Skips protocols without incentives or already processed/claimed incentives.
		 ** 3. Calculates the value of each claimable incentive using current token prices.
		 ** 4. Prepares claim data for each eligible incentive, including:
		 **    - Unique identifier, protocol name, and token details
		 **    - Claimable amount and its USD value
		 **    - Multicall data for the claim transaction
		 ** 5. Adds each eligible incentive to the claimData array for further processing.
		 **
		 ** This process ensures that users can claim their earned incentives from winning protocols,
		 ** with accurate value calculations and transaction data prepared for execution.
		 ************************************************************************************************/
		for (const protocol of voteData.winners) {
			const incentivesForThisProtocol = groupIncentiveHistory.user[protocol];
			if (!incentivesForThisProtocol) {
				continue;
			}
			for (const incentive of incentivesForThisProtocol.incentives) {
				const id = `${protocol}-${incentive.incentive}`;

				if (claimData.find((item): boolean => item.id === id)) {
					continue;
				}
				if (claimedIncentives.find((item): boolean => item.id === id)) {
					continue;
				}

				const price = getPrice({address: toAddress(incentive.incentiveToken?.address)});
				claimData.push({
					id: id,
					protocolName: incentive.protocolName,
					value: availableToClaim[id]?.normalized * price.normalized,
					amount: availableToClaim[id],
					token: incentive.incentiveToken as TIndexedTokenInfo,
					isSelected: true,
					multicall: {
						target: toAddress(process.env.DEPOSIT_ADDRESS),
						callData: encodeFunctionData({
							abi: BOOTSTRAP_ABI_NEW,
							functionName: 'claim_incentive',
							args: [toAddress(protocol), toAddress(incentive.incentive), toAddress(address)]
						})
					}
				});
			}
		}

		const nonWinnerProtocols = Object.keys(groupIncentiveHistory.user).filter(
			(protocol): boolean => !voteData.winners.includes(toAddress(protocol))
		);

		/************************************************************************************************
		 ** Process refunds for non-winning protocols:
		 ** 1. Iterate through protocols that didn't win the bootstrap voting.
		 ** 2. For each protocol, process its incentives:
		 **    a. Skip if no incentives exist for the protocol.
		 **    b. For each incentive:
		 **       - Generate a unique ID for the refund.
		 **       - Skip if this refund has already been processed or claimed.
		 **       - Prepare refund data including protocol name, value, amount, and token details.
		 **       - Create multicall data for the refund transaction.
		 **       - Add the refund to the refundData array.
		 **       - Update the total refund value.
		 ** 3. This process ensures that depositors of non-winning protocols can reclaim their incentives,
		 **    with all necessary data prepared for execution in a batch transaction.
		 ************************************************************************************************/
		for (const protocol of nonWinnerProtocols) {
			const incentivesForThisProtocol = groupIncentiveHistory.user[protocol];
			if (!incentivesForThisProtocol) {
				continue;
			}
			for (const incentive of incentivesForThisProtocol.incentives) {
				const valueOfThis = incentive.value;
				const id = `${protocol}-${incentive.incentive}-${toAddress(address)}`;
				if (refundData.find((item): boolean => item.id === id)) {
					continue;
				}
				if (claimedIncentives.find((item): boolean => item.id === id)) {
					continue;
				}

				refundData.push({
					id: id,
					protocolName: incentive.protocolName,
					value: valueOfThis,
					amount: toNormalizedBN(incentive.amount, incentive.incentiveToken?.decimals || 18),
					token: incentive.incentiveToken as TIndexedTokenInfo,
					isSelected: true,
					multicall: {
						target: toAddress(process.env.DEPOSIT_ADDRESS),
						callData: encodeFunctionData({
							abi: BOOTSTRAP_ABI_NEW,
							functionName: 'refund_incentive',
							args: [toAddress(protocol), toAddress(incentive.incentive), toAddress(incentive.depositor)]
						})
					}
				});
				_totalRefundValue += valueOfThis;
			}
		}

		/* 🔵 - Yearn Finance **********************************************************************
		 ** Perform a batched update to avoid multiple re-renders, updating both the list of
		 ** claimable incentives and the total value of the incentives you can claim.
		 ******************************************************************************************/
		set_claimableIncentive(claimData);
		set_claimableRefund(refundData);
		set_totalRefundValue(_totalRefundValue);
	}, [
		voteData.winners,
		groupIncentiveHistory.protocols,
		voteData.votesUsedPerProtocol,
		claimedIncentives,
		address,
		groupIncentiveHistory.user,
		availableToClaim,
		getPrice
	]);

	/************************************************************************************************
	 ** Compute the total amount of incentives you can claim.
	 **
	 ** @deps: claimableIncentive - The list of all the incentives you .
	 ** @returns: number - The total amount of incentives you can claim.
	 **********************************************************************************************/
	const totalToClaim = useMemo(
		(): number => claimableIncentive.reduce((total, incentive): number => total + incentive.value, 0),
		[claimableIncentive]
	);

	/************************************************************************************************
	 ** Function triggered when the user clicks a checkbox in the confirmation modal. This will mark
	 ** the incentive as selected or not.
	 **
	 ** @params: id - The id of the incentive.
	 ** @params: isSelected - Whether the incentive should be selected or not.
	 ** @deps: claimableIncentive - The list of all the incentives you can claim.
	 **********************************************************************************************/
	const onUpdateIncentive = useCallback(
		(id: string, isSelected: boolean): void => {
			const newClaimableIncentive = [...claimableIncentive];
			const index = newClaimableIncentive.findIndex((item): boolean => item.id === id);
			if (index === -1) {
				return;
			}
			newClaimableIncentive[index].isSelected = isSelected;
			set_claimableIncentive(newClaimableIncentive);
		},
		[claimableIncentive]
	);

	/************************************************************************************************
	 ** Function triggered when the user has successfully claimed an incentive. This will close the
	 ** modal and refresh the list of claimed incentives and the vote data.
	 **
	 ** @deps: refreshClaimedIncentives - The function to refresh the list of claimed incentives.
	 ** @deps: refreshVoteData - The function to refresh the vote data.
	 **********************************************************************************************/
	const onClaimedSuccess = useCallback(async (): Promise<void> => {
		set_isModalOpen(false);
		await Promise.all([refreshClaimedIncentives(), refreshVoteData(), refreshClaimableIncentives()]);
	}, [refreshClaimedIncentives, refreshVoteData, refreshClaimableIncentives]);

	/************************************************************************************************
	 ** Web3 actions to claim the incentives you selected. This is triggered via a multicall3.
	 **********************************************************************************************/
	async function onRefund(): Promise<void> {
		const result = await multicall({
			connector: provider,
			chainID: Number(process.env.BASE_CHAIN_ID),
			contractAddress: toAddress(process.env.DEPOSIT_ADDRESS),
			multicallData: claimableRefund.map((incentive): {target: TAddress; callData: Hex} => incentive.multicall),
			statusHandler: set_refundStatus
		});
		if (result.isSuccessful) {
			onClaimedSuccess();
		}
	}

	return (
		<section className={'grid w-full grid-cols-1 pt-10 md:mb-20 md:px-4 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<ClaimHeading />
				<div className={'flex flex-col gap-10 md:flex-row md:gap-6'}>
					<div className={cl('flex flex-col md:w-1/2 lg:w-[352px]')}>
						<div className={'mb-4 w-full bg-neutral-100 p-4'}>
							<p className={'pb-2'}>{'Your claimable incentives, $'}</p>
							<b
								suppressHydrationWarning
								className={'font-number text-3xl'}>
								{`$${formatAmount(totalToClaim, 2, 2)}`}
							</b>
						</div>
						<Button
							onClick={(): void => set_isModalOpen(true)}
							isDisabled={claimableIncentive.length === 0 || totalToClaim === 0}
							className={'yearn--button w-full rounded-md !text-sm'}>
							{'Claim'}
						</Button>
					</div>
					<div className={cl('flex flex-col md:w-1/2 lg:w-[352px]', className)}>
						<div className={'mb-4 w-full bg-neutral-100 p-4'}>
							<p className={'pb-2'}>{'Your incentive refunds, $'}</p>
							<b
								suppressHydrationWarning
								className={'font-number text-3xl'}>
								{`$${formatAmount(totalRefundValue, 2, 2)}`}
							</b>
						</div>
						<Button
							variant={'outlined'}
							onClick={onRefund}
							isDisabled={claimableRefund.length === 0 || totalRefundValue === 0}
							isBusy={refundStatus.pending}
							className={'yearn--button w-full rounded-md !text-sm'}>
							{'Refund'}
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
					claimableIncentive={claimableIncentive}
					onSuccess={onClaimedSuccess}
					onCancel={(): void => set_isModalOpen(false)}
				/>
			</Modal>
		</section>
	);
}

export default Claim;
