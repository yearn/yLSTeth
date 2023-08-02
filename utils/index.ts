import {parseUnits} from '@yearn-finance/web-lib/utils/format.bigNumber';

import type {Transition} from 'framer-motion';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

export const transition = {duration: 0.8, ease: 'easeInOut'};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const customVariants = (delay: number): any => ({
	initial: ([x]: number[]): Transition => ({x}),
	move: ({transition: {...transition, delay}, x: '0vw'}),
	exit: ([,x]: number[]): Transition => ({
		transition: {...transition, delay},
		x
	})
});

export function handleInputChangeEventValue(e: React.ChangeEvent<HTMLInputElement>, decimals?: number): TNormalizedBN {
	const {valueAsNumber, value} = e.target;
	const amount = value;

	if (isNaN(valueAsNumber)) {
		return ({raw: 0n, normalized: ''});
	}
	if (valueAsNumber === 0) {
		let		amountStr = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
		const	amountParts = amountStr.split('.');
		if ((amountParts[0])?.length > 1 && Number(amountParts[0]) === 0) {
			//
		} else {
			//check if we have 0 everywhere
			if (amountParts.every((part: string): boolean => Number(part) === 0)) {
				if (amountParts.length === 2) {
					amountStr = amountParts[0] + '.' + amountParts[1].slice(0, decimals);
				}
				const	raw = parseUnits((amountStr || '0') as `${number}`, decimals || 18);
				return ({raw: raw, normalized: amountStr || '0'});
			}
		}
	}

	const	raw = parseUnits(value, decimals || 18);
	return ({raw: raw, normalized: amount.toString() || '0'});
}

export function	formatDate(value: number): string {
	let locale = 'fr-FR';
	if (typeof(navigator) !== 'undefined') {
		locale = navigator.language || 'fr-FR';
	}

	const	formatedDate = new Intl.DateTimeFormat([locale, 'en-US'], {
		dateStyle: 'medium',
		timeStyle: 'short',
		hourCycle: 'h24'
	}).format(value);
	return formatedDate;
}
