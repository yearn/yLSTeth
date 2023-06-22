import {createPublicClient, http} from 'viem';
import {fantom} from 'viem/chains';
import {parseUnits} from '@yearn-finance/web-lib/utils/format.bigNumber';

import {localhost} from './wagmiConfig';

import type {Transition} from 'framer-motion';
import type {PublicClient} from 'wagmi';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

export const transition = {duration: 0.8, ease: 'easeInOut'};
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

export function getClient(): PublicClient {
	if (Number(process.env.DEFAULT_CHAINID) === 1337) {
		return createPublicClient({
			chain: localhost,
			transport: http('http://localhost:8545')
		});
	}
	return createPublicClient({
		chain: fantom,
		transport: http('https://rpc3.fantom.network')
	});
}
