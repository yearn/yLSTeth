import type {Transition} from 'framer-motion';

export const transition = {duration: 0.8, ease: 'easeInOut'};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const customVariants = (delay: number): any => ({
	initial: ([x]: number[]): Transition => ({x}),
	move: {transition: {...transition, delay}, x: '0vw'},
	exit: ([, x]: number[]): Transition => ({
		transition: {...transition, delay},
		x
	})
});

export function formatDate(value: number): string {
	let locale = 'fr-FR';
	if (typeof navigator !== 'undefined') {
		locale = navigator.language || 'fr-FR';
	}

	const formatedDate = new Intl.DateTimeFormat([locale, 'en-US'], {
		dateStyle: 'medium',
		timeStyle: 'short',
		hourCycle: 'h24'
	}).format(value);
	return formatedDate;
}
