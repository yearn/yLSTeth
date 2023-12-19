export const ESTIMATOR_ABI = [
	{
		inputs: [{name: '_pool', type: 'address'}],
		name: 'constructor',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'constructor'
	},
	{
		inputs: [],
		name: 'get_effective_amplification',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'get_effective_target_amplification',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{name: '_i', type: 'uint256'},
			{name: '_j', type: 'uint256'},
			{name: '_dx', type: 'uint256'}
		],
		name: 'get_dy',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{name: '_i', type: 'uint256'},
			{name: '_j', type: 'uint256'},
			{name: '_dy', type: 'uint256'}
		],
		name: 'get_dx',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{name: '_amounts', type: 'uint256[]'}],
		name: 'get_add_lp',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{name: '_lp_amount', type: 'uint256'}],
		name: 'get_remove_lp',
		outputs: [{name: '', type: 'uint256[]'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{name: '_asset', type: 'uint256'},
			{name: '_lp_amount', type: 'uint256'}
		],
		name: 'get_remove_single_lp',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{name: '_amounts', type: 'uint256[]'}],
		name: 'get_vb',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{inputs: [], name: 'pool', outputs: [{name: '', type: 'address'}], stateMutability: 'view', type: 'function'}
] as const;
