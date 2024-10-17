const BOOTSTRAP_ABI_NEW = [
	{
		name: 'Incentivize',
		inputs: [
			{name: 'asset', type: 'address', indexed: true},
			{name: 'incentive', type: 'address', indexed: true},
			{name: 'depositor', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Deposit',
		inputs: [
			{name: 'depositor', type: 'address', indexed: true},
			{name: 'receiver', type: 'address', indexed: true},
			{name: 'asset', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false},
			{name: 'value', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Claim',
		inputs: [
			{name: 'claimer', type: 'address', indexed: true},
			{name: 'receiver', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Vote',
		inputs: [
			{name: 'voter', type: 'address', indexed: true},
			{name: 'asset', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Repay',
		inputs: [
			{name: 'payer', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Split',
		inputs: [
			{name: 'token', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'ClaimIncentive',
		inputs: [
			{name: 'asset', type: 'address', indexed: true},
			{name: 'incentive', type: 'address', indexed: true},
			{name: 'claimer', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'RefundIncentive',
		inputs: [
			{name: 'asset', type: 'address', indexed: true},
			{name: 'incentive', type: 'address', indexed: true},
			{name: 'depositor', type: 'address', indexed: true},
			{name: 'amount', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'SetPeriod',
		inputs: [
			{name: 'period', type: 'uint256', indexed: true},
			{name: 'begin', type: 'uint256', indexed: false},
			{name: 'end', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{name: 'Winners', inputs: [{name: 'winners', type: 'address[]', indexed: false}], anonymous: false, type: 'event'},
	{
		name: 'Transfer',
		inputs: [
			{name: 'sender', type: 'address', indexed: true},
			{name: 'receiver', type: 'address', indexed: true},
			{name: 'value', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Approval',
		inputs: [
			{name: 'owner', type: 'address', indexed: true},
			{name: 'spender', type: 'address', indexed: true},
			{name: 'value', type: 'uint256', indexed: false}
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
			{name: '_token', type: 'address'},
			{name: '_staking', type: 'address'},
			{name: '_treasury', type: 'address'},
			{name: '_pol', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'incentivize',
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_incentive', type: 'address'},
			{name: '_amount', type: 'uint256'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'deposit',
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_amount', type: 'uint256'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'deposit',
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_amount', type: 'uint256'},
			{name: '_vote', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'deposit',
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_amount', type: 'uint256'},
			{name: '_vote', type: 'address'},
			{name: '_account', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'votes',
		inputs: [{name: '_asset', type: 'address'}],
		outputs: [
			{name: '', type: 'bool'},
			{name: '', type: 'uint256'},
			{name: '', type: 'address'}
		]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'claimable',
		inputs: [{name: '_account', type: 'address'}],
		outputs: [{name: '', type: 'uint256'}]
	},
	{stateMutability: 'nonpayable', type: 'function', name: 'claim', inputs: [], outputs: []},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'claim',
		inputs: [{name: '_receiver', type: 'address'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'repay',
		inputs: [{name: '_amount', type: 'uint256'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'split',
		inputs: [
			{name: '_token', type: 'address'},
			{name: '_amount', type: 'uint256'}
		],
		outputs: []
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'claimable_incentive',
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_incentive', type: 'address'},
			{name: '_claimer', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'claim_incentive',
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_incentive', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'claim_incentive',
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_incentive', type: 'address'},
			{name: '_claimer', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'refund_incentive',
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_incentive', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'refund_incentive',
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_incentive', type: 'address'},
			{name: '_depositor', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'num_winners',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'totalSupply',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'balanceOf',
		inputs: [{name: '_account', type: 'address'}],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'allowance',
		inputs: [
			{name: '_owner', type: 'address'},
			{name: '_spender', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'transfer',
		inputs: [
			{name: '_to', type: 'address'},
			{name: '_value', type: 'uint256'}
		],
		outputs: [{name: '', type: 'bool'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'transferFrom',
		inputs: [
			{name: '_from', type: 'address'},
			{name: '_to', type: 'address'},
			{name: '_value', type: 'uint256'}
		],
		outputs: [{name: '', type: 'bool'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'approve',
		inputs: [
			{name: '_spender', type: 'address'},
			{name: '_value', type: 'uint256'}
		],
		outputs: [{name: '', type: 'bool'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_incentive_period',
		inputs: [
			{name: '_begin', type: 'uint256'},
			{name: '_end', type: 'uint256'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_deposit_period',
		inputs: [
			{name: '_begin', type: 'uint256'},
			{name: '_end', type: 'uint256'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_lock_end',
		inputs: [{name: '_end', type: 'uint256'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_reward_duration',
		inputs: [{name: '_duration', type: 'uint256'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_rate_provider',
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_provider', type: 'address'},
			{name: '_enabled', type: 'bool'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'declare_winners',
		inputs: [{name: '_winners', type: 'address[]'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'allow_repay',
		inputs: [
			{name: '_account', type: 'address'},
			{name: '_allow', type: 'bool'}
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
	{stateMutability: 'view', type: 'function', name: 'token', inputs: [], outputs: [{name: '', type: 'address'}]},
	{stateMutability: 'view', type: 'function', name: 'staking', inputs: [], outputs: [{name: '', type: 'address'}]},
	{stateMutability: 'view', type: 'function', name: 'treasury', inputs: [], outputs: [{name: '', type: 'address'}]},
	{stateMutability: 'view', type: 'function', name: 'pol', inputs: [], outputs: [{name: '', type: 'address'}]},
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
		name: 'repay_allowed',
		inputs: [{name: 'arg0', type: 'address'}],
		outputs: [{name: '', type: 'bool'}]
	},
	{stateMutability: 'view', type: 'function', name: 'debt', inputs: [], outputs: [{name: '', type: 'uint256'}]},
	{stateMutability: 'view', type: 'function', name: 'deposited', inputs: [], outputs: [{name: '', type: 'uint256'}]},
	{stateMutability: 'view', type: 'function', name: 'unclaimed', inputs: [], outputs: [{name: '', type: 'uint256'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'packed_integral',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'deposits',
		inputs: [{name: 'arg0', type: 'address'}],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'incentives',
		inputs: [
			{name: 'arg0', type: 'address'},
			{name: 'arg1', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'incentive_depositors',
		inputs: [
			{name: 'arg0', type: 'address'},
			{name: 'arg1', type: 'address'},
			{name: 'arg2', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'packed_votes',
		inputs: [{name: 'arg0', type: 'address'}],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'winners_list',
		inputs: [{name: 'arg0', type: 'uint256'}],
		outputs: [{name: '', type: 'address'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'winners',
		inputs: [{name: 'arg0', type: 'address'}],
		outputs: [{name: '', type: 'bool'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'claimed_integral',
		inputs: [{name: 'arg0', type: 'address'}],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'incentive_claimed',
		inputs: [
			{name: 'arg0', type: 'address'},
			{name: 'arg1', type: 'address'},
			{name: 'arg2', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'incentive_begin',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'incentive_end',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'deposit_begin',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'deposit_end',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{stateMutability: 'view', type: 'function', name: 'lock_end', inputs: [], outputs: [{name: '', type: 'uint256'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'reward_duration',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{stateMutability: 'view', type: 'function', name: 'name', inputs: [], outputs: [{name: '', type: 'string'}]},
	{stateMutability: 'view', type: 'function', name: 'symbol', inputs: [], outputs: [{name: '', type: 'string'}]},
	{stateMutability: 'view', type: 'function', name: 'decimals', inputs: [], outputs: [{name: '', type: 'uint8'}]}
] as const;
export default BOOTSTRAP_ABI_NEW;
