/* eslint-disable @typescript-eslint/explicit-function-return-type */
const withPWA = require('next-pwa')({
	dest: 'public',
	disable: process.env.NODE_ENV !== 'production'
});
const withTM = require('next-transpile-modules')(['@yearn-finance/web-lib'], {resolveSymlinks: false});
const {PHASE_EXPORT} = require('next/constants');

module.exports = (phase) => withTM(withPWA({
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
				destination: 'https://yearnfinance.typeform.com/yeth-test-wl',
				permanent: true
			},
			{
				source: '/documentation',
				destination: 'https://hackmd.io/Dx76wacMQa2Xp908s0aRbA',
				permanent: true
			},
			{
				source: '/support',
				destination: 'https://t.me/+7KdEG8g_Xn01ZjU0',
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
		YDAEMON_BASE_URI: 'https://ydaemon.ycorpo.com',
		BASE_CHAINID: 42161, // Expected to work on this chain
		DEFAULT_CHAINID: 42161, // The one we currently use
		YETH_ADDRESS: '0xcC7D64D4143CBc1CB9B6299680D4AD84f94268b2',
		STYETH_ADDRESS: '0x3A7056a100222968E7EeFdfCa0389257fbB9bf7c',
		BOOTSTRAP_ADDRESS: '0x17Ab6Ea4618c82b4ae52A239c2AEbb145915cd32',
		INIT_BLOCK_NUMBER: 104072789,
		CURRENT_PHASE: 'voting', // 'whitelisting' | 'bootstrapping' | 'voting' | 'launching',
		WHITELISTED_PROTOCOLS: []
	}
}));
