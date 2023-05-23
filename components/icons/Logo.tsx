import React from 'react';

import type {ReactElement} from 'react';

function	Logo(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			viewBox={'0 0 136 136'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				fillRule={'evenodd'}
				clipRule={'evenodd'}
				d={'M34.9653 77.5546L68.0419 123.708L101.144 77.5546L68.0419 96.9053L34.9653 77.5546Z'}
				fill={'currentColor'}/>
			<path
				fillRule={'evenodd'}
				clipRule={'evenodd'}
				d={'M35.8251 23.1897L29.75 29.3795L44.5738 44.4805L59.3976 59.5816V73.6382V85.6842L68.0359 90.6706L76.6743 85.6842V73.6382V59.5816L91.4621 44.5172L106.25 29.4527L100.137 23.2308L94.0241 17.0089L81.11 30.1293C74.0072 37.3455 68.1254 43.2496 68.0393 43.2496C67.9531 43.2496 62.0631 37.3434 54.9503 30.1248C47.8375 22.9062 41.9914 17 41.959 17C41.9265 17 39.1662 19.7854 35.8251 23.1897Z'}
				fill={'currentColor'}/>
			<path d={'M75.2084 28.7723C72.8193 31.1945 70.4269 33.6136 68.0249 36.0231C65.6293 33.6226 63.2433 31.2125 60.8605 28.7994L68.0419 17L75.2084 28.7723Z'} fill={'currentColor'}/>
			<path d={'M90.1021 53.2378L81.8091 61.6858V82.6507L101.126 71.3459L90.1021 53.2378Z'} fill={'currentColor'}/>
			<path d={'M54.2378 82.6274V61.6858L45.9706 53.2639L34.9653 71.3459L54.2378 82.6274Z'} fill={'currentColor'}/>
		</svg>
	);
}

export default Logo;

