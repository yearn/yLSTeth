/** @type {import('tailwindcss').Config} */
const config = require('../lib/tailwind.config');

module.exports = {
	...config,
	content: [
		'./app/components/**/*.{js,ts,jsx,tsx}',
		'./app/contexts/**/*.{js,ts,jsx,tsx}',
		'./app/hooks/**/*.{js,ts,jsx,tsx}',
		'./app/utils/**/*.{js,ts,jsx,tsx}',
		'./pages/**/*.{js,ts,jsx,tsx}',
		...config.content
	],
	plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography'), require('tailwindcss-animate')]
};
