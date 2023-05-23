import React, {useCallback, useEffect, useMemo, useState} from 'react';
import InputBox from 'components/InputBox';
import usePrices from 'contexts/usePrices';
import {useWallet} from 'contexts/useWallet';
import {handleInputChangeEventValue} from 'utils';
import BOOTSTRAP_ABI from 'utils/abi/bootstrap.abi';
import {ETH_TOKEN, FTM_TOKEN} from 'utils/tokens';
import {prepareWriteContract, readContracts, waitForTransaction, writeContract} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toWagmiAddress} from '@yearn-finance/web-lib/utils/address';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {ChangeEvent, ReactElement} from 'react';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

function DepositView(): ReactElement {
	const {isActive, provider} = useWeb3();
	const {balances} = useWallet();
	const {safeChainID} = useChainID(Number(process.env.DEFAULT_CHAINID));
	const {prices} = usePrices();
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [tokenToSend, set_tokenToSend] = useState<TTokenInfo>(ETH_TOKEN);

	useEffect((): void => {
		set_tokenToSend(safeChainID === 250 ? FTM_TOKEN : ETH_TOKEN);
	}, [safeChainID]);

	const isMaxAmount = useMemo((): boolean => {
		return amountToSend?.normalized === balances?.[tokenToSend.address]?.normalized;
	}, [amountToSend, balances, tokenToSend.address]);

	const onDeposit = useCallback(async (): Promise<void> => {
		if (!isActive || !provider) {
			return;
		}

		const signer = await provider.getWalletClient();
		const chainID = await provider.getChainId();
		const [depositBegin, depositEnd] = await readContracts({
			contracts: [
				{
					address: toWagmiAddress(process.env.BOOTSTRAP_ADDRESS),
					abi: BOOTSTRAP_ABI,
					chainId: chainID,
					functionName: 'deposit_begin'
				}, {
					address: toWagmiAddress(process.env.BOOTSTRAP_ADDRESS),
					abi: BOOTSTRAP_ABI,
					chainId: chainID,
					functionName: 'deposit_end'
				}
			]
		});
		console.log(depositBegin, depositEnd);

		const config = await prepareWriteContract({
			address: toWagmiAddress(process.env.BOOTSTRAP_ADDRESS),
			abi: BOOTSTRAP_ABI,
			functionName: 'deposit',
			walletClient: signer,
			chainId: chainID,
			value: amountToSend.raw
		});
		const {hash} = await writeContract(config.request);
		const receipt = await waitForTransaction({
			chainId: chainID,
			hash: hash
		});
		console.log(receipt);
	}, [amountToSend.raw, isActive, provider]);

	return (
		<section
			className={'mx-auto w-full max-w-2xl rounded border border-dashed border-neutral-900 p-6'}>
			<p className={'pb-6 text-xs font-bold text-neutral-700'}>{'Deposit'}</p>
			<div className={'mx-auto w-full max-w-3xl'}>
				<div className={'flex h-auto flex-col items-center justify-center pb-4'}>
					<InputBox
						token={tokenToSend}
						amountToSend={amountToSend}
						max={Number(amountToSend.normalized)}
						onChange={(e: ChangeEvent<HTMLInputElement>): void => {
							const element = document.getElementById('amountToSend') as HTMLInputElement;
							const newAmount = handleInputChangeEventValue(e, tokenToSend?.decimals || 18);
							if (newAmount.raw > balances?.[tokenToSend.address]?.raw) {
								if (element?.value) {
									element.value = formatAmount(balances?.[tokenToSend.address]?.normalized, 0, 18);
								}
								return set_amountToSend(balances?.[tokenToSend.address] || toNormalizedBN(0));
							}
							set_amountToSend(newAmount);
						}} />
				</div>
				<div className={'flex flex-row space-x-4'}>
					<Button
						suppressHydrationWarning
						className={'w-full'}
						variant={isMaxAmount ? 'warning' : 'filled'}
						onClick={onDeposit}
						isDisabled={
							!isActive ||
							amountToSend.raw > balances?.[tokenToSend.address]?.raw ||
							amountToSend.raw <= 0
						}>
						{isMaxAmount ? 'Depositing all your ETHs can lead to bad trips.' : `Deposit ${formatAmount(amountToSend.normalized, 0, 6)} ${tokenToSend.symbol} (≈ $${formatAmount((
							Number(amountToSend.normalized) * Number(prices?.[safeChainID]?.[tokenToSend.address] || 0)
						), 0, 2)})`}
					</Button>
				</div>

				<div className={'font-number w-full pt-1 text-center text-xxs text-neutral-400'}>
					<button suppressHydrationWarning>
						{`You have ${formatAmount(balances?.[tokenToSend.address]?.normalized || 0, 2, 6)} ${tokenToSend.symbol}`}
					</button>
				</div>
			</div>
		</section>
	);
}

export default DepositView;
