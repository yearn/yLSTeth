import React, {useCallback, useEffect, useMemo, useState} from 'react';
import assert from 'assert';
import {parseAbiItem} from 'viem';
import {useContractRead} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {
	cl,
	formatAmount,
	handleInputChangeEventValue,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import BOOTSTRAP_ABI from '@libAbi/bootstrap.abi';
import {ImageWithFallback} from '@libComponents/ImageWithFallback';
import {useTimer} from '@libHooks/useTimer';
import IconSpinner from '@libIcons/IconSpinner';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {Renderable} from '@yearn-finance/web-lib/components/Renderable';
import {getClient} from '@yearn-finance/web-lib/utils/wagmi/utils';
import useBootstrap from '@yUSD/contexts/useBootstrap';
import {ETH_TOKEN} from '@yUSD/tokens';
import {formatDate} from '@yUSD/utils';
import {BOOTSTRAP_INIT_BLOCK_NUMBER} from '@yUSD/utils/constants';

import type {ChangeEvent, ReactElement} from 'react';
import type {Connector} from 'wagmi';
import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {depositBegin, depositEnd, depositStatus} = periods || {};
	const time = useTimer({endTime: depositStatus === 'started' ? Number(depositEnd) : Number(depositBegin)});
	return <>{depositStatus === 'ended' ? 'ended' : depositStatus === 'started' ? time : `in ${time}`}</>;
}

type TDepositHistory = {
	timestamp: bigint;
	amount: bigint;
	depositor: TAddress;
};

function DepositItem({item}: {item: TDepositHistory}): ReactElement {
	return (
		<div className={'grid grid-cols-12 py-3'}>
			<div
				className={
					'col-span-12 flex w-full flex-row items-center justify-between md:col-span-2 md:justify-start'
				}>
				<small className={'block text-neutral-500 md:hidden'}>{'Date'}</small>
				<p>{formatDate(Number(item.timestamp) * 1000)}</p>
			</div>
			<div className={'col-span-12 flex justify-between pr-0 md:col-span-2 md:justify-end md:pr-1'}>
				<small className={'block text-neutral-500 md:hidden'}>{'Locked, st-yETH'}</small>
				<p className={'font-number'}>{`${formatAmount(toNormalizedBN(item.amount, 18).normalized, 0, 6)}`}</p>
			</div>
		</div>
	);
}

function DepositHistory({
	isPending,
	depositHistory
}: {
	isPending: boolean;
	depositHistory: TDepositHistory[];
}): ReactElement {
	return (
		<div className={'mt-8 border-t-2 border-neutral-300 pt-6'}>
			<div
				aria-label={'header'}
				className={'mb-2 hidden grid-cols-12 md:grid'}>
				<div className={'col-span-2'}>
					<p className={'text-xs text-neutral-500'}>{'Date'}</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p className={'group flex flex-row text-xs text-neutral-500'}>{'You locked, ETH'}</p>
				</div>
			</div>

			{depositHistory.map(
				(item, index): ReactElement => (
					<DepositItem
						key={index}
						item={item}
					/>
				)
			)}
			{isPending && (
				<div className={'mt-6 flex flex-row items-center justify-center'}>
					<IconSpinner className={'!h-6 !w-6 !text-neutral-400'} />
				</div>
			)}
		</div>
	);
}

function ViewDeposit(): ReactElement {
	const {
		periods: {depositStatus},
		incentives: {totalDepositedETH}
	} = useBootstrap();
	const {address, isActive, provider, chainID} = useWeb3();
	const {balances} = useWallet();
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [depositTxStatus] = useState<TTxStatus>(defaultTxStatus);
	const [depositHistory, set_depositHistory] = useState<TDepositHistory[]>([]);
	const [isFetchingHistory, set_isFetchingHistory] = useState<boolean>(false);
	const [className, set_className] = useState<string>('pointer-events-none opacity-40');
	const tokenToSend = ETH_TOKEN;
	const {data: tokensDeposited} = useContractRead({
		abi: BOOTSTRAP_ABI,
		address: toAddress(process.env.BOOTSTRAP_ADDRESS),
		functionName: 'deposits',
		args: [toAddress(address)],
		chainId: Number(chainID)
	});

	const filterEvents = useCallback(async (): Promise<void> => {
		if (!address) {
			return;
		}
		set_isFetchingHistory(true);
		const publicClient = getClient(Number(process.env.DEFAULT_CHAIN_ID));
		const rangeLimit = toBigInt(Number(process.env.RANGE_LIMIT));
		const deploymentBlockNumber = toBigInt(BOOTSTRAP_INIT_BLOCK_NUMBER);
		const currentBlockNumber = await publicClient.getBlockNumber();
		const history: TDepositHistory[] = [];
		for (let i = deploymentBlockNumber; i < currentBlockNumber; i += rangeLimit) {
			const logs = await publicClient.getLogs({
				address: toAddress(process.env.BOOTSTRAP_ADDRESS),
				event: parseAbiItem(
					'event Deposit(address indexed depositor, address indexed receiver, uint256 amount)'
				),
				args: {
					depositor: toAddress(address)
				},
				fromBlock: i,
				toBlock: i + rangeLimit
			});

			for (const log of logs) {
				if (!log.blockNumber) {
					continue;
				}
				const blockData = await publicClient.getBlock({blockNumber: log.blockNumber});
				history.push({
					timestamp: blockData.timestamp,
					amount: toBigInt(log.args.amount),
					depositor: toAddress(log.args.depositor)
				});
			}
		}
		set_depositHistory(history);
		set_isFetchingHistory(false);
	}, [address]);
	useEffect((): void => {
		filterEvents();
	}, [filterEvents]);

	useEffect((): void => {
		if (depositStatus !== 'started') {
			set_className('pointer-events-none opacity-40');
		} else {
			set_className('');
		}
	}, [depositStatus, className]);

	const balanceOf = useMemo((): TNormalizedBN => {
		return toNormalizedBN(
			balances?.[tokenToSend.chainID]?.[tokenToSend.address]?.balance.raw || 0n,
			tokenToSend.decimals
		);
	}, [balances, tokenToSend.address, tokenToSend.chainID, tokenToSend.decimals]);

	const balanceDeposited = useMemo((): TNormalizedBN => {
		return toNormalizedBN(tokensDeposited || 0, 18);
	}, [tokensDeposited]);

	const safeMaxValue = useMemo((): TNormalizedBN => {
		return toNormalizedBN(
			((balances?.[tokenToSend.chainID]?.[tokenToSend.address]?.balance.raw || 0n) * 9n) / 10n || 0,
			tokenToSend.decimals
		);
	}, [balances, tokenToSend.address, tokenToSend.chainID, tokenToSend.decimals]);

	const onChangeAmount = useCallback(
		(e: ChangeEvent<HTMLInputElement>): void => {
			const element = document.getElementById('amountToSend') as HTMLInputElement;
			const newAmount = handleInputChangeEventValue(e, tokenToSend?.decimals || 18);
			if (newAmount.raw > balances?.[tokenToSend.chainID]?.[tokenToSend.address]?.balance.raw) {
				if (element?.value) {
					element.value = formatAmount(
						balances?.[tokenToSend.chainID]?.[tokenToSend.address]?.balance.normalized,
						0,
						18
					);
				}
				return set_amountToSend(
					toNormalizedBN(
						balances?.[tokenToSend.chainID]?.[tokenToSend.address]?.balance.raw || 0,
						tokenToSend.decimals
					)
				);
			}
			set_amountToSend(newAmount);
		},
		[balances, tokenToSend.address, tokenToSend.chainID, tokenToSend.decimals]
	);

	const updateToPercent = useCallback(
		(percent: number): void => {
			const element = document.getElementById('amountToSend') as HTMLInputElement;
			const newAmount = toNormalizedBN((balanceOf.raw * BigInt(percent)) / 100n, tokenToSend.decimals);
			if (newAmount.raw > balances?.[tokenToSend.chainID]?.[tokenToSend.address]?.balance.raw) {
				if (element?.value) {
					element.value = formatAmount(
						balances?.[tokenToSend.chainID]?.[tokenToSend.address]?.balance.normalized,
						0,
						18
					);
				}
				return set_amountToSend(
					toNormalizedBN(
						balances?.[tokenToSend.chainID]?.[tokenToSend.address]?.balance.raw || 0,
						tokenToSend.decimals
					)
				);
			}
			set_amountToSend(newAmount);
		},
		[balanceOf.raw, balances, tokenToSend.address, tokenToSend.chainID, tokenToSend.decimals]
	);

	const amountPercentage = useMemo((): number => {
		const percent = (Number(amountToSend.normalized) / Number(balanceOf.normalized)) * 100;
		return Math.round(percent * 100) / 100;
	}, [amountToSend.normalized, balanceOf.normalized]);

	const onDeposit = useCallback(
		async (provider: Connector | undefined): Promise<void> => {
			assert(isActive, 'Wallet not connected');
			assert(provider, 'Provider not connected');
			assert(amountToSend.raw > 0n, 'Amount must be greater than 0');

			throw 'NO DEPOSIT ETH FUNCTION';
		},
		[amountToSend.raw, isActive]
	);

	return (
		<section className={'grid w-full grid-cols-1 pt-10 md:mb-20 md:px-4 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<div className={'mb-10 flex w-full flex-col justify-center'}>
					<h1 className={'text-3xl font-black md:text-8xl'}>{'Deposit'}</h1>
					<b
						suppressHydrationWarning
						className={'font-number mt-4 text-4xl leading-10 text-purple-300'}>
						<Timer />
					</b>
					<div className={'grid w-full items-center gap-4 pt-8 md:grid-cols-1 md:gap-6 lg:grid-cols-2'}>
						<div className={'w-full'}>
							<span className={'text-neutral-700'}>
								<p>{'Decide how much ETH you want to lock as st-yETH.'}</p>
								<p>{'Remember this ETH will be locked for 16 weeks, but by holding st-yETH:'}</p>
								<div className={'pt-4'}>
									<b>
										{
											'You’ll receive incentives for voting on which LSTs will be included in yETH. Ka-ching.'
										}
									</b>
								</div>
							</span>
						</div>

						<div className={'flex justify-end space-x-4'}>
							<div className={'w-full bg-neutral-100 p-4 lg:w-72'}>
								<p className={'pb-2'}>{'Current total deposits, ETH'}</p>
								<b
									suppressHydrationWarning
									className={'font-number text-3xl'}>
									<Renderable
										shouldRender={true}
										fallback={'-'}>
										{formatAmount(totalDepositedETH.normalized, 6, 6)}
									</Renderable>
								</b>
							</div>
							<div className={'w-full bg-neutral-100 p-4 lg:w-72'}>
								<p className={'pb-2'}>{'Your deposit, ETH'}</p>
								<b
									suppressHydrationWarning
									className={'font-number text-3xl'}>
									<Renderable
										shouldRender={true}
										fallback={'-'}>
										{formatAmount(Number(balanceDeposited.normalized), 6, 6)}
									</Renderable>
								</b>
							</div>
						</div>
					</div>
				</div>

				<div
					key={depositStatus}
					className={className}>
					<div
						className={
							'mb-8 grid w-full grid-cols-1 gap-2 md:grid-cols-3 md:gap-2 lg:grid-cols-12 lg:gap-4'
						}>
						<div className={'lg:col-span-4'}>
							<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'You’re locking, ETH'}</p>
							<div className={'box-500 grow-1 flex h-10 w-full items-center justify-center p-2'}>
								<div className={'mr-2 size-6 min-w-[24px]'}>
									<ImageWithFallback
										alt={''}
										unoptimized
										src={ETH_TOKEN.logoURI || ''}
										width={24}
										height={24}
									/>
								</div>
								<input
									id={'amountToSend'}
									className={
										'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none'
									}
									type={'number'}
									min={0}
									maxLength={20}
									max={safeMaxValue?.normalized || 0}
									step={1 / 10 ** (tokenToSend?.decimals || 18)}
									inputMode={'numeric'}
									placeholder={'0'}
									pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
									value={amountToSend?.normalized || ''}
									onChange={onChangeAmount}
								/>
								<div className={'ml-2 flex flex-row space-x-1'}>
									<button
										onClick={(): void => updateToPercent(20)}
										className={cl(
											'p-1 text-xs rounded-sm border border-purple-300 transition-colors',
											amountPercentage === 20
												? 'bg-purple-300 text-white'
												: 'text-purple-300 hover:bg-purple-300 hover:text-white'
										)}>
										{'20%'}
									</button>
									<button
										onClick={(): void => updateToPercent(40)}
										className={cl(
											'p-1 text-xs rounded-sm border border-purple-300 transition-colors',
											amountPercentage === 40
												? 'bg-purple-300 text-white'
												: 'text-purple-300 hover:bg-purple-300 hover:text-white'
										)}>
										{'40%'}
									</button>
									<button
										onClick={(): void => updateToPercent(60)}
										className={cl(
											'p-1 text-xs rounded-sm border border-purple-300 transition-colors',
											amountPercentage === 60
												? 'bg-purple-300 text-white'
												: 'text-purple-300 hover:bg-purple-300 hover:text-white'
										)}>
										{'60%'}
									</button>
									<button
										onClick={(): void => updateToPercent(80)}
										className={cl(
											'p-1 text-xs rounded-sm border border-purple-300 transition-colors',
											amountPercentage === 80
												? 'bg-purple-300 text-white'
												: 'text-purple-300 hover:bg-purple-300 hover:text-white'
										)}>
										{'80%'}
									</button>
								</div>
							</div>
							<p
								suppressHydrationWarning
								className={'pl-2 pt-1 text-xs text-neutral-600'}>
								{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${tokenToSend.symbol}`}
							</p>
						</div>
						<div className={'pt-2 md:pt-0 lg:col-span-3'}>
							<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'You’re getting, st-yETH'}</p>
							<div className={'box-500 grow-1 flex h-10 w-full items-center justify-center p-2'}>
								<div className={'mr-2 size-6 min-w-[24px]'}>
									<ImageWithFallback
										alt={''}
										src={'/favicons/favicon.png'}
										width={24}
										height={24}
									/>
								</div>
								<input
									className={
										'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm text-neutral-400 outline-none'
									}
									readOnly
									type={'number'}
									inputMode={'numeric'}
									placeholder={'0'}
									value={amountToSend?.normalized || ''}
								/>
							</div>
							<p
								suppressHydrationWarning
								className={'pl-2 pt-1 text-xs text-neutral-600'}>
								{`You have ${formatAmount(balanceDeposited?.normalized || 0, 2, 6)} st-yETH`}
							</p>
						</div>
						<div className={'w-full pt-4 md:pt-0 lg:col-span-3'}>
							<p className={'hidden pb-1 text-neutral-600 md:block'}>&nbsp;</p>
							<Button
								onClick={(): void => {
									onDeposit(provider);
								}}
								isBusy={depositTxStatus.pending}
								isDisabled={
									amountToSend.raw === 0n ||
									depositStatus !== 'started' ||
									amountToSend.raw > balanceOf.raw ||
									!depositTxStatus.none
								}
								className={'yearn--button w-full rounded-md !text-sm'}>
								{'Submit'}
							</Button>
							<p className={'pl-2 pt-1 text-xs text-neutral-600'}>&nbsp;</p>
						</div>
					</div>
					<DepositHistory
						isPending={isFetchingHistory}
						depositHistory={depositHistory}
					/>
				</div>
			</div>
		</section>
	);
}

export default ViewDeposit;
