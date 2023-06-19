import React from 'react';
import Header from 'components/common/Header';
import Meta from 'components/common/Meta';
import {AnimatePresence, motion} from 'framer-motion';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';


const transition = {duration: 0.3, ease: [0.17, 0.67, 0.83, 1], height: {duration: 0}};
const thumbnailVariants = {
	initial: {y: 20, opacity: 0, transition, height: 0},
	enter: {y: 0, opacity: 1, transition, height: 'auto'},
	exit: {y: -20, opacity: 1, transition, height: 'auto'}
};

function	AppWrapper(props: AppProps): ReactElement {
	const	{Component, pageProps, router} = props;

	return (
		<React.Fragment>
			<Meta />
			<Header />
			<div id={'app'}>
				<AnimatePresence mode={'wait'}>
					<motion.div
						key={router.pathname}
						initial={'initial'}
						animate={'enter'}
						exit={'exit'}
						variants={thumbnailVariants}>
						<Component
							key={router.pathname}
							router={props.router}
							{...pageProps} />
					</motion.div>
				</AnimatePresence>
			</div>
		</React.Fragment>
	);
}

export default AppWrapper;
