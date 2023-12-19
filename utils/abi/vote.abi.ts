export const VOTE_ABI = [
	{
		name: 'Deposit',
		inputs: [
			{name: 'vote', type: 'bytes32', indexed: true},
			{name: 'choice', type: 'uint256', indexed: false},
			{name: 'token', type: 'address', indexed: true},
			{name: 'depositor', type: 'address', indexed: false},
			{name: 'amount', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Claim',
		inputs: [
			{name: 'vote', type: 'bytes32', indexed: true},
			{name: 'claimer', type: 'address', indexed: true},
			{name: 'incentive', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'SetRoot',
		inputs: [
			{name: 'vote', type: 'bytes32', indexed: false},
			{name: 'root', type: 'bytes32', indexed: false}
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
	{stateMutability: 'nonpayable', type: 'constructor', inputs: [], outputs: []},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'deposit',
		inputs: [
			{name: '_vote', type: 'bytes32'},
			{name: '_choice', type: 'uint256'},
			{name: '_incentive', type: 'address'},
			{name: '_amount', type: 'uint256'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'claim',
		inputs: [
			{name: '_vote', type: 'bytes32'},
			{name: '_incentive', type: 'address'},
			{name: '_amount', type: 'uint256'},
			{name: '_proof', type: 'bytes32[]'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'claim',
		inputs: [
			{name: '_vote', type: 'bytes32'},
			{name: '_incentive', type: 'address'},
			{name: '_amount', type: 'uint256'},
			{name: '_proof', type: 'bytes32[]'},
			{name: '_claimer', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'pure',
		type: 'function',
		name: 'leaf',
		inputs: [
			{name: '_account', type: 'address'},
			{name: '_incentive', type: 'address'},
			{name: '_amount', type: 'uint256'}
		],
		outputs: [{name: '', type: 'bytes32'}]
	},
	{
		stateMutability: 'pure',
		type: 'function',
		name: 'hash_siblings',
		inputs: [
			{name: '_a', type: 'bytes32'},
			{name: '_b', type: 'bytes32'}
		],
		outputs: [{name: '', type: 'bytes32'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_root',
		inputs: [
			{name: '_vote', type: 'bytes32'},
			{name: '_root', type: 'bytes32'}
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
		name: 'roots',
		inputs: [{name: 'arg0', type: 'bytes32'}],
		outputs: [{name: '', type: 'bytes32'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'claimed',
		inputs: [
			{name: 'arg0', type: 'bytes32'},
			{name: 'arg1', type: 'address'},
			{name: 'arg2', type: 'address'}
		],
		outputs: [{name: '', type: 'bool'}]
	}
] as const;
