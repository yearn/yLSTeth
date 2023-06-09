import React from 'react';
import AppWrapper from 'components/common/AppWrapper';
import {BootstrapContextApp} from 'contexts/useBootstrap';
import {PriceContextApp} from 'contexts/usePrices';
import {TokenListContextApp} from 'contexts/useTokenList';
import {WalletContextApp} from 'contexts/useWallet';
import config from 'utils/wagmiConfig';
import localFont from '@next/font/local';
import {WithYearn} from '@yearn-finance/web-lib/contexts/WithYearn';
import {cl} from '@yearn-finance/web-lib/utils/cl';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import	'../style.css';

const aeonik = localFont({
	variable: '--font-aeonik',
	display: 'swap',
	src: [
		{
			path: '../public/fonts/Aeonik-Regular.woff2',
			weight: '400',
			style: 'normal'
		}, {
			path: '../public/fonts/Aeonik-Bold.woff2',
			weight: '700',
			style: 'normal'
		}
	]
});

function	MyApp(props: AppProps): ReactElement {
	return (
		<>
			<style jsx global>{'html {font-family: Aeonik;}'}</style>
			<WithYearn
				configOverwrite={config}
				options={{
					web3: {
						supportedChainID: [1, 250, 1337]
					}
				}}>
				<PriceContextApp>
					<BootstrapContextApp>
						<TokenListContextApp>
							<WalletContextApp>
								<main className={cl('flex h-screen flex-col', aeonik.className)}>
									<AppWrapper {...props} />
								</main>
							</WalletContextApp>
						</TokenListContextApp>
					</BootstrapContextApp>
				</PriceContextApp>
			</WithYearn>
		</>
	);
}

export default MyApp;
