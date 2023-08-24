import React from 'react';
import localFont from 'next/font/local';
import AppWrapper from 'components/common/AppWrapper';
import {LSTContextApp} from 'contexts/useLST';
import {TokenListContextApp} from 'contexts/useTokenList';
import {WalletContextApp} from 'contexts/useWallet';
import {WithYearn} from '@yearn-finance/web-lib/contexts/WithYearn';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {localhost} from '@yearn-finance/web-lib/utils/wagmi/networks';

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
			<style jsx global>{`html {font-family: ${aeonik.style.fontFamily};}`}</style>
			<WithYearn supportedChains={[localhost]}>
				<LSTContextApp>
					<TokenListContextApp>
						<WalletContextApp>
							<main className={cl('flex flex-col', aeonik.className)}>
								<AppWrapper {...props} />
							</main>
						</WalletContextApp>
					</TokenListContextApp>
				</LSTContextApp>
			</WithYearn>
		</>
	);
}

export default MyApp;
