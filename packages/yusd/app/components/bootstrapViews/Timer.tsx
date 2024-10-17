import {useTimer} from '@libHooks/useTimer';

import type {ReactElement} from 'react';

export function Timer(props: {endTime: number; status: 'ended' | 'started' | 'none'}): ReactElement {
	const time = useTimer({endTime: props.endTime});

	return (
		<b
			suppressHydrationWarning
			className={'font-number text-accent mt-2 text-3xl leading-10'}>
			{props.status === 'ended' ? 'closed' : props.status === 'none' ? 'Soon' : `Ends in ${time}`}
		</b>
	);
}
