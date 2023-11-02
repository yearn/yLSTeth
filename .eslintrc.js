module.exports = {
	'extends': [
		'./node_modules/@yearn-finance/web-lib/.eslintrc.cjs',
		'plugin:@next/next/recommended',
		'plugin:react-hooks/recommended'
	],
	'parser': '@typescript-eslint/parser',
	'parserOptions': {
		'ecmaFeatures': {
			'jsx': true
		},
		'tsconfigRootDir': __dirname,
		'ecmaVersion': 2022,
		'sourceType': 'module',
		'project': ['./tsconfig.json']
	},
	rules: {
		'react-hooks/exhaustive-deps': [
			'warn',
			{
				additionalHooks: '(^useAsyncTrigger$|^useDeepCompareMemo$)'
			}
		]
	}
};
