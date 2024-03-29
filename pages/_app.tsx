import React from 'react';
import localFont from 'next/font/local';
import {useRouter} from 'next/router';
import AppHeader from 'app/components/common/Header';
import {BootstrapContextApp} from 'app/contexts/useBootstrap';
import {LSTContextApp} from 'app/contexts/useLST';
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
			<div className={'block size-full min-h-max w-screen'}>
				<AppHeader />
				<div className={'mx-auto my-0 pt-4 md:mb-0 md:!px-0'}>
					<AnimatePresence mode={'wait'}>
						<motion.div
							key={router.asPath}
							initial={'initial'}
							animate={'enter'}
							exit={'exit'}
							className={'my-0 size-full md:mb-0'}
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
				tokenLists={[
					'https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/yearn.json',
					'https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/smolAssets.json'
				]}>
				<WalletContextApp>
					<BootstrapContextApp>
						<LSTContextApp>
							<main className={cl('flex flex-col mb-32', aeonik.className)}>
								<AppWrapper {...props} />
							</main>
						</LSTContextApp>
					</BootstrapContextApp>
				</WalletContextApp>
			</WithMom>
		</>
	);
}

export default MyApp;
