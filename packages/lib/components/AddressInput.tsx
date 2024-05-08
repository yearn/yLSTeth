import React, {useCallback, useState} from 'react';
import {isAddress} from 'viem';
import {isZeroAddress, toAddress} from '@builtbymom/web3/utils';
import IconCheck from '@libIcons/IconCheck';
import IconCircleCross from '@libIcons/IconCircleCross';
import {useUpdateEffect} from '@react-hookz/web';
import {Button} from '@yearn-finance/web-lib/components/Button';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';

function AddressInput({
	value,
	onChangeValue,
	onConfirm,
	className,
	shouldBeDisabled
}: {
	value: TAddress;
	onChangeValue: (value: TAddress) => void;
	onConfirm: (newReceiver: TAddress) => void;
	className?: string;
	shouldBeDisabled?: boolean;
}): ReactElement {
	const [isValidValue, set_isValidValue] = useState<boolean | 'undetermined'>('undetermined');
	const [isValidish, set_isValidish] = useState<boolean | 'undetermined'>('undetermined');
	const [namedValue, set_namedValue] = useState<string>('');

	const checkDestinationValidity = useCallback(async (): Promise<void> => {
		set_isValidValue('undetermined');
		if (namedValue && isValidish) {
			set_isValidValue(true);
		} else if (!isZeroAddress(toAddress(value))) {
			set_isValidValue(true);
		}
	}, [namedValue, isValidish, value]);

	useUpdateEffect((): void => {
		if (namedValue === '' || (isZeroAddress(toAddress(namedValue)) && !isZeroAddress(toAddress(value)))) {
			set_namedValue(value);
		}
	}, [namedValue, value]);

	useUpdateEffect((): void => {
		set_isValidValue('undetermined');
		set_isValidish('undetermined');
		if (!isZeroAddress(toAddress(value))) {
			set_isValidValue(true);
		} else {
			set_isValidish(false);
		}
	}, [value]);

	return (
		<form
			onSubmit={async (e): Promise<void> => e.preventDefault()}
			className={`flex w-full flex-row items-center justify-between gap-4 ${className}`}>
			<div className={'box-0 grow-1 flex h-10 w-full items-center p-2 md:min-w-[400px]'}>
				<input
					aria-invalid={!isValidValue}
					onFocus={async (): Promise<void> => checkDestinationValidity()}
					onBlur={async (): Promise<void> => checkDestinationValidity()}
					required
					spellCheck={false}
					placeholder={'0x...'}
					type={'text'}
					value={value}
					onChange={(e): void => {
						set_isValidValue('undetermined');
						onChangeValue(e.target.value as never);
					}}
					className={
						'scrollbar-none w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none'
					}
				/>
				<div className={'pointer-events-none relative size-4'}>
					<IconCheck
						className={`absolute size-4 text-[#16a34a] transition-opacity ${
							isValidValue === true || isValidish === true ? 'opacity-100' : 'opacity-0'
						}`}
					/>
					<IconCircleCross
						className={`absolute size-4 text-[#e11d48] transition-opacity ${
							isValidValue === false && toAddress(value) !== toAddress() ? 'opacity-100' : 'opacity-0'
						}`}
					/>
				</div>
			</div>

			<div className={'w-full'}>
				<Button
					className={'yearn--button w-full rounded-md !text-sm'}
					onClick={(): void => {
						if (value.endsWith('.eth') || value.endsWith('.lens')) {
							onConfirm(toAddress(namedValue));
						} else if (isAddress(value)) {
							onConfirm(toAddress(value));
						}
					}}
					disabled={!(isValidValue === true || isValidish === true) || shouldBeDisabled}>
					{'Take me to the form'}
				</Button>
			</div>
		</form>
	);
}

export default AddressInput;
