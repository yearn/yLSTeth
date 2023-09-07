import {Switch} from '@headlessui/react';
import {cl} from '@yearn-finance/web-lib/utils/cl';

import type {ReactElement} from 'react';

export default function Toggle({isEnabled, onChange}: {
	isEnabled: boolean;
	onChange: (isEnabled: boolean) => void;
}): ReactElement {
	return (
		<Switch
			checked={isEnabled}
			onChange={onChange}
			className={cl(
				isEnabled ? 'bg-purple-300/20 border-purple-300' : 'bg-neutral-300 border-neutral-600',
				'relative h-4 w-8 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0 border-2 flex items-center mt-[1px]'
			)}
		>
			<span className={'sr-only'}>{'Use setting'}</span>
			<span
				aria-hidden={'true'}
				className={cl(
					isEnabled ? 'translate-x-5 -ml-0.5 bg-purple-300' : 'translate-x-0 ml-0.5 bg-neutral-600',
					'pointer-events-none inline-block h-[8px] w-[8px] transform rounded-full shadow ring-0 transition-all duration-200 ease-in-out'
				)}
			/>
		</Switch>
	);
}
