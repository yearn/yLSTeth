export const VOTE_WEIGHT_ABI = [
	{
		name: 'SetDelegateMultiplier',
		inputs: [{name: 'multiplier', type: 'uint256', indexed: false}],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Delegate',
		inputs: [
			{name: 'account', type: 'address', indexed: true},
			{name: 'receiver', type: 'address', indexed: true}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'PendingManagement',
		inputs: [{name: 'management', type: 'address', indexed: true}],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'SetManagement',
		inputs: [{name: 'management', type: 'address', indexed: true}],
		anonymous: false,
		type: 'event'
	},
	{
		stateMutability: 'nonpayable',
		type: 'constructor',
		inputs: [
			{name: '_genesis', type: 'uint256'},
			{name: '_staking', type: 'address'},
			{name: '_bootstrap', type: 'address'},
			{name: '_delegated_staking', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'total_vote_weight',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'vote_weight',
		inputs: [{name: '_account', type: 'address'}],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_delegate_multiplier',
		inputs: [{name: '_multiplier', type: 'uint256'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'delegate',
		inputs: [
			{name: '_account', type: 'address'},
			{name: '_receiver', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_management',
		inputs: [{name: '_management', type: 'address'}],
		outputs: []
	},
	{stateMutability: 'nonpayable', type: 'function', name: 'accept_management', inputs: [], outputs: []},
	{stateMutability: 'view', type: 'function', name: 'genesis', inputs: [], outputs: [{name: '', type: 'uint256'}]},
	{stateMutability: 'view', type: 'function', name: 'staking', inputs: [], outputs: [{name: '', type: 'address'}]},
	{stateMutability: 'view', type: 'function', name: 'bootstrap', inputs: [], outputs: [{name: '', type: 'address'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'delegated_staking',
		inputs: [],
		outputs: [{name: '', type: 'address'}]
	},
	{stateMutability: 'view', type: 'function', name: 'management', inputs: [], outputs: [{name: '', type: 'address'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'pending_management',
		inputs: [],
		outputs: [{name: '', type: 'address'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'delegate_multiplier',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'delegator',
		inputs: [{name: 'arg0', type: 'address'}],
		outputs: [{name: '', type: 'address'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'delegated',
		inputs: [{name: 'arg0', type: 'address'}],
		outputs: [{name: '', type: 'address'}]
	}
] as const;
