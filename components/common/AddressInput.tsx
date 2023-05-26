import React, {useCallback, useState} from 'react';
import IconCheck from 'components/icons/IconCheck';
import IconCircleCross from 'components/icons/IconCircleCross';
import {isAddress} from 'viem';
import {useUpdateEffect} from '@react-hookz/web';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {isZeroAddress, toAddress} from '@yearn-finance/web-lib/utils/address';

import type {ReactElement} from 'react';
import type {TAddress} from '@yearn-finance/web-lib/types';

function	AddressInput({value, onChangeValue, onConfirm, className, shouldBeDisabled}: {
	value: TAddress,
	onChangeValue: (value: TAddress) => void,
	onConfirm: (newReceiver: TAddress) => void,
	className?: string,
	shouldBeDisabled?: boolean,
}): ReactElement {
	const	[isValidValue, set_isValidValue] = useState<boolean | 'undetermined'>('undetermined');
	const	[isValidish, set_isValidish] = useState<boolean | 'undetermined'>('undetermined');
	const	[namedValue, set_namedValue] = useState<string>('');

	const	checkDestinationValidity = useCallback(async (): Promise<void> => {
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
			className={`grid w-full grid-cols-12 flex-row items-center justify-between gap-4 md:w-3/4 md:gap-6 ${className}`}>
			<div className={'box-0 grow-1 col-span-12 flex h-10 w-full items-center p-2 md:col-span-9'}>
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
					className={'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm font-bold outline-none scrollbar-none'} />
				<div className={'pointer-events-none relative h-4 w-4'}>
					<IconCheck
						className={`absolute h-4 w-4 text-[#16a34a] transition-opacity ${isValidValue === true || isValidish === true ? 'opacity-100' : 'opacity-0'}`} />
					<IconCircleCross
						className={`absolute h-4 w-4 text-[#e11d48] transition-opacity ${(isValidValue === false && toAddress(value) !== toAddress()) ? 'opacity-100' : 'opacity-0'}`} />
				</div>
			</div>

			<div className={'col-span-12 md:col-span-3'}>
				<Button
					className={'yearn--button !w-[160px] rounded-md !text-sm'}
					onClick={(): void => {
						if (value.endsWith('.eth') || value.endsWith('.lens')) {
							onConfirm(toAddress(namedValue));
						} else if (isAddress(value)) {
							onConfirm(toAddress(value));
						}
					}}
					disabled={!(isValidValue === true || isValidish === true )|| shouldBeDisabled}>
					{'Next'}
				</Button>
			</div>
		</form>
	);
}

export default AddressInput;
