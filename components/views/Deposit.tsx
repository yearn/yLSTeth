import React, {useCallback, useMemo, useState} from 'react';
import assert from 'assert';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import useBootstrap from 'contexts/useBootstrap';
import {useWallet} from 'contexts/useWallet';
import {useTimer} from 'hooks/useTimer';
import {handleInputChangeEventValue} from 'utils';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {depositETH} from 'utils/actions';
import {ETH_TOKEN, STYETH_TOKEN, YETH_TOKEN} from 'utils/tokens';
import {useContractRead} from 'wagmi';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ChangeEvent, ReactElement} from 'react';
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

function Deposit(): ReactElement {
	const {address, isActive, provider} = useWeb3();
	const {balances, refresh} = useWallet();
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [depositStatus, set_depositStatus] = useState<TTxStatus>(defaultTxStatus);
	const tokenToSend = ETH_TOKEN;

	const {data: tokensDeposited, refetch} = useContractRead({
		abi: BOOTSTRAP_ABI,
		address: toAddress(process.env.BOOTSTRAP_ADDRESS),
		functionName: 'deposits',
		args: [toAddress(address)],
		chainId: Number(process.env.DEFAULT_CHAINID)
	});

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
			await refetch();
			await refresh([
				{...ETH_TOKEN, token: ETH_TOKEN.address},
				{...STYETH_TOKEN, token: STYETH_TOKEN.address},
				{...YETH_TOKEN, token: YETH_TOKEN.address}
			]);
		}
	}, [amountToSend.raw, isActive, provider, refresh, refetch]);


	return (
		<section className={'absolute inset-x-0 grid grid-cols-1 px-4 pt-10 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<div className={'mb-10 flex flex-col justify-center'}>
					<h1 className={'text-3xl md:text-8xl'}>
						{'Deposit'}
					</h1>
					<b
						suppressHydrationWarning
						className={'font-number mt-4 text-4xl text-purple-300'}>
						<Timer />
					</b>
				</div>
				<div className={'grid w-full grid-cols-1 gap-10 md:grid-cols-2 md:gap-[48px] lg:w-3/4'}>
					<div>
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
										className={cl('p-1 text-xs rounded-sm border border-purple-300 transition-colors', amountPercentage === 20 ? 'bg-purple-300 text-white' : 'text-purple-300')}>
										{'20%'}
									</button>
									<button
										onClick={(): void => updateToPercent(40)}
										className={cl('p-1 text-xs rounded-sm border border-purple-300 transition-colors', amountPercentage === 40 ? 'bg-purple-300 text-white' : 'text-purple-300')}>
										{'40%'}
									</button>
									<button
										onClick={(): void => updateToPercent(60)}
										className={cl('p-1 text-xs rounded-sm border border-purple-300 transition-colors', amountPercentage === 60 ? 'bg-purple-300 text-white' : 'text-purple-300')}>
										{'60%'}
									</button>
									<button
										onClick={(): void => updateToPercent(80)}
										className={cl('p-1 text-xs rounded-sm border border-purple-300 transition-colors', amountPercentage === 80 ? 'bg-purple-300 text-white' : 'text-purple-300')}>
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
						<div className={'mt-4'}>
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
						<div className={'mt-4 w-full'}>
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
						</div>
					</div>

					<div className={'mt-2'}>
						&nbsp;
						<div className={'text-neutral-700'}>
							<p>{'Decide how much ETH you want to lock as st-yETH.'}</p>
							&nbsp;
							<p>{'Remember this ETH will be locked for 16 weeks, during which time period you’ll be able to receive bri... incentives for voting on which LSTs will be included in yETH.'}</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default Deposit;
