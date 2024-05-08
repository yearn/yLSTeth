/** @type {import('tailwindcss').Config} */
const config = require('../lib/tailwind.config');

module.exports = {
	...config,
	content: [
		...config.content,
		'./app/components/**/*.{js,ts,jsx,tsx}',
		'./app/contexts/**/*.{js,ts,jsx,tsx}',
		'./app/hooks/**/*.{js,ts,jsx,tsx}',
		'./app/utils/**/*.{js,ts,jsx,tsx}',
		'./pages/**/*.{js,ts,jsx,tsx}',
		'../lib/components/**/*.{js,ts,jsx,tsx}',
		'../lib/contexts/**/*.{js,ts,jsx,tsx}',
		'../lib/hooks/**/*.{js,ts,jsx,tsx}',
		'../lib/icons/**/*.{js,ts,jsx,tsx}',
		'../lib/utils/**/*.{js,ts,jsx,tsx}'
	],
	theme: {
		...config.theme,
		extend: {
			...config.theme.extend,
			colors: {
				...config.theme.extend.colors,
				accent: '#63C532'
			}
		}
	},
	plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography'), require('tailwindcss-animate')]
};
