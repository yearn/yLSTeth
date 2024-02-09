import React from 'react';
import {VoteCards} from 'app/components/views/Vote.Cards';
import {VoteHeader} from 'app/components/views/Vote.Header';

import type {ReactElement} from 'react';

function Vote(): ReactElement {
	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<VoteHeader />
				<VoteCards />
			</div>
		</section>
	);
}

export default Vote;
