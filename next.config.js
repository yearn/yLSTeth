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
				destination: 'https://github.com/Majorfi/yEth',
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
		BASE_CHAINID: 250, // Expected to work on this chain
		DEFAULT_CHAINID: 250, // The one we currently use
		BASE_API_URI: 'http://localhost:8080',
		YETH_ADDRESS: '0x0c75df7454d7594BbEBE09fD0CE0114c882b046d',
		STYETH_ADDRESS: '0xDd27AC6041901daFA1a9674f80034F7693Bab9C0',
		BOOTSTRAP_ADDRESS: '0xd780324493CFf48fC61098cc989d32a0F0670C43'
	}
}));
