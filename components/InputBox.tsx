import React from 'react';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {ChangeEventHandler, ReactElement} from 'react';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

function InputBox({
	token,
	amountToSend,
	onChange,
	max
}: {
	token: TTokenInfo;
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
					'h-auto w-full overflow-x-scroll border-none bg-transparent p-0 text-center text-5xl font-bold tabular-nums outline-none scrollbar-none'
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
