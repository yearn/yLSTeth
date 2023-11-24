import {LogoYearn} from 'components/icons/LogoYearn';
import {YETH_TOKEN} from 'utils/tokens';
import {YCRV_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';

import {ImageWithFallback} from './ImageWithFallback';

export const APPS = {
	Vaults: {
		name: 'Vaults',
		href: 'https://yearn.fi/vaults',
		icon: (
			<LogoYearn
				className={'h-8 w-8'}
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
				width={64}
				height={64}
				className={'h-8 w-8'}
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
				className={'h-8 w-8'}
				back={'text-[#0657F9]'}
				front={'text-white'}
			/>
		)
	},
	yBribe: {
		name: 'yBribe',
		href: 'https://yearn.fi/ybribe',
		icon: (
			<LogoYearn
				className={'h-8 w-8'}
				back={'text-neutral-900'}
				front={'text-neutral-0'}
			/>
		)
	},
	yETH: {
		name: 'yETH',
		href: '/',
		icon: (
			<ImageWithFallback
				alt={'yETH'}
				className={'h-8 w-8'}
				width={64}
				height={64}
				src={`${process.env.SMOL_ASSETS_URL}/token/1/${YETH_TOKEN.address}/logo-128.png`}
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
				className={'h-8 w-8'}
				src={`${process.env.SMOL_ASSETS_URL}/token/1/0xe3668873d944e4a949da05fc8bde419eff543882/logo-128.png`}
				width={64}
				height={64}
				alt={'yPrisma'}
			/>
		)
	}
};
