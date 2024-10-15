const BOOTSTRAP_ABI_NEW = [
	{
		type: 'event',
		name: 'Incentivize',
		inputs: [
			{name: 'asset', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'incentive', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'depositor', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'amount', type: 'uint256', components: null, internalType: null, indexed: false}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Deposit',
		inputs: [
			{name: 'depositor', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'receiver', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'asset', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'amount', type: 'uint256', components: null, internalType: null, indexed: false},
			{name: 'value', type: 'uint256', components: null, internalType: null, indexed: false}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Claim',
		inputs: [
			{name: 'claimer', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'receiver', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'amount', type: 'uint256', components: null, internalType: null, indexed: false}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Vote',
		inputs: [
			{name: 'voter', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'asset', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'amount', type: 'uint256', components: null, internalType: null, indexed: false}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Repay',
		inputs: [
			{name: 'payer', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'amount', type: 'uint256', components: null, internalType: null, indexed: false}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Split',
		inputs: [
			{name: 'token', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'amount', type: 'uint256', components: null, internalType: null, indexed: false}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'ClaimIncentive',
		inputs: [
			{name: 'asset', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'incentive', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'claimer', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'amount', type: 'uint256', components: null, internalType: null, indexed: false}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'RefundIncentive',
		inputs: [
			{name: 'asset', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'incentive', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'depositor', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'amount', type: 'uint256', components: null, internalType: null, indexed: false}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'SetPeriod',
		inputs: [
			{name: 'period', type: 'uint256', components: null, internalType: null, indexed: true},
			{name: 'begin', type: 'uint256', components: null, internalType: null, indexed: false},
			{name: 'end', type: 'uint256', components: null, internalType: null, indexed: false}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Winners',
		inputs: [{name: 'winners', type: 'address[]', components: null, internalType: null, indexed: false}],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Transfer',
		inputs: [
			{name: 'sender', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'receiver', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'value', type: 'uint256', components: null, internalType: null, indexed: false}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Approval',
		inputs: [
			{name: 'owner', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'spender', type: 'address', components: null, internalType: null, indexed: true},
			{name: 'value', type: 'uint256', components: null, internalType: null, indexed: false}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'PendingManagement',
		inputs: [{name: 'management', type: 'address', components: null, internalType: null, indexed: true}],
		anonymous: false
	},
	{
		type: 'event',
		name: 'SetManagement',
		inputs: [{name: 'management', type: 'address', components: null, internalType: null, indexed: true}],
		anonymous: false
	},
	{
		type: 'constructor',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_token', type: 'address', components: null, internalType: null},
			{name: '_staking', type: 'address', components: null, internalType: null},
			{name: '_treasury', type: 'address', components: null, internalType: null},
			{name: '_pol', type: 'address', components: null, internalType: null}
		]
	},
	{
		type: 'function',
		name: 'incentivize',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_asset', type: 'address', components: null, internalType: null},
			{name: '_incentive', type: 'address', components: null, internalType: null},
			{name: '_amount', type: 'uint256', components: null, internalType: null}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'deposit',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_asset', type: 'address', components: null, internalType: null},
			{name: '_amount', type: 'uint256', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'deposit',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_asset', type: 'address', components: null, internalType: null},
			{name: '_amount', type: 'uint256', components: null, internalType: null},
			{name: '_vote', type: 'address', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'deposit',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_asset', type: 'address', components: null, internalType: null},
			{name: '_amount', type: 'uint256', components: null, internalType: null},
			{name: '_vote', type: 'address', components: null, internalType: null},
			{name: '_account', type: 'address', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'votes',
		stateMutability: 'view',
		inputs: [{name: '_asset', type: 'address', components: null, internalType: null}],
		outputs: [
			{name: '', type: 'bool', components: null, internalType: null},
			{name: '', type: 'uint256', components: null, internalType: null},
			{name: '', type: 'address', components: null, internalType: null}
		]
	},
	{
		type: 'function',
		name: 'claimable',
		stateMutability: 'view',
		inputs: [{name: '_account', type: 'address', components: null, internalType: null}],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{type: 'function', name: 'claim', stateMutability: 'nonpayable', inputs: [], outputs: []},
	{
		type: 'function',
		name: 'claim',
		stateMutability: 'nonpayable',
		inputs: [{name: '_receiver', type: 'address', components: null, internalType: null}],
		outputs: []
	},
	{
		type: 'function',
		name: 'repay',
		stateMutability: 'nonpayable',
		inputs: [{name: '_amount', type: 'uint256', components: null, internalType: null}],
		outputs: []
	},
	{
		type: 'function',
		name: 'split',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_token', type: 'address', components: null, internalType: null},
			{name: '_amount', type: 'uint256', components: null, internalType: null}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'claimable_incentive',
		stateMutability: 'view',
		inputs: [
			{name: '_asset', type: 'address', components: null, internalType: null},
			{name: '_incentive', type: 'address', components: null, internalType: null},
			{name: '_claimer', type: 'address', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'claim_incentive',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_asset', type: 'address', components: null, internalType: null},
			{name: '_incentive', type: 'address', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'claim_incentive',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_asset', type: 'address', components: null, internalType: null},
			{name: '_incentive', type: 'address', components: null, internalType: null},
			{name: '_claimer', type: 'address', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'refund_incentive',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_asset', type: 'address', components: null, internalType: null},
			{name: '_incentive', type: 'address', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'refund_incentive',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_asset', type: 'address', components: null, internalType: null},
			{name: '_incentive', type: 'address', components: null, internalType: null},
			{name: '_depositor', type: 'address', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'num_winners',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'totalSupply',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'balanceOf',
		stateMutability: 'view',
		inputs: [{name: '_account', type: 'address', components: null, internalType: null}],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'allowance',
		stateMutability: 'view',
		inputs: [
			{name: '_owner', type: 'address', components: null, internalType: null},
			{name: '_spender', type: 'address', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'transfer',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_to', type: 'address', components: null, internalType: null},
			{name: '_value', type: 'uint256', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'bool', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'transferFrom',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_from', type: 'address', components: null, internalType: null},
			{name: '_to', type: 'address', components: null, internalType: null},
			{name: '_value', type: 'uint256', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'bool', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'approve',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_spender', type: 'address', components: null, internalType: null},
			{name: '_value', type: 'uint256', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'bool', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'set_incentive_period',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_begin', type: 'uint256', components: null, internalType: null},
			{name: '_end', type: 'uint256', components: null, internalType: null}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'set_deposit_period',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_begin', type: 'uint256', components: null, internalType: null},
			{name: '_end', type: 'uint256', components: null, internalType: null}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'set_lock_end',
		stateMutability: 'nonpayable',
		inputs: [{name: '_end', type: 'uint256', components: null, internalType: null}],
		outputs: []
	},
	{
		type: 'function',
		name: 'set_reward_duration',
		stateMutability: 'nonpayable',
		inputs: [{name: '_duration', type: 'uint256', components: null, internalType: null}],
		outputs: []
	},
	{
		type: 'function',
		name: 'set_rate_provider',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_asset', type: 'address', components: null, internalType: null},
			{name: '_provider', type: 'address', components: null, internalType: null},
			{name: '_enabled', type: 'bool', components: null, internalType: null}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'declare_winners',
		stateMutability: 'nonpayable',
		inputs: [{name: '_winners', type: 'address[]', components: null, internalType: null}],
		outputs: []
	},
	{
		type: 'function',
		name: 'allow_repay',
		stateMutability: 'nonpayable',
		inputs: [
			{name: '_account', type: 'address', components: null, internalType: null},
			{name: '_allow', type: 'bool', components: null, internalType: null}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'set_management',
		stateMutability: 'nonpayable',
		inputs: [{name: '_management', type: 'address', components: null, internalType: null}],
		outputs: []
	},
	{type: 'function', name: 'accept_management', stateMutability: 'nonpayable', inputs: [], outputs: []},
	{
		type: 'function',
		name: 'token',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'address', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'staking',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'address', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'treasury',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'address', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'pol',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'address', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'management',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'address', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'pending_management',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'address', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'repay_allowed',
		stateMutability: 'view',
		inputs: [{name: 'arg0', type: 'address', components: null, internalType: null}],
		outputs: [{name: '', type: 'bool', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'debt',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'deposited',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'unclaimed',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'packed_integral',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'deposits',
		stateMutability: 'view',
		inputs: [{name: 'arg0', type: 'address', components: null, internalType: null}],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'incentives',
		stateMutability: 'view',
		inputs: [
			{name: 'arg0', type: 'address', components: null, internalType: null},
			{name: 'arg1', type: 'address', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'incentive_depositors',
		stateMutability: 'view',
		inputs: [
			{name: 'arg0', type: 'address', components: null, internalType: null},
			{name: 'arg1', type: 'address', components: null, internalType: null},
			{name: 'arg2', type: 'address', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'packed_votes',
		stateMutability: 'view',
		inputs: [{name: 'arg0', type: 'address', components: null, internalType: null}],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'winners_list',
		stateMutability: 'view',
		inputs: [{name: 'arg0', type: 'uint256', components: null, internalType: null}],
		outputs: [{name: '', type: 'address', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'winners',
		stateMutability: 'view',
		inputs: [{name: 'arg0', type: 'address', components: null, internalType: null}],
		outputs: [{name: '', type: 'bool', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'claimed_integral',
		stateMutability: 'view',
		inputs: [{name: 'arg0', type: 'address', components: null, internalType: null}],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'incentive_claimed',
		stateMutability: 'view',
		inputs: [
			{name: 'arg0', type: 'address', components: null, internalType: null},
			{name: 'arg1', type: 'address', components: null, internalType: null},
			{name: 'arg2', type: 'address', components: null, internalType: null}
		],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'incentive_begin',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'incentive_end',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'deposit_begin',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'deposit_end',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'lock_end',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'reward_duration',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint256', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'name',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'string', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'symbol',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'string', components: null, internalType: null}]
	},
	{
		type: 'function',
		name: 'decimals',
		stateMutability: 'view',
		inputs: [],
		outputs: [{name: '', type: 'uint8', components: null, internalType: null}]
	}
] as const;
export default BOOTSTRAP_ABI_NEW;
