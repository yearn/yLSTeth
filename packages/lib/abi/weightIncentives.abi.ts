export const WEIGHT_INCENTIVE_ABI = [
	{
		name: 'Deposit',
		inputs: [
			{name: 'epoch', type: 'uint256', indexed: true},
			{name: 'idx', type: 'uint256', indexed: true},
			{name: 'token', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false},
			{name: 'depositor', type: 'address', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Claim',
		inputs: [
			{name: 'epoch', type: 'uint256', indexed: true},
			{name: 'idx', type: 'uint256', indexed: true},
			{name: 'token', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false},
			{name: 'account', type: 'address', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Sweep',
		inputs: [
			{name: 'epoch', type: 'uint256', indexed: true},
			{name: 'token', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false},
			{name: 'recipient', type: 'address', indexed: false}
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
			{name: '_pool', type: 'address'},
			{name: '_voting', type: 'address'}
		],
		outputs: []
	},
	{stateMutability: 'view', type: 'function', name: 'epoch', inputs: [], outputs: [{name: '', type: 'uint256'}]},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'deposit',
		inputs: [
			{name: '_idx', type: 'uint256'},
			{name: '_token', type: 'address'},
			{name: '_amount', type: 'uint256'}
		],
		outputs: []
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'claimable',
		inputs: [
			{name: '_epoch', type: 'uint256'},
			{name: '_idx', type: 'uint256'},
			{name: '_token', type: 'address'},
			{name: '_account', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'claim_many',
		inputs: [
			{name: '_epochs', type: 'uint256[]'},
			{name: '_idx', type: 'uint256[]'},
			{name: '_tokens', type: 'address[]'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'claim_many',
		inputs: [
			{name: '_epochs', type: 'uint256[]'},
			{name: '_idx', type: 'uint256[]'},
			{name: '_tokens', type: 'address[]'},
			{name: '_account', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'claim',
		inputs: [
			{name: '_epoch', type: 'uint256'},
			{name: '_idx', type: 'uint256'},
			{name: '_token', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'claim',
		inputs: [
			{name: '_epoch', type: 'uint256'},
			{name: '_idx', type: 'uint256'},
			{name: '_token', type: 'address'},
			{name: '_account', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'sweepable',
		inputs: [
			{name: '_epoch', type: 'uint256'},
			{name: '_token', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'sweep',
		inputs: [
			{name: '_epoch', type: 'uint256'},
			{name: '_token', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'sweep',
		inputs: [
			{name: '_epoch', type: 'uint256'},
			{name: '_token', type: 'address'},
			{name: '_recipient', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_treasury',
		inputs: [{name: '_treasury', type: 'address'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_deposit_deadline',
		inputs: [{name: '_deadline', type: 'uint256'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_claim_deadline',
		inputs: [{name: '_deadline', type: 'uint256'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_fee_rate',
		inputs: [{name: '_fee_rate', type: 'uint256'}],
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
	{stateMutability: 'view', type: 'function', name: 'voting', inputs: [], outputs: [{name: '', type: 'address'}]},
	{stateMutability: 'view', type: 'function', name: 'management', inputs: [], outputs: [{name: '', type: 'address'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'pending_management',
		inputs: [],
		outputs: [{name: '', type: 'address'}]
	},
	{stateMutability: 'view', type: 'function', name: 'treasury', inputs: [], outputs: [{name: '', type: 'address'}]},
	{stateMutability: 'view', type: 'function', name: 'fee_rate', inputs: [], outputs: [{name: '', type: 'uint256'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'incentives',
		inputs: [
			{name: 'arg0', type: 'uint256'},
			{name: 'arg1', type: 'uint256'},
			{name: 'arg2', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'unclaimed',
		inputs: [
			{name: 'arg0', type: 'uint256'},
			{name: 'arg1', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'user_claimed',
		inputs: [
			{name: 'arg0', type: 'address'},
			{name: 'arg1', type: 'uint256'},
			{name: 'arg2', type: 'uint256'},
			{name: 'arg3', type: 'address'}
		],
		outputs: [{name: '', type: 'bool'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'deposit_deadline',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'claim_deadline',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	}
] as const;
