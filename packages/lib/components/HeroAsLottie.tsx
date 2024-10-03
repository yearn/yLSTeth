import React from 'react';
import Lottie from 'react-lottie';

import bribeAnimationData from '../lotties/bribe_animation.json';
import launchAnimationData from '../lotties/launch_animation.json';
import tokenAnimationData from '../lotties/tokens_animation.json';
import votingAnimationData from '../lotties/voting_animation.json';

import type {ReactElement} from 'react';

function HeroAsLottie({id}: {id: string}): ReactElement {
	const animation =
		id === 'tokens'
			? tokenAnimationData
			: id === 'bribe'
				? bribeAnimationData
				: id === 'voting'
					? votingAnimationData
					: id === 'launch'
						? launchAnimationData
						: tokenAnimationData;
	const defaultOptions = {
		loop: true,
		autoplay: true,
		animationData: animation,
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
