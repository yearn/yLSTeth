import {LogoYearn} from 'app/components/icons/LogoYearn';
import {ImageWithFallback} from '@yearn-finance/web-lib/components/ImageWithFallback';
import {YCRV_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';

export const APPS = {
	Vaults: {
		name: 'Vaults',
		href: 'https://yearn.fi/vaults',
		icon: (
			<LogoYearn
				className={'size-8'}
				back={'text-[#f472b6]'}
				front={'text-white'}
			/>
		)
	},
	yCRV: {
		name: 'yCRV',
		href: 'https://yearn.fi/ycrv',
		icon: (
			<ImageWithFallback
				alt={'yCRV'}
				className={'size-8'}
				width={64}
				height={64}
				src={`${process.env.SMOL_ASSETS_URL}/token/1/${YCRV_TOKEN_ADDRESS}/logo-128.png`}
				loading={'eager'}
				priority
			/>
		)
	},
	veYFI: {
		name: 'veYFI',
		href: 'https://yearn.fi/veyfi',
		icon: (
			<LogoYearn
				className={'size-8'}
				back={'text-[#0657F9]'}
				front={'text-white'}
			/>
		)
	},
	yBribe: {
		name: 'yBribe',
		href: '/',
		icon: (
			<LogoYearn
				className={'size-8'}
				back={'text-neutral-900'}
				front={'text-neutral-0'}
			/>
		)
	},
	yETH: {
		name: 'yETH',
		href: 'https://yeth.yearn.fi',
		icon: (
			<ImageWithFallback
				alt={'yETH'}
				className={'size-8'}
				width={64}
				height={64}
				src={`${process.env.SMOL_ASSETS_URL}/token/1/0x1BED97CBC3c24A4fb5C069C6E311a967386131f7/logo-128.png`}
				loading={'eager'}
				priority
			/>
		)
	},
	yPrisma: {
		name: 'yPrisma',
		href: 'https://yprisma.yearn.fi',
		icon: (
			<ImageWithFallback
				priority
				src={`${process.env.SMOL_ASSETS_URL}/token/1/0xe3668873d944e4a949da05fc8bde419eff543882/logo-128.png`}
				className={'size-8'}
				width={64}
				height={64}
				alt={'yPrisma'}
			/>
		)
	}
};
