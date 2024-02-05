import React from 'react';
import localFont from 'next/font/local';
import {useRouter} from 'next/router';
import AppHeader from 'components/common/Header';
import {BootstrapContextApp} from 'contexts/useBootstrap';
import {LSTContextApp} from 'contexts/useLST';
import {arbitrum, base, fantom, optimism, polygon} from 'viem/chains';
import {AnimatePresence, motion} from 'framer-motion';
import {WalletContextApp} from '@builtbymom/web3/contexts/useWallet';
import {WithMom} from '@builtbymom/web3/contexts/WithMom';
import {cl} from '@builtbymom/web3/utils/cl';
import {motionVariants} from '@builtbymom/web3/utils/helpers';
import {localhost} from '@builtbymom/web3/utils/wagmi';
import {mainnet} from '@wagmi/chains';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '../style.css';

const aeonik = localFont({
	variable: '--font-aeonik',
	display: 'swap',
	src: [
		{
			path: '../public/fonts/Aeonik-Regular.woff2',
			weight: '400',
			style: 'normal'
		},
		{
			path: '../public/fonts/Aeonik-Bold.woff2',
			weight: '700',
			style: 'normal'
		},
		{
			path: '../public/fonts/Aeonik-Black.ttf',
			weight: '900',
			style: 'normal'
		}
	]
});

function AppWrapper(props: AppProps): ReactElement {
	const router = useRouter();
	const {Component, pageProps} = props;

	return (
		<div
			id={'app'}
			className={cl('mx-auto mb-0 flex font-aeonik')}>
			<div className={'size-full block min-h-max'}>
				<AppHeader />
				<div className={'mx-auto my-0 max-w-6xl pt-4 md:mb-0 md:mt-16 md:!px-0'}>
					<AnimatePresence mode={'wait'}>
						<motion.div
							key={router.asPath}
							initial={'initial'}
							animate={'enter'}
							exit={'exit'}
							className={'my-0 h-full md:mb-0 md:mt-16'}
							variants={motionVariants}>
							<Component
								router={props.router}
								{...pageProps}
							/>
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}

function MyApp(props: AppProps): ReactElement {
	return (
		<>
			<style
				jsx
				global>{`
				html {
					font-family: ${aeonik.style.fontFamily};
				}
			`}</style>
			<WithMom
				supportedChains={[mainnet, optimism, polygon, fantom, base, arbitrum, localhost]}
				tokenLists={['https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/yearn.json']}>
				<WalletContextApp>
					<BootstrapContextApp>
						<LSTContextApp>
							<WalletContextApp>
								<main className={cl('flex flex-col mb-32', aeonik.className)}>
									<AppWrapper {...props} />
								</main>
							</WalletContextApp>
						</LSTContextApp>
					</BootstrapContextApp>
				</WalletContextApp>
			</WithMom>
		</>
	);
}

export default MyApp;
