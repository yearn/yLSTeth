import React, {useCallback, useEffect, useMemo, useState} from 'react';
import assert from 'assert';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import IconChevronPlain from 'components/icons/IconChevronPlain';
import useBootstrap from 'contexts/useBootstrap';
import {useWallet} from 'contexts/useWallet';
import {useTimer} from 'hooks/useTimer';
import {formatDate, handleInputChangeEventValue} from 'utils';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {depositETH} from 'utils/actions';
import {ETH_TOKEN, STYETH_TOKEN, YETH_TOKEN} from 'utils/tokens';
import {createPublicClient, http, parseAbiItem} from 'viem';
import {fantom} from 'viem/chains';
import {useContractRead} from 'wagmi';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ChangeEvent, ReactElement} from 'react';
import type {TAddress} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {depositEnd, depositBegin} = periods || {};
	const time = useTimer({endTime: (Number(depositEnd?.result) * 1000 || 0)});
	const hasStarted = useMemo((): boolean => (
		(toBigInt(depositBegin?.result || 0) > 0n) //Not started
		&&
		(Number(depositBegin?.result) * 1000 || 0) < Date.now()
	), [depositBegin]);
	const hasEnded = useMemo((): boolean => ((
		(toBigInt(depositEnd?.result || 0) > 0n) //Not started
		&&
		(Number(depositEnd?.result) * 1000 || 0) < Date.now())
	), [depositEnd]);

	return <>{hasEnded ? 'ended' : hasStarted ? time : 'coming soon'}</>;
}

type TSortDirection = '' | 'desc' | 'asc'
type TDepositHistory = {
	timestamp: bigint;
	in16Weeks: bigint;
	amount: bigint;
	depositor: TAddress;
	receiver: TAddress;
}

function DepositItem({item}: {item: TDepositHistory}): ReactElement {
	return (
		<div className={'grid grid-cols-12 py-3'}>
			<div className={'col-span-2 flex w-full flex-row items-center space-x-6'}>
				<div>
					<p>{formatDate(Number(item.timestamp) * 1000)}</p>
				</div>
			</div>
			<div className={'col-span-2 flex justify-end pr-1'}>
				<p className={'tabular-nums'}>
					{`${formatAmount(toNormalizedBN(item.amount).normalized, 0, 6)}`}
				</p>
			</div>
			<div className={'col-span-2 flex justify-end pr-1'}>
				<p className={'tabular-nums'}>
					{`${formatAmount(toNormalizedBN(item.amount).normalized, 0, 6)}`}
				</p>
			</div>
			<div className={'col-span-2 flex justify-end pr-1'}>
				<p>{formatDate(Number(item.in16Weeks) * 1000)}</p>
			</div>
		</div>
	);
}


function DepositHistory({depositHistory}: {depositHistory: TDepositHistory[]}): ReactElement {
	const [sortBy, set_sortBy] = useState<string>('');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('');

	/* 🔵 - Yearn Finance **************************************************************************
	**	Callback method used to sort the vaults list.
	**	The use of useCallback() is to prevent the method from being re-created on every render.
	**********************************************************************************************/
	const onSort = useCallback((newSortBy: string, newSortDirection: string): void => {
		performBatchedUpdates((): void => {
			set_sortBy(newSortBy);
			set_sortDirection(newSortDirection as TSortDirection);
		});
	}, []);

	const toggleSortDirection = (newSortBy: string): TSortDirection => {
		return sortBy === newSortBy ? (
			sortDirection === '' ? 'desc' : sortDirection === 'desc' ? 'asc' : 'desc'
		) : 'desc';
	};

	const renderChevron = useCallback((shouldSortBy: boolean): ReactElement => {
		if (shouldSortBy && sortDirection === 'desc') {
			return <IconChevronPlain className={'yearn--sort-chevron transition-all'} />;
		}
		if (shouldSortBy && sortDirection === 'asc') {
			return <IconChevronPlain className={'yearn--sort-chevron rotate-180 transition-all'} />;
		}
		return <IconChevronPlain className={'yearn--sort-chevron--off text-neutral-300 transition-all group-hover:text-neutral-500'} />;
	}, [sortDirection]);

	return (
		<div className={'mt-8 border-t-2 border-neutral-300 pt-6'}>
			<div aria-label={'header'} className={'mb-2 grid grid-cols-12'}>
				<div className={'col-span-2'}>
					<p className={'text-xs text-neutral-500'}>
						{'Date'}
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('locked', toggleSortDirection('locked'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'You locked, ETH'}
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'locked')}
						</span>
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('received', toggleSortDirection('received'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'You recieved, yETH'}
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'received')}
						</span>
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('unlock', toggleSortDirection('unlock'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'st-yETH unlocks on'}
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'unlock')}
						</span>
					</p>
				</div>
			</div>

			{depositHistory
				.sort((a, b): number => {
					let aValue = 0;
					let bValue = 0;
					if (sortBy === 'locked' || sortBy === 'received') {
						aValue = Number(toNormalizedBN(a.amount).raw);
						bValue = Number(toNormalizedBN(b.amount).raw);
					} else if (sortBy === 'unlock') {
						aValue = Number(a.in16Weeks);
						bValue = Number(b.in16Weeks);
					}
					return sortDirection === 'desc' ? Number(bValue) - Number(aValue) : Number(aValue) - Number(bValue);
				})
				.map((item, index): ReactElement => <DepositItem key={index} item={item} />)}
		</div>
	);
}

function Deposit(): ReactElement {
	const {address, isActive, provider, chainID} = useWeb3();
	const {balances, refresh} = useWallet();
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [depositStatus, set_depositStatus] = useState<TTxStatus>(defaultTxStatus);
	const [depositHistory, set_depositHistory] = useState<TDepositHistory[]>([]);
	const tokenToSend = ETH_TOKEN;
	const {data: tokensDeposited, refetch} = useContractRead({
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
		const publicClient = createPublicClient({
			chain: fantom,
			transport: http('https://rpc3.fantom.network')
		});
		const rangeLimit = 1_000_000n;
		const deploymentBlockNumber = 62_856_231n;
		const currentBlockNumber = await publicClient.getBlockNumber();
		const history: TDepositHistory[] = [];
		for (let i = deploymentBlockNumber; i < currentBlockNumber; i += rangeLimit) {
			const logs = await publicClient.getLogs({
				address: toAddress(process.env.BOOTSTRAP_ADDRESS),
				event: parseAbiItem('event Deposit(address indexed depositor, address indexed receiver, uint256 amount)'),
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
					in16Weeks: blockData.timestamp + toBigInt(60 * 60 * 24 * 7 * 16),
					amount: toBigInt(log.args.amount),
					depositor: toAddress(log.args.depositor),
					receiver: toAddress(log.args.receiver)
				});
			}
		}
		set_depositHistory(history);
	}, [address]);
	useEffect((): void => {
		filterEvents();
	}, [filterEvents]);


	const balanceOf = useMemo((): TNormalizedBN => {
		return toNormalizedBN((balances?.[tokenToSend.address]?.raw || 0) || 0);
	}, [balances, tokenToSend.address]);

	const balanceDeposited = useMemo((): TNormalizedBN => {
		return toNormalizedBN((tokensDeposited || 0) || 0);
	}, [tokensDeposited]);

	const safeMaxValue = useMemo((): TNormalizedBN => {
		return toNormalizedBN(((balances?.[tokenToSend.address]?.raw || 0n) * 9n / 10n) || 0);
	}, [balances, tokenToSend.address]);

	const onChangeAmount = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
		const element = document.getElementById('amountToSend') as HTMLInputElement;
		const newAmount = handleInputChangeEventValue(e, tokenToSend?.decimals || 18);
		if (newAmount.raw > balances?.[tokenToSend.address]?.raw) {
			if (element?.value) {
				element.value = formatAmount(balances?.[tokenToSend.address]?.normalized, 0, 18);
			}
			return set_amountToSend(toNormalizedBN(balances?.[tokenToSend.address]?.raw || 0));
		}
		set_amountToSend(newAmount);
	}, [balances, tokenToSend.address, tokenToSend?.decimals]);

	const updateToPercent = useCallback((percent: number): void => {
		const element = document.getElementById('amountToSend') as HTMLInputElement;
		const newAmount = toNormalizedBN((balanceOf.raw * BigInt(percent)) / 100n);
		if (newAmount.raw > balances?.[tokenToSend.address]?.raw) {
			if (element?.value) {
				element.value = formatAmount(balances?.[tokenToSend.address]?.normalized, 0, 18);
			}
			return set_amountToSend(toNormalizedBN(balances?.[tokenToSend.address]?.raw || 0));
		}
		set_amountToSend(newAmount);
	}, [balanceOf, balances, tokenToSend.address]);

	const amountPercentage = useMemo((): number => {
		const percent = Number(amountToSend.normalized) / Number(balanceOf.normalized) * 100;
		return Math.round(percent * 100) / 100;
	}, [amountToSend.normalized, balanceOf.normalized]);

	const onDeposit = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(amountToSend.raw > 0n, 'Amount must be greater than 0');

		const result = await depositETH({
			connector: provider,
			contractAddress: toAddress(process.env.BOOTSTRAP_ADDRESS),
			amount: amountToSend.raw,
			statusHandler: set_depositStatus
		});
		if (result.isSuccessful) {
			set_amountToSend(toNormalizedBN(0));
			await Promise.all([
				filterEvents(),
				refetch(),
				refresh([
					{...ETH_TOKEN, token: ETH_TOKEN.address},
					{...STYETH_TOKEN, token: STYETH_TOKEN.address},
					{...YETH_TOKEN, token: YETH_TOKEN.address}
				])
			]);
		}
	}, [amountToSend.raw, isActive, provider, refresh, refetch, filterEvents]);


	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<div className={'mb-10 flex w-1/2 flex-col justify-center'}>
					<h1 className={'text-3xl md:text-8xl'}>
						{'Deposit'}
					</h1>
					<b
						suppressHydrationWarning
						className={'font-number mt-4 text-4xl text-purple-300'}>
						<Timer />
					</b>
					<p className={'pt-8'}>
						{'Decide how much ETH you want to lock as st-yETH. Remember this ETH will be locked for 16 weeks, during which time period you’ll be able to receive bri... incentives for voting on which LSTs will be included in yETH.'}
					</p>
				</div>
				<div className={'mb-8 grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-4 lg:gap-4'}>
					<div>
						<p className={'pb-1 text-neutral-600'}>{'You’re locking, ETH'}</p>
						<div className={'box-500 grow-1 flex h-10 w-full items-center justify-center p-2'}>
							<div className={'mr-2 h-6 w-6 min-w-[24px]'}>
								<ImageWithFallback
									alt={''}
									unoptimized
									src={ETH_TOKEN.logoURI}
									width={24}
									height={24} />
							</div>
							<input
								id={'amountToSend'}
								className={'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none scrollbar-none'}
								type={'number'}
								min={0}
								maxLength={20}
								max={safeMaxValue?.normalized || 0}
								step={1 / 10 ** (tokenToSend?.decimals || 18)}
								inputMode={'numeric'}
								placeholder={'0'}
								pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
								value={amountToSend?.normalized || ''}
								onChange={onChangeAmount} />
							<div className={'ml-2 flex flex-row space-x-1'}>
								<button
									onClick={(): void => updateToPercent(20)}
									className={cl('p-1 text-xs rounded-sm border border-purple-300 transition-colors', amountPercentage === 20 ? 'bg-purple-300 text-white' : 'text-purple-300 hover:bg-purple-300 hover:text-white')}>
									{'20%'}
								</button>
								<button
									onClick={(): void => updateToPercent(40)}
									className={cl('p-1 text-xs rounded-sm border border-purple-300 transition-colors', amountPercentage === 40 ? 'bg-purple-300 text-white' : 'text-purple-300 hover:bg-purple-300 hover:text-white')}>
									{'40%'}
								</button>
								<button
									onClick={(): void => updateToPercent(60)}
									className={cl('p-1 text-xs rounded-sm border border-purple-300 transition-colors', amountPercentage === 60 ? 'bg-purple-300 text-white' : 'text-purple-300 hover:bg-purple-300 hover:text-white')}>
									{'60%'}
								</button>
								<button
									onClick={(): void => updateToPercent(80)}
									className={cl('p-1 text-xs rounded-sm border border-purple-300 transition-colors', amountPercentage === 80 ? 'bg-purple-300 text-white' : 'text-purple-300 hover:bg-purple-300 hover:text-white')}>
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
					<div>
						<p className={'pb-1 text-neutral-600'}>{'You’re getting, st-yETH'}</p>
						<div className={'box-500 grow-1 flex h-10 w-full items-center justify-center p-2'}>
							<div className={'mr-2 h-6 w-6 min-w-[24px]'}>
								<ImageWithFallback
									alt={''}
									src={'/favicons/favicon.png'}
									width={24}
									height={24} />
							</div>
							<input
								className={'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm text-neutral-400 outline-none scrollbar-none'}
								readOnly
								type={'number'}
								inputMode={'numeric'}
								placeholder={'0'}
								value={amountToSend?.normalized || ''} />
						</div>
						<p
							suppressHydrationWarning
							className={'pl-2 pt-1 text-xs text-neutral-600'}>
							{`You have ${formatAmount(balanceDeposited?.normalized || 0, 2, 6)} st-yETH`}
						</p>
					</div>
					<div className={'w-full'}>
						<p className={'hidden pb-1 text-neutral-600 md:block'}>&nbsp;</p>
						<Button
							onClick={onDeposit}
							isBusy={depositStatus.pending}
							isDisabled={
								amountToSend.raw === 0n
									|| amountToSend.raw > balanceOf.raw
									|| !depositStatus.none
							}
							className={'yearn--button w-full rounded-md !text-sm'}>
							{'Submit'}
						</Button>
						<p className={'pl-2 pt-1 text-xs text-neutral-600'}>&nbsp;</p>
					</div>
				</div>
				<DepositHistory depositHistory={depositHistory} />
			</div>
		</section>
	);
}

export default Deposit;
