/* eslint-disable @typescript-eslint/explicit-function-return-type */
const withPWA = require('next-pwa')({
	dest: 'public',
	disable: process.env.NODE_ENV !== 'production'
});
const {PHASE_EXPORT} = require('next/constants');

module.exports = phase =>
	withPWA({
		experimental: {
			externalDir: true
		},
		transpilePackages: ['lib'],
		assetPrefix: process.env.IPFS_BUILD === 'true' || phase === PHASE_EXPORT ? './' : '/',
		images: {
			unoptimized: process.env.IPFS_BUILD === 'true' || phase === PHASE_EXPORT,
			domains: ['raw.githubusercontent.com', 'assets.smold.app']
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
					destination: 'https://forms.gle/WUk2ASoFUpFXjQk57',
					permanent: true
				},
				{
					source: '/documentation',
					destination: 'https://hackmd.io/Dx76wacMQa2Xp908s0aRbA',
					permanent: true
				},
				{
					source: '/favicon.ico',
					destination: 'https://ypools.yearn.fi/favicons/favicon.ico',
					permanent: true
				}
			];
		},
		env: {
			JSON_RPC_URL: {
				1: process.env.RPC_URL_MAINNET
			},
			ALCHEMY_KEY: process.env.ALCHEMY_KEY,
			INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
			WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID,
			YDAEMON_BASE_URI: 'https://ydaemon.yearn.fi',
			SMOL_ASSETS_URL: 'https://assets.smold.app/api',
			DEFAULT_CHAIN_ID: 1, // The one we currently use

			YUSD_ADDRESS: '0x1BED97CBC3c24A4fb5C069C6E311a967386131f7',
			STYUSD_ADDRESS: '0x583019fF0f430721aDa9cfb4fac8F06cA104d0B4',
			POL_ADDRESS: '0x929401e30Aab6bd648dEf2d30FF44952BaB04478',
			BOOTSTRAP_ADDRESS: '0x7cf484D9d16BA26aB3bCdc8EC4a73aC50136d491',
			VOTE_ADDRESS: '0xAE9De8A3e62e8E2f1e3800d142D23527680a5179',
			ESTIMATOR_ADDRESS: '0x6Cc6Af51091e29c288d6fb44b7e1C73e946555c8',
			POOL_ADDRESS: '0x2cced4ffA804ADbe1269cDFc22D7904471aBdE63',
			ZAP_ADDRESS: '0x7DeD4df8d8a663b8Af5933058356B367b5DE8f23',
			CURVE_YUSD_POOL_ADDRESS: '0x69accb968b19a53790f43e57558f5e443a91af22',
			CURVE_SWAP_ADDRESS: '0x99a58482BD75cbab83b27EC03CA68fF489b5788f',

			ONCHAIN_GOV_ADDRESS: '0xB7a528CF6D36F736Fa678A629b98A427d43E5ba5',
			VOTE_POWER_ADDRESS: '0x52574a10ce418AFeF388e39cea61643d33dbA81D',

			BASKET_ADDRESS: '0x2cced4ffA804ADbe1269cDFc22D7904471aBdE63', // Address of the yUSD basket
			WEIGHT_VOTE_ADDRESS: '0xD68696Fdd9649bFfB18e88E1b671B896825f2e50',
			INCLUSION_VOTE_ADDRESS: '0x6bc0878939669339e82dbFa13d260c89230f2c31',
			WEIGHT_INCENTIVES_ADDRESS: '0x86F524bdBa583b7bEcC2C48EcB5bE366B4A788F7',
			INCLUSION_INCENTIVES_ADDRESS: '0x70557705DC49D7Dc383356b27Bc206f1018D1bC2',

			RANGE_LIMIT: 1_000,

			PERIODS: {
				INCENTIVE_BEGIN: '1689336000',
				INCENTIVE_END: '1690545600',
				DEPOSIT_BEGIN: '1689336000',
				DEPOSIT_END: '1690804800',
				VOTE_BEGIN: '1690545600',
				VOTE_END: '1691150400'
			}
		}
	});
