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
				destination: 'https://yearnfinance.typeform.com/apply-for-yeth',
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
		WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID,
		YDAEMON_BASE_URI: 'https://ydaemon.yearn.finance',
		BASE_CHAINID: 1, // Expected to work on this chain
		DEFAULT_CHAINID: 1, // The one we currently use
		YETH_ADDRESS: '0x1BED97CBC3c24A4fb5C069C6E311a967386131f7',
		STYETH_ADDRESS: '0x11a2b400Fc864a70D42675b85cEE644458383BD9',
		POL_ADDRESS: '0x929401e30Aab6bd648dEf2d30FF44952BaB04478',
		BOOTSTRAP_ADDRESS: '0x0c80CF2BF3E9F7307C8321f272315762A7B74098',
		INIT_BLOCK_NUMBER: 17_591_810,
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
}));
