import React from 'react';

import type {ChangeEventHandler, ReactElement} from 'react';
import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

function InputBox({
	token,
	amountToSend,
	onChange,
	max
}: {
	token: TToken;
	amountToSend: TNormalizedBN;
	onChange: ChangeEventHandler<HTMLInputElement>;
	max: number;
}): ReactElement {
	return (
		<label
			htmlFor={'amountToSend'}
			className={'mx-auto w-full cursor-text rounded bg-neutral-100 py-10'}>
			<input
				key={token?.address}
				id={'amountToSend'}
				className={
					'scrollbar-none h-auto w-full overflow-x-scroll border-none bg-transparent p-0 text-center text-5xl font-bold tabular-nums outline-none'
				}
				type={'number'}
				min={0}
				maxLength={20}
				max={max}
				step={1 / 10 ** (token.decimals || 18)}
				inputMode={'numeric'}
				placeholder={'0'}
				pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
				value={amountToSend?.normalized ?? '0'}
				onChange={onChange}
			/>
		</label>
	);
}

export default InputBox;
