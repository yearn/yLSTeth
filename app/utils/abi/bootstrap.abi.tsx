const BOOTSTRAP_ABI = [
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'protocol',
				type: 'address'
			}
		],
		name: 'Apply',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'protocol',
				type: 'address'
			}
		],
		name: 'Whitelist',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'protocol',
				type: 'address'
			},
			{
				indexed: true,
				name: 'incentive',
				type: 'address'
			},
			{
				indexed: true,
				name: 'depositor',
				type: 'address'
			},
			{
				indexed: false,
				name: 'amount',
				type: 'uint256'
			}
		],
		name: 'Incentivize',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'depositor',
				type: 'address'
			},
			{
				indexed: true,
				name: 'receiver',
				type: 'address'
			},
			{
				indexed: false,
				name: 'amount',
				type: 'uint256'
			}
		],
		name: 'Deposit',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'claimer',
				type: 'address'
			},
			{
				indexed: true,
				name: 'receiver',
				type: 'address'
			},
			{
				indexed: false,
				name: 'amount',
				type: 'uint256'
			}
		],
		name: 'Claim',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'voter',
				type: 'address'
			},
			{
				indexed: true,
				name: 'protocol',
				type: 'address'
			},
			{
				indexed: false,
				name: 'amount',
				type: 'uint256'
			}
		],
		name: 'Vote',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'payer',
				type: 'address'
			},
			{
				indexed: false,
				name: 'amount',
				type: 'uint256'
			}
		],
		name: 'Repay',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				name: 'amount',
				type: 'uint256'
			}
		],
		name: 'Split',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'protocol',
				type: 'address'
			},
			{
				indexed: true,
				name: 'incentive',
				type: 'address'
			},
			{
				indexed: true,
				name: 'claimer',
				type: 'address'
			},
			{
				indexed: false,
				name: 'amount',
				type: 'uint256'
			}
		],
		name: 'ClaimIncentive',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'protocol',
				type: 'address'
			},
			{
				indexed: true,
				name: 'incentive',
				type: 'address'
			},
			{
				indexed: true,
				name: 'depositor',
				type: 'address'
			},
			{
				indexed: false,
				name: 'amount',
				type: 'uint256'
			}
		],
		name: 'RefundIncentive',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'period',
				type: 'uint256'
			},
			{
				indexed: false,
				name: 'begin',
				type: 'uint256'
			},
			{
				indexed: false,
				name: 'end',
				type: 'uint256'
			}
		],
		name: 'SetPeriod',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				name: 'winners',
				type: 'address[]'
			}
		],
		name: 'Winners',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'management',
				type: 'address'
			}
		],
		name: 'PendingManagement',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: 'management',
				type: 'address'
			}
		],
		name: 'SetManagement',
		type: 'event'
	},
	{
		inputs: [
			{
				name: '_token',
				type: 'address'
			},
			{
				name: '_staking',
				type: 'address'
			},
			{
				name: '_treasury',
				type: 'address'
			},
			{
				name: '_pol',
				type: 'address'
			}
		],
		stateMutability: 'nonpayable',
		type: 'constructor'
	},
	{
		stateMutability: 'payable',
		type: 'fallback'
	},
	{
		inputs: [
			{
				name: '_protocol',
				type: 'address'
			}
		],
		name: 'apply',
		outputs: [],
		stateMutability: 'payable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_protocol',
				type: 'address'
			},
			{
				name: '_incentive',
				type: 'address'
			},
			{
				name: '_amount',
				type: 'uint256'
			}
		],
		name: 'incentivize',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'deposit',
		outputs: [],
		stateMutability: 'payable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_amount',
				type: 'uint256'
			}
		],
		name: 'claim',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_amount',
				type: 'uint256'
			},
			{
				name: '_receiver',
				type: 'address'
			}
		],
		name: 'claim',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_account',
				type: 'address'
			}
		],
		name: 'votes_available',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_protocols',
				type: 'address[]'
			},
			{
				name: '_votes',
				type: 'uint256[]'
			}
		],
		name: 'vote',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_amount',
				type: 'uint256'
			}
		],
		name: 'repay',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'split',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_protocol',
				type: 'address'
			},
			{
				name: '_incentive',
				type: 'address'
			},
			{
				name: '_claimer',
				type: 'address'
			}
		],
		name: 'claimable_incentive',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_protocol',
				type: 'address'
			},
			{
				name: '_incentive',
				type: 'address'
			}
		],
		name: 'claim_incentive',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_protocol',
				type: 'address'
			},
			{
				name: '_incentive',
				type: 'address'
			},
			{
				name: '_claimer',
				type: 'address'
			}
		],
		name: 'claim_incentive',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_protocol',
				type: 'address'
			},
			{
				name: '_incentive',
				type: 'address'
			}
		],
		name: 'refund_incentive',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_protocol',
				type: 'address'
			},
			{
				name: '_incentive',
				type: 'address'
			},
			{
				name: '_depositor',
				type: 'address'
			}
		],
		name: 'refund_incentive',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_protocol',
				type: 'address'
			}
		],
		name: 'has_applied',
		outputs: [
			{
				name: '',
				type: 'bool'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_protocol',
				type: 'address'
			}
		],
		name: 'is_whitelisted',
		outputs: [
			{
				name: '',
				type: 'bool'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'num_winners',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_begin',
				type: 'uint256'
			},
			{
				name: '_end',
				type: 'uint256'
			}
		],
		name: 'set_whitelist_period',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_begin',
				type: 'uint256'
			},
			{
				name: '_end',
				type: 'uint256'
			}
		],
		name: 'set_incentive_period',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_begin',
				type: 'uint256'
			},
			{
				name: '_end',
				type: 'uint256'
			}
		],
		name: 'set_deposit_period',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_begin',
				type: 'uint256'
			},
			{
				name: '_end',
				type: 'uint256'
			}
		],
		name: 'set_vote_period',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_end',
				type: 'uint256'
			}
		],
		name: 'set_lock_end',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_protocol',
				type: 'address'
			}
		],
		name: 'whitelist',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_protocol',
				type: 'address'
			}
		],
		name: 'undo_whitelist',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_winners',
				type: 'address[]'
			}
		],
		name: 'declare_winners',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				name: '_management',
				type: 'address'
			}
		],
		name: 'set_management',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'accept_management',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'token',
		outputs: [
			{
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'staking',
		outputs: [
			{
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'treasury',
		outputs: [
			{
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'pol',
		outputs: [
			{
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'management',
		outputs: [
			{
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'pending_management',
		outputs: [
			{
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'debt',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'deposited',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			}
		],
		name: 'deposits',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			},
			{
				name: 'arg1',
				type: 'address'
			}
		],
		name: 'incentives',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			},
			{
				name: 'arg1',
				type: 'address'
			},
			{
				name: 'arg2',
				type: 'address'
			}
		],
		name: 'incentive_depositors',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'voted',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			}
		],
		name: 'votes_used',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			}
		],
		name: 'votes',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: 'arg0',
				type: 'uint256'
			}
		],
		name: 'winners_list',
		outputs: [
			{
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			}
		],
		name: 'winners',
		outputs: [
			{
				name: '',
				type: 'bool'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			},
			{
				name: 'arg1',
				type: 'address'
			},
			{
				name: 'arg2',
				type: 'address'
			}
		],
		name: 'incentive_claimed',
		outputs: [
			{
				name: '',
				type: 'bool'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'whitelist_begin',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'whitelist_end',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'incentive_begin',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'incentive_end',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'deposit_begin',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'deposit_end',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'vote_begin',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'vote_end',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'lock_end',
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

export default BOOTSTRAP_ABI;
