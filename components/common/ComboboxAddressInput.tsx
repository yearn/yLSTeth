import React, {Fragment, useCallback, useMemo, useState} from 'react';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import IconCheck from 'components/icons/IconCheck';
import IconChevronBoth from 'components/icons/IconChevronBoth';
import IconSpinner from 'components/icons/IconSpinner';
import {useWallet} from 'contexts/useWallet';
import {isAddress} from 'viem';
import {erc20ABI} from 'wagmi';
import {Combobox, Transition} from '@headlessui/react';
import {useAsync, useThrottledState, useUpdateEffect} from '@react-hookz/web';
import {multicall} from '@wagmi/core';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {decodeAsNumber, decodeAsString} from '@yearn-finance/web-lib/utils/decoder';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';

type TComboboxAddressInput = {
	possibleValues: TDict<TTokenInfo | undefined>;
	value: string | undefined;
	onChangeValue: Dispatch<SetStateAction<TTokenInfo | undefined>>,
	onAddValue?: Dispatch<SetStateAction<TDict<TTokenInfo | undefined>>>
}

function ComboboxOption({option}: {option: TTokenInfo | undefined}): ReactElement {
	const	{balances} = useWallet();

	return (
		<Combobox.Option
			className={({active: isActive}): string => `relative cursor-pointer select-none p-2 ${isActive ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-900'}`}
			value={toAddress(option?.address)}>
			{({selected: isSelected}): ReactElement => (
				<div className={'flex w-full flex-row items-center space-x-2'}>
					<div className={'h-6 w-6 min-w-[24px]'}>
						<ImageWithFallback
							key={option?.logoURI || ''}
							alt={''}
							unoptimized
							src={option?.logoURI || ''}
							width={24}
							height={24} />
					</div>
					<div className={'font-sans flex flex-col text-neutral-900'}>
						<span>
							{`${option?.symbol || truncateHex(toAddress(option?.address), 4)}`}
							<small className={'text-xs text-neutral-600'}>{` - ${formatAmount(balances?.[toAddress(option?.address)]?.normalized || 0, 2, 6)} available`}</small>
						</span>
						<small className={'font-number hidden text-xs text-neutral-500 md:flex'}>
							{toAddress(option?.address)}
						</small>
						<small className={'font-number flex text-xs text-neutral-500 md:hidden'}>
							{truncateHex(toAddress(option?.address), 6)}
						</small>
					</div>
					{isSelected ? (
						<span
							className={'absolute inset-y-0 right-8 flex items-center'}>
							<IconCheck className={'absolute h-4 w-4 text-neutral-900'} />
						</span>
					) : null}
				</div>
			)}
		</Combobox.Option>
	);
}

function ComboboxAddressInput({
	possibleValues,
	value,
	onChangeValue,
	onAddValue
}: TComboboxAddressInput): ReactElement {
	const {provider} = useWeb3();
	const {balances} = useWallet();
	const {safeChainID} = useChainID(Number(process.env.BASE_CHAINID));
	const [query, set_query] = useState('');
	const [isOpen, set_isOpen] = useThrottledState(false, 400);

	const [{result: tokenData}, fetchTokenData] = useAsync(async function fetchToken(
		_safeChainID: number,
		_query: TAddress
	): Promise<{name: string, symbol: string, decimals: number} | undefined> {
		if (!isAddress(_query)) {
			return (undefined);
		}
		const results = await multicall({
			contracts: [
				{address: _query, abi: erc20ABI, functionName: 'name'},
				{address: _query, abi: erc20ABI, functionName: 'symbol'},
				{address: _query, abi: erc20ABI, functionName: 'decimals'}
			],
			chainId: _safeChainID
		});
		const name = decodeAsString(results[0]);
		const symbol = decodeAsString(results[1]);
		const decimals = decodeAsNumber(results[2]);
		return ({name, symbol, decimals});
	}, undefined);

	const onChange = useCallback((_selected: TAddress): void => {
		onAddValue?.((prev: TDict<TTokenInfo | undefined>): TDict<TTokenInfo | undefined> => {
			if (prev[_selected]) {
				return (prev);
			}
			return ({
				...prev,
				[toAddress(_selected)]: {
					address: toAddress(_selected),
					name: tokenData?.name || '',
					symbol: tokenData?.symbol || '',
					decimals: tokenData?.decimals || 18,
					chainId: safeChainID,
					logoURI: ''
				}
			});
		});
		performBatchedUpdates((): void => {
			onChangeValue({
				address: toAddress(_selected),
				name: possibleValues[toAddress(_selected)]?.name || '',
				symbol: possibleValues[toAddress(_selected)]?.symbol || '',
				decimals: possibleValues[toAddress(_selected)]?.decimals || 18,
				chainId: possibleValues[toAddress(_selected)]?.chainId || safeChainID,
				logoURI: possibleValues[toAddress(_selected)]?.logoURI || ''
			});
			set_isOpen(false);
		});
	}, [onAddValue, onChangeValue, possibleValues, safeChainID, set_isOpen, tokenData?.decimals, tokenData?.name, tokenData?.symbol]);

	useUpdateEffect((): void => {
		fetchTokenData.execute(safeChainID, toAddress(query));
	}, [fetchTokenData, provider, safeChainID, query]);

	const filteredValues = query === ''
		? Object.values(possibleValues || [])
		: Object.values(possibleValues || []).filter((dest): boolean =>
			`${dest?.name}_${dest?.symbol}_${dest?.address}`
				.toLowerCase()
				.replace(/\s+/g, '')
				.includes(query.toLowerCase().replace(/\s+/g, ''))
		);

	const filteredBalances = useMemo((): [TTokenInfo[], TTokenInfo[]] => {
		const withBalance = [];
		const withoutBalance = [];
		for (const dest of filteredValues) {
			if (dest) {
				if (toBigInt(balances?.[toAddress(dest.address)]?.raw) > 0n) {
					withBalance.push(dest);
				} else {
					withoutBalance.push(dest);
				}
			}
		}
		return ([withBalance, withoutBalance]);
	}, [balances, filteredValues]);

	return (
		<div className={'w-full'}>
			{isOpen ? (
				<div
					className={'fixed inset-0 z-0'}
					onClick={(e): void => {
						e.stopPropagation();
						e.preventDefault();
						set_isOpen(false);
					}} />
			) : null}
			<Combobox<any> value={value} onChange={onChange}>
				<div className={'relative'}>
					<Combobox.Button
						onClick={(): void => set_isOpen((o: boolean): boolean => !o)}
						className={'box-500 grow-1 col-span-12 flex h-10 w-full items-center p-2 md:col-span-9'}>
						<div className={'relative flex w-full flex-row items-center space-x-2'}>
							<div className={'h-6 w-6 min-w-[24px]'}>
								<ImageWithFallback
									key={possibleValues?.[toAddress(value)]?.logoURI || ''}
									alt={''}
									unoptimized
									src={possibleValues?.[toAddress(value)]?.logoURI || ''}
									width={24}
									height={24} />
							</div>
							<p className={'w-full overflow-x-hidden text-ellipsis whitespace-nowrap pr-2 font-normal text-neutral-900 scrollbar-none'}>
								<Combobox.Input
									className={'font-inter w-full cursor-default overflow-x-scroll border-none bg-transparent p-0 outline-none scrollbar-none'}
									displayValue={(dest: TAddress): string => (
										possibleValues?.[toAddress(dest)]?.symbol ||
										truncateHex(toAddress(dest), 8) ||
										''
									)}
									placeholder={'0x...'}
									autoComplete={'off'}
									autoCorrect={'off'}
									spellCheck={false}
									onChange={(event): void => {
										performBatchedUpdates((): void => {
											set_isOpen(true);
											set_query(event.target.value);
										});
									}} />
							</p>
						</div>
						<div className={'absolute right-2 md:right-3'}>
							<IconChevronBoth className={'h-4 w-4 text-neutral-500 transition-colors group-hover:text-neutral-900'} />
						</div>
					</Combobox.Button>
					<Transition
						as={Fragment}
						show={isOpen}
						enter={'transition duration-100 ease-out'}
						enterFrom={'transform scale-95 opacity-0'}
						enterTo={'transform scale-100 opacity-100'}
						leave={'transition duration-75 ease-out'}
						leaveFrom={'transform scale-100 opacity-100'}
						leaveTo={'transform scale-95 opacity-0'}
						afterLeave={(): void => set_query('')}>
						<Combobox.Options className={'box-500 absolute left-0 z-50 mt-1 flex max-h-60 w-full min-w-fit flex-col overflow-y-auto scrollbar-none md:min-w-[400px]'}>
							{Object.values(possibleValues || []).length === 0 ? (
								<div className={'relative flex cursor-default select-none items-center justify-center px-4 py-2 text-neutral-500'}>
									<IconSpinner />
								</div>
							) : filteredValues.length === 0 && query !== '' && (!tokenData || !onAddValue) ? (
								<div className={'relative cursor-default select-none px-4 py-2 text-neutral-500'}>
									{'No token found.'}
								</div>
							) : filteredValues.length === 0 && query !== '' && tokenData ? (
								<ComboboxOption
									option={{
										address: toAddress(query),
										chainId: safeChainID,
										name: tokenData.name,
										symbol: tokenData.symbol,
										decimals: tokenData.decimals,
										logoURI: ''
									}} />

							) : (
								[...filteredBalances[0], ...filteredBalances[1]]
									.slice(0, 100)
									.map((dest): ReactElement => (
										<ComboboxOption
											key={`${dest.address}_${dest.chainId}`}
											option={dest} />
									))
							)}
						</Combobox.Options>
					</Transition>
				</div>
			</Combobox>
		</div>
	);
}

export default ComboboxAddressInput;
