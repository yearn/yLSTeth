import {cl} from '@builtbymom/web3/utils';

import type {ReactElement} from 'react';

export default function IconSwapSVG({className}: {className?: string}): ReactElement {
	return (
		<svg
			className={cl('group fill-white text-accent hover:!fill-accent hover:text-accent', className)}
			style={{fill: 'white'}}
			width={'48'}
			height={'48'}
			viewBox={'0 0 48 48'}
			fill={'currentColor'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<g id={'Group 3528'}>
				<rect
					className={'group-hover:fill-accent'}
					id={'Rectangle 579'}
					x={'0.5'}
					y={'0.5'}
					width={'47'}
					height={'47'}
					rx={'3.5'}
					stroke={'currentcolor'}
				/>
				<path
					className={'group-hover:fill-neutral-100'}
					id={'Arrow 1'}
					d={
						'M19 12C19 11.4477 18.5523 11 18 11C17.4477 11 17 11.4477 17 12L19 12ZM17.2929 36.7071C17.6834 37.0976 18.3166 37.0976 18.7071 36.7071L25.0711 30.3431C25.4616 29.9526 25.4616 29.3195 25.0711 28.9289C24.6805 28.5384 24.0474 28.5384 23.6569 28.9289L18 34.5858L12.3431 28.9289C11.9526 28.5384 11.3195 28.5384 10.9289 28.9289C10.5384 29.3195 10.5384 29.9526 10.9289 30.3431L17.2929 36.7071ZM17 12L17 36L19 36L19 12L17 12Z'
					}
					fill={'currentcolor'}
				/>
				<path
					className={'group-hover:fill-neutral-100'}
					id={'Arrow 2'}
					d={
						'M29 36C29 36.5523 29.4477 37 30 37C30.5523 37 31 36.5523 31 36L29 36ZM30.7071 11.2929C30.3166 10.9024 29.6834 10.9024 29.2929 11.2929L22.9289 17.6569C22.5384 18.0474 22.5384 18.6805 22.9289 19.0711C23.3195 19.4616 23.9526 19.4616 24.3431 19.0711L30 13.4142L35.6569 19.0711C36.0474 19.4616 36.6805 19.4616 37.0711 19.0711C37.4616 18.6805 37.4616 18.0474 37.0711 17.6569L30.7071 11.2929ZM31 36L31 12L29 12L29 36L31 36Z'
					}
					fill={'currentcolor'}
				/>
			</g>
		</svg>
	);
}
