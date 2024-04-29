export const BASKET_ABI = [
	{
		anonymous: false,
		inputs: [
			{indexed: true, name: 'account', type: 'address'},
			{indexed: false, name: 'receiver', type: 'address'},
			{indexed: true, name: 'asset_in', type: 'uint256'},
			{indexed: true, name: 'asset_out', type: 'uint256'},
			{indexed: false, name: 'amount_in', type: 'uint256'},
			{indexed: false, name: 'amount_out', type: 'uint256'}
		],
		name: 'Swap',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{indexed: true, name: 'account', type: 'address'},
			{indexed: true, name: 'receiver', type: 'address'},
			{indexed: false, name: 'amounts_in', type: 'uint256[]'},
			{indexed: false, name: 'lp_amount', type: 'uint256'}
		],
		name: 'AddLiquidity',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{indexed: true, name: 'account', type: 'address'},
			{indexed: true, name: 'receiver', type: 'address'},
			{indexed: false, name: 'lp_amount', type: 'uint256'}
		],
		name: 'RemoveLiquidity',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{indexed: true, name: 'account', type: 'address'},
			{indexed: true, name: 'receiver', type: 'address'},
			{indexed: true, name: 'asset', type: 'uint256'},
			{indexed: false, name: 'amount_out', type: 'uint256'},
			{indexed: false, name: 'lp_amount', type: 'uint256'}
		],
		name: 'RemoveLiquiditySingle',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{indexed: true, name: 'asset', type: 'uint256'},
			{indexed: false, name: 'rate', type: 'uint256'}
		],
		name: 'RateUpdate',
		type: 'event'
	},
	{anonymous: false, inputs: [{indexed: true, name: 'account', type: 'address'}], name: 'Pause', type: 'event'},
	{anonymous: false, inputs: [{indexed: true, name: 'account', type: 'address'}], name: 'Unpause', type: 'event'},
	{anonymous: false, inputs: [], name: 'Kill', type: 'event'},
	{
		anonymous: false,
		inputs: [
			{indexed: false, name: 'index', type: 'uint256'},
			{indexed: false, name: 'asset', type: 'address'},
			{indexed: false, name: 'rate_provider', type: 'address'},
			{indexed: false, name: 'rate', type: 'uint256'},
			{indexed: false, name: 'weight', type: 'uint256'},
			{indexed: false, name: 'amount', type: 'uint256'}
		],
		name: 'AddAsset',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [{indexed: false, name: 'rate', type: 'uint256'}],
		name: 'SetSwapFeeRate',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{indexed: true, name: 'asset', type: 'uint256'},
			{indexed: false, name: 'lower', type: 'uint256'},
			{indexed: false, name: 'upper', type: 'uint256'}
		],
		name: 'SetWeightBand',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{indexed: false, name: 'asset', type: 'uint256'},
			{indexed: false, name: 'rate_provider', type: 'address'}
		],
		name: 'SetRateProvider',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{indexed: false, name: 'amplification', type: 'uint256'},
			{indexed: false, name: 'weights', type: 'uint256[]'},
			{indexed: false, name: 'duration', type: 'uint256'},
			{indexed: false, name: 'start', type: 'uint256'}
		],
		name: 'SetRamp',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [{indexed: false, name: 'ramp_step', type: 'uint256'}],
		name: 'SetRampStep',
		type: 'event'
	},
	{anonymous: false, inputs: [], name: 'StopRamp', type: 'event'},
	{anonymous: false, inputs: [{indexed: false, name: 'staking', type: 'address'}], name: 'SetStaking', type: 'event'},
	{
		anonymous: false,
		inputs: [{indexed: false, name: 'management', type: 'address'}],
		name: 'PendingManagement',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [{indexed: false, name: 'management', type: 'address'}],
		name: 'SetManagement',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{indexed: true, name: 'acount', type: 'address'},
			{indexed: false, name: 'guardian', type: 'address'}
		],
		name: 'SetGuardian',
		type: 'event'
	},
	{
		inputs: [
			{name: '_token', type: 'address'},
			{name: '_amplification', type: 'uint256'},
			{name: '_assets', type: 'address[]'},
			{name: '_rate_providers', type: 'address[]'},
			{name: '_weights', type: 'uint256[]'}
		],
		name: 'constructor',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'constructor'
	},
	{
		inputs: [
			{name: '_i', type: 'uint256'},
			{name: '_j', type: 'uint256'},
			{name: '_dx', type: 'uint256'},
			{name: '_min_dy', type: 'uint256'}
		],
		name: 'swap',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_i', type: 'uint256'},
			{name: '_j', type: 'uint256'},
			{name: '_dx', type: 'uint256'},
			{name: '_min_dy', type: 'uint256'},
			{name: '_receiver', type: 'address'}
		],
		name: 'swap',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_i', type: 'uint256'},
			{name: '_j', type: 'uint256'},
			{name: '_dy', type: 'uint256'},
			{name: '_max_dx', type: 'uint256'}
		],
		name: 'swap_exact_out',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_i', type: 'uint256'},
			{name: '_j', type: 'uint256'},
			{name: '_dy', type: 'uint256'},
			{name: '_max_dx', type: 'uint256'},
			{name: '_receiver', type: 'address'}
		],
		name: 'swap_exact_out',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_amounts', type: 'uint256[]'},
			{name: '_min_lp_amount', type: 'uint256'}
		],
		name: 'add_liquidity',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_amounts', type: 'uint256[]'},
			{name: '_min_lp_amount', type: 'uint256'},
			{name: '_receiver', type: 'address'}
		],
		name: 'add_liquidity',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_lp_amount', type: 'uint256'},
			{name: '_min_amounts', type: 'uint256[]'}
		],
		name: 'remove_liquidity',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_lp_amount', type: 'uint256'},
			{name: '_min_amounts', type: 'uint256[]'},
			{name: '_receiver', type: 'address'}
		],
		name: 'remove_liquidity',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_asset', type: 'uint256'},
			{name: '_lp_amount', type: 'uint256'},
			{name: '_min_amount', type: 'uint256'}
		],
		name: 'remove_liquidity_single',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_asset', type: 'uint256'},
			{name: '_lp_amount', type: 'uint256'},
			{name: '_min_amount', type: 'uint256'},
			{name: '_receiver', type: 'address'}
		],
		name: 'remove_liquidity_single',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{name: '_assets', type: 'uint256[]'}],
		name: 'update_rates',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'update_weights',
		outputs: [{name: '', type: 'bool'}],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'vb_prod_sum',
		outputs: [
			{name: '', type: 'uint256'},
			{name: '', type: 'uint256'}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{name: '_asset', type: 'uint256'}],
		name: 'virtual_balance',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{name: '_asset', type: 'uint256'}],
		name: 'rate',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{name: '_asset', type: 'uint256'}],
		name: 'weight',
		outputs: [
			{name: '', type: 'uint256'},
			{name: '', type: 'uint256'},
			{name: '', type: 'uint256'},
			{name: '', type: 'uint256'}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{name: '_asset', type: 'uint256'}],
		name: 'packed_weight',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{inputs: [], name: 'pause', outputs: [], stateMutability: 'nonpayable', type: 'function'},
	{inputs: [], name: 'unpause', outputs: [], stateMutability: 'nonpayable', type: 'function'},
	{inputs: [], name: 'kill', outputs: [], stateMutability: 'nonpayable', type: 'function'},
	{
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_rate_provider', type: 'address'},
			{name: '_weight', type: 'uint256'},
			{name: '_lower', type: 'uint256'},
			{name: '_upper', type: 'uint256'},
			{name: '_amount', type: 'uint256'},
			{name: '_amplification', type: 'uint256'},
			{name: '_min_lp_amount', type: 'uint256'}
		],
		name: 'add_asset',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_asset', type: 'address'},
			{name: '_rate_provider', type: 'address'},
			{name: '_weight', type: 'uint256'},
			{name: '_lower', type: 'uint256'},
			{name: '_upper', type: 'uint256'},
			{name: '_amount', type: 'uint256'},
			{name: '_amplification', type: 'uint256'},
			{name: '_min_lp_amount', type: 'uint256'},
			{name: '_receiver', type: 'address'}
		],
		name: 'add_asset',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_token', type: 'address'},
			{name: '_receiver', type: 'address'}
		],
		name: 'rescue',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_asset', type: 'uint256'},
			{name: '_receiver', type: 'address'}
		],
		name: 'skim',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{name: '_fee_rate', type: 'uint256'}],
		name: 'set_swap_fee_rate',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_assets', type: 'uint256[]'},
			{name: '_lower', type: 'uint256[]'},
			{name: '_upper', type: 'uint256[]'}
		],
		name: 'set_weight_bands',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_asset', type: 'uint256'},
			{name: '_rate_provider', type: 'address'}
		],
		name: 'set_rate_provider',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_amplification', type: 'uint256'},
			{name: '_weights', type: 'uint256[]'},
			{name: '_duration', type: 'uint256'}
		],
		name: 'set_ramp',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{name: '_amplification', type: 'uint256'},
			{name: '_weights', type: 'uint256[]'},
			{name: '_duration', type: 'uint256'},
			{name: '_start', type: 'uint256'}
		],
		name: 'set_ramp',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{name: '_ramp_step', type: 'uint256'}],
		name: 'set_ramp_step',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{inputs: [], name: 'stop_ramp', outputs: [], stateMutability: 'nonpayable', type: 'function'},
	{
		inputs: [{name: '_staking', type: 'address'}],
		name: 'set_staking',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{name: '_management', type: 'address'}],
		name: 'set_management',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{inputs: [], name: 'accept_management', outputs: [], stateMutability: 'nonpayable', type: 'function'},
	{
		inputs: [{name: '_guardian', type: 'address'}],
		name: 'set_guardian',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{inputs: [], name: 'token', outputs: [{name: '', type: 'address'}], stateMutability: 'view', type: 'function'},
	{inputs: [], name: 'supply', outputs: [{name: '', type: 'uint256'}], stateMutability: 'view', type: 'function'},
	{
		inputs: [],
		name: 'amplification',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{inputs: [], name: 'staking', outputs: [{name: '', type: 'address'}], stateMutability: 'view', type: 'function'},
	{inputs: [], name: 'num_assets', outputs: [{name: '', type: 'uint256'}], stateMutability: 'view', type: 'function'},
	{
		inputs: [{name: 'arg0', type: 'uint256'}],
		name: 'assets',
		outputs: [{name: '', type: 'address'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{name: 'arg0', type: 'uint256'}],
		name: 'rate_providers',
		outputs: [{name: '', type: 'address'}],
		stateMutability: 'view',
		type: 'function'
	},
	{inputs: [], name: 'management', outputs: [{name: '', type: 'address'}], stateMutability: 'view', type: 'function'},
	{
		inputs: [],
		name: 'pending_management',
		outputs: [{name: '', type: 'address'}],
		stateMutability: 'view',
		type: 'function'
	},
	{inputs: [], name: 'guardian', outputs: [{name: '', type: 'address'}], stateMutability: 'view', type: 'function'},
	{inputs: [], name: 'paused', outputs: [{name: '', type: 'bool'}], stateMutability: 'view', type: 'function'},
	{inputs: [], name: 'killed', outputs: [{name: '', type: 'bool'}], stateMutability: 'view', type: 'function'},
	{
		inputs: [],
		name: 'swap_fee_rate',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{inputs: [], name: 'ramp_step', outputs: [{name: '', type: 'uint256'}], stateMutability: 'view', type: 'function'},
	{
		inputs: [],
		name: 'ramp_last_time',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'ramp_stop_time',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'target_amplification',
		outputs: [{name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	}
] as const;
