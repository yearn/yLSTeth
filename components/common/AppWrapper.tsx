import React from 'react';
import Header from 'components/common/Header';
import Meta from 'components/common/Meta';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

function	AppWrapper(props: AppProps): ReactElement {
	const	{Component, pageProps, router} = props;

	return (
		<React.Fragment>
			<Meta />
			<Header />
			<div id={'app'} className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col bg-neutral-0 pt-20'}>
				<Component
					key={router.pathname}
					router={props.router}
					{...pageProps} />
			</div>
		</React.Fragment>
	);
}

export default AppWrapper;
