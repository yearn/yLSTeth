export const ZAP_ABI = [
	{
		stateMutability: 'nonpayable',
		type: 'constructor',
		inputs: [
			{name: '_token', type: 'address'},
			{name: '_pool', type: 'address'},
			{name: '_staking', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'approve',
		inputs: [{name: '_i', type: 'uint256'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'add_liquidity',
		inputs: [
			{name: '_amounts', type: 'uint256[]'},
			{name: '_min_lp_amount', type: 'uint256'}
		],
		outputs: [
			{name: '', type: 'uint256'},
			{name: '', type: 'uint256'}
		]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'add_liquidity',
		inputs: [
			{name: '_amounts', type: 'uint256[]'},
			{name: '_min_lp_amount', type: 'uint256'},
			{name: '_receiver', type: 'address'}
		],
		outputs: [
			{name: '', type: 'uint256'},
			{name: '', type: 'uint256'}
		]
	},
	{stateMutability: 'view', type: 'function', name: 'token', inputs: [], outputs: [{name: '', type: 'address'}]},
	{stateMutability: 'view', type: 'function', name: 'pool', inputs: [], outputs: [{name: '', type: 'address'}]},
	{stateMutability: 'view', type: 'function', name: 'staking', inputs: [], outputs: [{name: '', type: 'address'}]}
] as const;
