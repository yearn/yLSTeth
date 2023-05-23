import React, {useCallback, useState} from 'react';
import AddressInput from 'components/common/AddressInput';
import useBootstrap from 'contexts/useBootstrap';
import {isZeroAddress} from '@yearn-finance/web-lib/utils/address';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {ReactElement} from 'react';
import type {TAddress} from '@yearn-finance/web-lib/types';

type TProtocolTokenViewProps = {
	onProceed: (args: {hasApplied: boolean, isWhitelisted: boolean}) => void
};
function	ProtocolTokenView({onProceed}: TProtocolTokenViewProps): ReactElement {
	const	{selectedToken, set_selectedToken, updateApplicationStatus} = useBootstrap();
	const	[tokenReceiver, set_tokenReceiver] = useState('');
	const	[hasBeenConfirmed, set_hasBeenConfirmed] = useState(false);

	const onConfirm = useCallback(async (newReceiver: TAddress): Promise<void> => {
		performBatchedUpdates((): void => {
			set_selectedToken(newReceiver);
			set_tokenReceiver(newReceiver);
			set_hasBeenConfirmed(true);
		});
		const {data, isSuccess} = await updateApplicationStatus();
		const [applied, whitelisted] = data || [];
		const hasValidInput = isSuccess && !isZeroAddress(newReceiver);
		const hasApplied = hasValidInput ? applied?.status === 'success' && applied?.result : false;
		const isWhitelisted = hasValidInput ? whitelisted?.status === 'success' && whitelisted?.result : false;
		onProceed({hasApplied, isWhitelisted});
	}, [onProceed, set_selectedToken, updateApplicationStatus]);

	return (
		<section>
			<div className={'box-0 grid w-full grid-cols-12 overflow-hidden'}>
				<div className={'col-span-12 flex flex-col p-4 text-neutral-900 md:p-6'}>
					<div className={'w-full md:w-3/4'}>
						<b>{'What\'s your LSD'}</b>
						<p className={'text-sm text-neutral-500'}>
							{'As a LSD protocol apply to be whitelisted for potential inclusion into the yETH pool. Indicate the address of the token you want to whitelist.'}
						</p>
					</div>
					<AddressInput
						value={tokenReceiver as TAddress}
						onChangeValue={set_tokenReceiver}
						shouldBeDisabled={hasBeenConfirmed && tokenReceiver === selectedToken}
						onConfirm={onConfirm} />
				</div>
			</div>
		</section>
	);
}

export default ProtocolTokenView;
