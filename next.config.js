/* eslint-disable @typescript-eslint/explicit-function-return-type */
const withPWA = require('next-pwa')({
	dest: 'public',
	disable: process.env.NODE_ENV !== 'production'
});
const {PHASE_EXPORT} = require('next/constants');

module.exports = (phase) => withPWA({
	assetPrefix: process.env.IPFS_BUILD === 'true' || phase === PHASE_EXPORT ? './' : '/',
	images: {
		unoptimized: process.env.IPFS_BUILD === 'true' || phase === PHASE_EXPORT,
		domains: [
			'raw.githubusercontent.com',
			'assets.smold.app'
		]
	},
	redirects() {
		return [
			{
				source: '/github',
				destination: 'https://github.com/yearn/yLSTeth',
				permanent: true
			},
			{
				source: '/form',
				destination: 'https://yearnfinance.typeform.com/apply-for-yeth',
				permanent: true
			},
			{
				source: '/documentation',
				destination: 'https://hackmd.io/Dx76wacMQa2Xp908s0aRbA',
				permanent: true
			},
			{
				source: '/favicon.ico',
				destination: 'https://gib.to/favicons/favicon.ico',
				permanent: true
			}
		];
	},
	env: {
		JSON_RPC_URL: {
			1: 'https://eth.llamarpc.com' || process.env.RPC_URL_MAINNET,
			10: process.env.RPC_URL_OPTIMISM,
			250: 'https://rpc3.fantom.network' || process.env.RPC_URL_FANTOM,
			42161: process.env.RPC_URL_ARBITRUM
		},
		TELEGRAM_BOT: process.env.TELEGRAM_BOT,
		TELEGRAM_CHAT: process.env.TELEGRAM_CHAT,
		ALCHEMY_KEY: process.env.ALCHEMY_KEY,
		INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
		WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID,
		YDAEMON_BASE_URI: 'https://ydaemon.yearn.fi',
		BASE_CHAIN_ID: 1, // Expected to work on this chain
		DEFAULT_CHAIN_ID: 1337, // The one we currently use

		YETH_ADDRESS: '0x1BED97CBC3c24A4fb5C069C6E311a967386131f7',
		STYETH_ADDRESS: '0x583019fF0f430721aDa9cfb4fac8F06cA104d0B4',
		POL_ADDRESS: '0x929401e30Aab6bd648dEf2d30FF44952BaB04478',
		BOOTSTRAP_ADDRESS: '0x41B994C192183793bB9cc35bAAb8bD9C6885c6bf',
		ESTIMATOR_ADDRESS: '0x6484EB0792c646A4827638Fc1B6F20461418eB00',
		POOL_ADDRESS: '0x1757a98c1333B9dc8D408b194B2279b5AFDF70Cc',
		ZAP_ADDRESS: '0xde79380FBd39e08150adAA5C6c9dE3146f53029e',

		BOOTSTRAP_INIT_BLOCK_NUMBER: 17_591_810,
		INIT_BLOCK_NUMBER: 18_000_598,
		RANGE_LIMIT: 10_000,
		PERIODS: {
			WHITELIST_BEGIN: '1688126400',
			WHITELIST_END: '1689940800',
			INCENTIVE_BEGIN: '1689336000',
			INCENTIVE_END: '1690545600',
			DEPOSIT_BEGIN: '1689336000',
			DEPOSIT_END: '1690804800',
			VOTE_BEGIN: '1690545600',
			VOTE_END: '1691150400'
		},
		WHITELISTED_PROTOCOLS: []
	}
});
