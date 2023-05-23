import React from 'react';
import {useRouter} from 'next/router';
import CardWithIcon from 'components/common/CardWithIcon';
import IconMenuGoals from 'components/icons/IconMenuGoals';
import IconWallet from '@yearn-finance/web-lib/icons/IconWallet';

import type {ReactElement} from 'react';


export enum	Step {
	ADDRESS = 'address',
	APPLY = 'apply',
	APPLIED = 'applied',
	WHITELISTED = 'whitelisted'
}

function	Home(): ReactElement {
	const router = useRouter();

	return (
		<div className={'mx-auto grid w-full max-w-4xl pb-96'}>
			<div className={'mb-10 mt-6 flex flex-col justify-center md:mt-20'}>
				<h1 className={'-ml-1 mt-4 whitespace-pre text-3xl tracking-tight text-neutral-900 md:mt-6 md:text-5xl'}>
					{'hello.\nlet’s talk LSDs.'}
				</h1>
				<b className={'mt-4 w-3/4 text-base leading-normal text-neutral-500 md:text-lg md:leading-8'}>
					{'yETH is a single token containing a basket of liquid staking derivatives, giving users the best risk adjusted staked ETH yields. '}
				</b>
			</div>

			<div className={'mt-10 grid grid-cols-2 gap-20'}>
				<CardWithIcon
					isSelected={false}
					onClick={async (): Promise<boolean> => router.push('/apply')}
					label={'“i’m a protocol that wants to whitelist my LSD to have it included in the yETH basket.”'}
					icon={<IconMenuGoals />} />
				<CardWithIcon
					isSelected={false}
					onClick={async (): Promise<boolean> => router.push('/apply')}
					label={'“i’d like to deposit for yETH and recieve incentives for voting on which LSDs will make up yETH.”'}
					icon={<IconWallet />} />
			</div>

		</div>
	);
}

export default function Wrapper(): ReactElement {
	return (<Home />);
}

