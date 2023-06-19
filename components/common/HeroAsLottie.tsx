import React from 'react';
import Lottie from 'react-lottie';

import animationData from '../../public/tokens_animation.json';

import type {ReactElement} from 'react';

function HeroAsLottie(): ReactElement {
	const defaultOptions = {
		loop: true,
		autoplay: true,
		animationData: animationData,
		rendererSettings: {
			preserveAspectRatio: 'xMidYMid slice'
		}
	};

	return (

		<div className={'pointer-events-none'}>
			<Lottie
				options={defaultOptions}
				height={420}
				width={420}
			/>
		</div>
	);
}

export default HeroAsLottie;
