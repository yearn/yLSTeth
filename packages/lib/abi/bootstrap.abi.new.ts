const BOOTSTRAP_ABI_NEW = [
	{
		type: 'event',
		name: 'Incentivize',
		inputs: [
			{
				name: 'asset',
				type: 'address',
				indexed: true
			},
			{
				name: 'incentive',
				type: 'address',
				indexed: true
			},
			{
				name: 'depositor',
				type: 'address',
				indexed: true
			},
			{
				name: 'amount',
				type: 'uint256',
				indexed: false
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Deposit',
		inputs: [
			{
				name: 'depositor',
				type: 'address',
				indexed: true
			},
			{
				name: 'receiver',
				type: 'address',
				indexed: true
			},
			{
				name: 'asset',
				type: 'address',
				indexed: true
			},
			{
				name: 'amount',
				type: 'uint256',
				indexed: false
			},
			{
				name: 'value',
				type: 'uint256',
				indexed: false
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Claim',
		inputs: [
			{
				name: 'claimer',
				type: 'address',
				indexed: true
			},
			{
				name: 'receiver',
				type: 'address',
				indexed: true
			},
			{
				name: 'amount',
				type: 'uint256',
				indexed: false
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Vote',
		inputs: [
			{
				name: 'voter',
				type: 'address',
				indexed: true
			},
			{
				name: 'asset',
				type: 'address',
				indexed: true
			},
			{
				name: 'amount',
				type: 'uint256',
				indexed: false
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Repay',
		inputs: [
			{
				name: 'payer',
				type: 'address',
				indexed: true
			},
			{
				name: 'amount',
				type: 'uint256',
				indexed: false
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Split',
		inputs: [
			{
				name: 'token',
				type: 'address',
				indexed: true
			},
			{
				name: 'amount',
				type: 'uint256',
				indexed: false
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'ClaimIncentive',
		inputs: [
			{
				name: 'asset',
				type: 'address',
				indexed: true
			},
			{
				name: 'incentive',
				type: 'address',
				indexed: true
			},
			{
				name: 'claimer',
				type: 'address',
				indexed: true
			},
			{
				name: 'amount',
				type: 'uint256',
				indexed: false
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'RefundIncentive',
		inputs: [
			{
				name: 'asset',
				type: 'address',
				indexed: true
			},
			{
				name: 'incentive',
				type: 'address',
				indexed: true
			},
			{
				name: 'depositor',
				type: 'address',
				indexed: true
			},
			{
				name: 'amount',
				type: 'uint256',
				indexed: false
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'SetPeriod',
		inputs: [
			{
				name: 'period',
				type: 'uint256',
				indexed: true
			},
			{
				name: 'begin',
				type: 'uint256',
				indexed: false
			},
			{
				name: 'end',
				type: 'uint256',
				indexed: false
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Winners',
		inputs: [
			{
				name: 'winners',
				type: 'address[]',
				indexed: false
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'PendingManagement',
		inputs: [
			{
				name: 'management',
				type: 'address',
				indexed: true
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'SetManagement',
		inputs: [
			{
				name: 'management',
				type: 'address',
				indexed: true
			}
		],
		anonymous: false
	},
	{
		type: 'constructor',
		stateMutability: 'nonpayable',
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
		]
	},
	{
		type: 'function',
		name: 'incentivize',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_asset',
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
		outputs: []
	},
	{
		type: 'function',
		name: 'deposit',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_asset',
				type: 'address'
			},
			{
				name: '_amount',
				type: 'uint256'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'deposit',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_asset',
				type: 'address'
			},
			{
				name: '_amount',
				type: 'uint256'
			},
			{
				name: '_vote',
				type: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'deposit',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_asset',
				type: 'address'
			},
			{
				name: '_amount',
				type: 'uint256'
			},
			{
				name: '_vote',
				type: 'address'
			},
			{
				name: '_account',
				type: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'votes',
		stateMutability: 'view',
		inputs: [
			{
				name: '_asset',
				type: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'bool'
			},
			{
				name: '',
				type: 'uint256'
			},
			{
				name: '',
				type: 'address'
			}
		]
	},
	{
		type: 'function',
		name: 'claimable',
		stateMutability: 'view',
		inputs: [
			{
				name: '_account',
				type: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'claim',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_amount',
				type: 'uint256'
			}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'claim',
		stateMutability: 'nonpayable',
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
		outputs: []
	},
	{
		type: 'function',
		name: 'repay',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_amount',
				type: 'uint256'
			}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'split',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_token',
				type: 'address'
			},
			{
				name: '_amount',
				type: 'uint256'
			}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'claimable_incentive',
		stateMutability: 'view',
		inputs: [
			{
				name: '_asset',
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
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'claim_incentive',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_asset',
				type: 'address'
			},
			{
				name: '_incentive',
				type: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'claim_incentive',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_asset',
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
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'refund_incentive',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_asset',
				type: 'address'
			},
			{
				name: '_incentive',
				type: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'refund_incentive',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_asset',
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
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'num_winners',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'set_incentive_period',
		stateMutability: 'nonpayable',
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
		outputs: []
	},
	{
		type: 'function',
		name: 'set_deposit_period',
		stateMutability: 'nonpayable',
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
		outputs: []
	},
	{
		type: 'function',
		name: 'set_lock_end',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_end',
				type: 'uint256'
			}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'set_rate_provider',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_asset',
				type: 'address'
			},
			{
				name: '_provider',
				type: 'address'
			},
			{
				name: '_enabled',
				type: 'bool'
			}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'declare_winners',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_winners',
				type: 'address[]'
			}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'allow_repay',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_account',
				type: 'address'
			},
			{
				name: '_allow',
				type: 'bool'
			}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'set_management',
		stateMutability: 'nonpayable',
		inputs: [
			{
				name: '_management',
				type: 'address'
			}
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'accept_management',
		stateMutability: 'nonpayable',
		inputs: [],
		outputs: []
	},
	{
		type: 'function',
		name: 'token',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address'
			}
		]
	},
	{
		type: 'function',
		name: 'staking',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address'
			}
		]
	},
	{
		type: 'function',
		name: 'treasury',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address'
			}
		]
	},
	{
		type: 'function',
		name: 'pol',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address'
			}
		]
	},
	{
		type: 'function',
		name: 'management',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address'
			}
		]
	},
	{
		type: 'function',
		name: 'pending_management',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address'
			}
		]
	},
	{
		type: 'function',
		name: 'repay_allowed',
		stateMutability: 'view',
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'bool'
			}
		]
	},
	{
		type: 'function',
		name: 'debt',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'deposited',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'deposits',
		stateMutability: 'view',
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'incentives',
		stateMutability: 'view',
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
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'incentive_depositors',
		stateMutability: 'view',
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
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'packed_votes',
		stateMutability: 'view',
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'winners_list',
		stateMutability: 'view',
		inputs: [
			{
				name: 'arg0',
				type: 'uint256'
			}
		],
		outputs: [
			{
				name: '',
				type: 'address'
			}
		]
	},
	{
		type: 'function',
		name: 'winners',
		stateMutability: 'view',
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'bool'
			}
		]
	},
	{
		type: 'function',
		name: 'claimed',
		stateMutability: 'view',
		inputs: [
			{
				name: 'arg0',
				type: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'incentive_claimed',
		stateMutability: 'view',
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
		outputs: [
			{
				name: '',
				type: 'bool'
			}
		]
	},
	{
		type: 'function',
		name: 'incentive_begin',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'incentive_end',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'deposit_begin',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'deposit_end',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		type: 'function',
		name: 'lock_end',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256'
			}
		]
	}
] as const;
export default BOOTSTRAP_ABI_NEW;
