import React, {Fragment, useCallback, useEffect, useMemo, useState} from 'react';
import {erc20Abi, isAddress} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {
	decodeAsNumber,
	decodeAsString,
	formatAmount,
	isZeroAddress,
	toAddress,
	toBigInt,
	truncateHex,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {Combobox, Transition} from '@headlessui/react';
import IconCheck from '@libIcons/IconCheck';
import IconChevronBoth from '@libIcons/IconChevronBoth';
import IconSpinner from '@libIcons/IconSpinner';
import {useAsync, useThrottledState} from '@react-hookz/web';
import {multicall} from '@wagmi/core';

import {ImageWithFallback} from './ImageWithFallback';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TAddress, TDict, TToken} from '@builtbymom/web3/types';

type TComboboxAddressInput = {
	possibleValues: TDict<TToken | undefined>;
	value: string | undefined;
	onChangeValue: Dispatch<SetStateAction<TToken | undefined>>;
	onAddValue?: Dispatch<SetStateAction<TDict<TToken | undefined>>>;
	shouldDisplayBalance?: boolean;
	isLoading?: boolean;
};

function ComboboxOption({
	option,
	shouldDisplayBalance = true
}: {
	option: TToken | undefined;
	shouldDisplayBalance?: boolean;
}): ReactElement {
	const {getBalance} = useWallet();

	return (
		<Combobox.Option
			className={({active: isActive}): string =>
				`relative cursor-pointer select-none p-2 ${
					isActive ? 'bg-purple-300/10 text-neutral-900' : 'text-neutral-900'
				}`
			}
			value={toAddress(option?.address)}>
			{({selected: isSelected}): ReactElement => (
				<div className={'flex w-full flex-row items-center space-x-2'}>
					<div className={'size-6 min-w-[24px]'}>
						<ImageWithFallback
							key={option?.logoURI || ''}
							alt={''}
							unoptimized
							src={option?.logoURI || ''}
							altSrc={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${option?.address}/logo-32.png`}
							width={24}
							height={24}
						/>
					</div>
					<div className={'flex flex-col font-sans text-neutral-900'}>
						<span>
							{`${option?.symbol || truncateHex(toAddress(option?.address), 4)}`}
							{shouldDisplayBalance && !isZeroAddress(option?.address) ? (
								<small className={'text-xs text-neutral-600'}>
									{` - ${formatAmount(
										getBalance({
											address: toAddress(option?.address),
											chainID: Number(option?.chainID)
										})?.normalized || 0,
										2,
										6
									)} available`}
								</small>
							) : null}
						</span>
						<small className={'font-number hidden text-xs text-neutral-500 md:flex'}>
							{!isZeroAddress(option?.address) ? toAddress(option?.address) : ''}
						</small>
						<small className={'font-number flex text-xs text-neutral-500 md:hidden'}>
							{!isZeroAddress(option?.address) ? truncateHex(toAddress(option?.address), 6) : ''}
						</small>
					</div>
					{isSelected ? (
						<span className={'absolute inset-y-0 right-8 flex items-center'}>
							<IconCheck className={'absolute size-4 text-neutral-900'} />
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
	onAddValue,
	shouldDisplayBalance,
	isLoading
}: TComboboxAddressInput): ReactElement {
	const {isActive} = useWeb3();
	const {getBalance, onRefresh} = useWallet();
	const {safeChainID} = useChainID(Number(process.env.DEFAULT_CHAIN_ID));
	const [query, set_query] = useState('');
	const [isOpen, set_isOpen] = useThrottledState(false, 400);
	const [isLoadingTokenData, set_isLoadingTokenData] = useState(false);
	const {currentNetworkTokenList} = useTokenList();

	const fetchToken = useCallback(
		async (
			_safeChainID: number,
			_query: TAddress
		): Promise<{name: string; symbol: string; decimals: number} | undefined> => {
			if (!isAddress(_query)) {
				return undefined;
			}

			if (currentNetworkTokenList[_query]) {
				return {
					name: currentNetworkTokenList[_query].name,
					symbol: currentNetworkTokenList[_query].symbol,
					decimals: currentNetworkTokenList[_query].decimals
				};
			}

			const results = await multicall(retrieveConfig(), {
				contracts: [
					{address: _query, abi: erc20Abi, functionName: 'name'},
					{address: _query, abi: erc20Abi, functionName: 'symbol'},
					{address: _query, abi: erc20Abi, functionName: 'decimals'}
				],
				chainId: _safeChainID
			});
			const name = decodeAsString(results[0]);
			const symbol = decodeAsString(results[1]);
			const decimals = decodeAsNumber(results[2]);
			await onRefresh([{decimals, name, symbol, address: _query, chainID: _safeChainID}]);
			return {name, symbol, decimals};
		},
		[onRefresh, currentNetworkTokenList]
	);

	const [{result: tokenData}, fetchTokenData] = useAsync(fetchToken);

	const onChange = useCallback(
		async (_selected: TAddress): Promise<void> => {
			let _tokenData = tokenData;
			if (!tokenData || (!tokenData.name && !tokenData.symbol && !tokenData.decimals)) {
				set_isLoadingTokenData(true);
				_tokenData = await fetchToken(safeChainID, _selected);
				set_isLoadingTokenData(false);
			}
			onAddValue?.((prev: TDict<TToken | undefined>): TDict<TToken | undefined> => {
				if (prev[_selected]) {
					return prev;
				}
				return {
					...prev,
					[toAddress(_selected)]: {
						address: toAddress(_selected),
						name: _tokenData?.name || '',
						symbol: _tokenData?.symbol || '',
						decimals: _tokenData?.decimals || 18,
						chainID: safeChainID,
						logoURI: `https://assets.smold.app/api/token/${safeChainID}/${toAddress(
							_selected
						)}/logo-128.png`,
						balance: zeroNormalizedBN,
						value: 0
					}
				};
			});
			onChangeValue({
				address: toAddress(_selected),
				name: _tokenData?.name || '',
				symbol: _tokenData?.symbol || '',
				decimals: _tokenData?.decimals || 18,
				chainID: safeChainID,
				logoURI:
					possibleValues[toAddress(_selected)]?.logoURI ||
					`https://assets.smold.app/api/token/${safeChainID}/${toAddress(_selected)}/logo-128.png`,
				balance: zeroNormalizedBN,
				value: 0
			});
			set_isOpen(false);
		},
		[fetchToken, onAddValue, onChangeValue, possibleValues, safeChainID, set_isOpen, tokenData]
	);

	useEffect((): void => {
		if (!isActive || !isAddress(query)) {
			return;
		}
		fetchTokenData.execute(safeChainID, toAddress(query));
	}, [fetchTokenData, isActive, safeChainID, query]);

	const filteredValues =
		query === ''
			? Object.values(possibleValues || [])
			: Object.values(possibleValues || []).filter((dest): boolean =>
					`${dest?.name}_${dest?.symbol}_${dest?.address}`
						.toLowerCase()
						.replace(/\s+/g, '')
						.includes(query.toLowerCase().replace(/\s+/g, ''))
				);

	const filteredBalances = useMemo((): [TToken[], TToken[]] => {
		const withBalance = [];
		const withoutBalance = [];
		for (const dest of filteredValues) {
			if (dest) {
				if (toBigInt(getBalance({address: toAddress(dest.address), chainID: dest.chainID})?.raw) > 0n) {
					withBalance.push(dest);
				} else {
					withoutBalance.push(dest);
				}
			}
		}
		return [withBalance, withoutBalance];
	}, [getBalance, filteredValues]);

	return (
		<div className={'w-full'}>
			{isOpen ? (
				<div
					className={'fixed inset-0 z-0'}
					onClick={(e): void => {
						e.stopPropagation();
						e.preventDefault();
						set_isOpen(false);
					}}
				/>
			) : null}
			<Combobox<unknown>
				value={value}
				onChange={onChange}>
				<div className={'relative'}>
					<Combobox.Button
						onClick={(): void => set_isOpen((o: boolean): boolean => !o)}
						className={
							'grow-1 bg-neutral-0 col-span-12 flex h-10 w-full items-center rounded-md p-2 md:col-span-9'
						}>
						<div className={'relative flex w-full flex-row items-center space-x-2'}>
							<div className={'size-6 min-w-[24px]'}>
								<ImageWithFallback
									alt={''}
									unoptimized
									src={possibleValues?.[toAddress(value)]?.logoURI || ''}
									altSrc={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${value}/logo-32.png`}
									width={24}
									height={24}
								/>
							</div>
							<p
								className={
									'scrollbar-none w-full overflow-x-hidden text-ellipsis whitespace-nowrap pr-2 font-normal text-neutral-900'
								}>
								<Combobox.Input
									className={
										'font-inter scrollbar-none w-full cursor-default overflow-x-scroll border-none bg-transparent p-0 outline-none'
									}
									displayValue={(dest: TAddress): string => {
										if (isZeroAddress(dest)) {
											return possibleValues?.[toAddress(dest)]?.name || '';
										}
										return (
											possibleValues?.[toAddress(dest)]?.symbol ||
											truncateHex(toAddress(dest), 8) ||
											''
										);
									}}
									placeholder={'0x...'}
									autoComplete={'off'}
									autoCorrect={'off'}
									spellCheck={false}
									onChange={(event): void => {
										set_isOpen(true);
										set_query(event.target.value);
									}}
								/>
							</p>
						</div>
						{isLoadingTokenData && (
							<div className={'absolute right-8'}>
								<IconSpinner
									className={'size-4 text-neutral-500 transition-colors group-hover:text-neutral-900'}
								/>
							</div>
						)}
						<div className={'absolute right-2 md:right-3'}>
							<IconChevronBoth
								className={'size-4 text-neutral-500 transition-colors group-hover:text-neutral-900'}
							/>
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
						<Combobox.Options
							className={
								'scrollbar-show bg-neutral-0 absolute left-0 z-50 mt-1 flex max-h-52 w-full min-w-fit flex-col overflow-y-scroll rounded-md shadow-lg md:min-w-[400px]'
							}>
							{Object.values(possibleValues || []).length === 0 ? (
								<div
									className={
										'relative flex cursor-default select-none items-center justify-center px-4 py-2 text-neutral-500'
									}>
									<IconSpinner />
								</div>
							) : filteredValues.length === 0 && query !== '' && (!tokenData || !onAddValue) ? (
								<div className={'relative cursor-default select-none px-4 py-2 text-neutral-500'}>
									{'No token found.'}
								</div>
							) : filteredValues.length === 0 && query !== '' && tokenData ? (
								<ComboboxOption
									shouldDisplayBalance={shouldDisplayBalance}
									option={{
										address: toAddress(query),
										chainID: safeChainID,
										name: tokenData.name,
										symbol: tokenData.symbol,
										decimals: tokenData.decimals,
										logoURI: '',
										balance: zeroNormalizedBN,
										value: 0
									}}
								/>
							) : (
								[...filteredBalances[0], ...filteredBalances[1]].slice(0, 100).map(
									(dest): ReactElement => (
										<ComboboxOption
											key={`${dest.address}_${dest.chainID}`}
											shouldDisplayBalance={shouldDisplayBalance}
											option={dest}
										/>
									)
								)
							)}
							{isLoading && (
								<div className={'my-6 flex flex-row items-center justify-center'}>
									<IconSpinner className={'!h-6 !w-6 !text-neutral-400'} />
								</div>
							)}
						</Combobox.Options>
					</Transition>
				</div>
			</Combobox>
		</div>
	);
}

export default ComboboxAddressInput;
