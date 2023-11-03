import React from 'react';
import Link from 'next/link';
import HeroAsLottie from 'components/common/HeroAsLottie';
import useWallet from 'contexts/useWallet';
import {useEpoch} from 'hooks/useEpoch';
import {useTimer} from 'hooks/useTimer';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {ReactElement} from 'react';

function Timer(): ReactElement {
	const {voteStart, endPeriod, hasVotingStarted} = useEpoch();
	const time = useTimer({endTime: hasVotingStarted ? Number(endPeriod) : Number(voteStart)});

	return (
		<b
			suppressHydrationWarning
			className={'font-number mt-2 text-4xl leading-10 text-purple-300'}>
			{hasVotingStarted ? `Open in ${time}` : `${time}`}
		</b>
	);
}


function Apply(): ReactElement {
	const {balances} = useWallet();
	return (
		<div className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col bg-neutral-0 pt-20'}>
			<div className={'relative mx-auto mt-6 w-screen max-w-5xl'}>
				<section className={'grid grid-cols-12 gap-0 px-4 pt-10 md:gap-20 md:pt-12'}>
					<div className={'col-span-12 md:col-span-6 md:mb-0'}>
						<div className={'mb-10 flex flex-col justify-center'}>
							<h1 className={'text-3xl font-black md:text-8xl'}>
								{'Apply'}
							</h1>
							<b suppressHydrationWarning className={'font-number mt-4 text-3xl text-purple-300 md:text-4xl'}>
								<Timer />
							</b>
						</div>

						<div className={'mb-8 text-neutral-700'}>
							<p>{'Want your LST to be included in yETH’s basket of tokens? You’ve come to the right place... the Application page. Good job so far. Here’s your next steps:'}</p>
							&nbsp;
							<ul className={'list-outside list-disc pl-4'}>
								<li className={'font-bold'}>
									{'Pay a non refundable 0.1-1 yETH fee (to prevent spam).'}
								</li>
								<li className={'font-bold'}>
									{'Fill in the form.'}
								</li>
								<li className={'font-bold'}>
									{'Wait for the Yearn rug detection unit to check your application.'}
								</li>
							</ul>
							&nbsp;
							<p>{'Applications are checked for obvious scams, but nothing further. Genuine applications will be able to incentivize st-yETH holders to vote their LST into yETH. Good luck!'}</p>
						</div>

						<div className={'flex w-full flex-row space-x-4'}>
							<div className={'flex w-[200px] flex-col'}>
								<p className={'mb-1 text-sm text-neutral-600'}>{'Application Fee'}</p>
								<div className={'flex h-10 items-center justify-start border border-neutral-400 px-2'}>
									{'0.1-1 yETH'}
								</div>
								<p className={'mt-1 text-xs text-neutral-600'}>
									{`You have: ${formatAmount(balances?.[toAddress(process.env.YETH_ADDRESS)]?.normalized || 0, 2, 6)} ETH`}
								</p>
							</div>
							<div className={'flex w-[200px] flex-col'}>
								<p className={'mb-1 text-sm text-neutral-600'}>
									&nbsp;
								</p>
								<Link
									href={'/form'}
									target={'_blank'}
									rel={'noopener noreferrer'}>
									<Button
										suppressHydrationWarning
										className={'yearn--button w-full rounded-md !text-sm md:w-[200px]'}>
										{'Take me to the form'}
									</Button>
								</Link>
								<p className={'mt-1 text-xs text-neutral-600'}>
								&nbsp;
								</p>
							</div>
						</div>
					</div>

					<div className={'relative col-span-12 hidden h-[100%] md:col-span-6 md:flex'}>
						<div className={'absolute inset-0 top-20 flex h-full w-full justify-center'}>
							<HeroAsLottie id={'tokens'} />
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

export default Apply;
