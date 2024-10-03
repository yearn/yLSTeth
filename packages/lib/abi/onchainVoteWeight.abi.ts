export const ONCHAIN_VOTE_WEIGHT_ABI = [
	{
		name: 'Vote',
		inputs: [
			{name: 'epoch', type: 'uint256', indexed: true},
			{name: 'account', type: 'address', indexed: true},
			{name: 'weight', type: 'uint256', indexed: false},
			{name: 'votes', type: 'uint256[]', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{name: 'SetMeasure', inputs: [{name: 'measure', type: 'address', indexed: true}], anonymous: false, type: 'event'},
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
			{name: '_pool', type: 'address'},
			{name: '_measure', type: 'address'}
		],
		outputs: []
	},
	{stateMutability: 'view', type: 'function', name: 'epoch', inputs: [], outputs: [{name: '', type: 'uint256'}]},
	{stateMutability: 'view', type: 'function', name: 'vote_open', inputs: [], outputs: [{name: '', type: 'bool'}]},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'vote',
		inputs: [{name: '_votes', type: 'uint256[]'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_measure',
		inputs: [{name: '_measure', type: 'address'}],
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
	{stateMutability: 'view', type: 'function', name: 'pool', inputs: [], outputs: [{name: '', type: 'address'}]},
	{stateMutability: 'view', type: 'function', name: 'management', inputs: [], outputs: [{name: '', type: 'address'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'pending_management',
		inputs: [],
		outputs: [{name: '', type: 'address'}]
	},
	{stateMutability: 'view', type: 'function', name: 'measure', inputs: [], outputs: [{name: '', type: 'address'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'total_votes',
		inputs: [{name: 'arg0', type: 'uint256'}],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'votes',
		inputs: [
			{name: 'arg0', type: 'uint256'},
			{name: 'arg1', type: 'uint256'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'votes_user',
		inputs: [
			{name: 'arg0', type: 'address'},
			{name: 'arg1', type: 'uint256'},
			{name: 'arg2', type: 'uint256'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'voted',
		inputs: [
			{name: 'arg0', type: 'address'},
			{name: 'arg1', type: 'uint256'}
		],
		outputs: [{name: '', type: 'bool'}]
	}
] as const;
