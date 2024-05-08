import React from 'react';

import type {ReactElement} from 'react';

function IconArrow(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			viewBox={'0 0 28 30'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				d={
					'M2 13C0.89543 13 -9.65645e-08 13.8954 0 15C9.65645e-08 16.1046 0.895431 17 2 17L2 13ZM27.4142 16.4142C28.1953 15.6332 28.1953 14.3668 27.4142 13.5858L14.6863 0.857863C13.9052 0.0768146 12.6389 0.0768147 11.8579 0.857864C11.0768 1.63891 11.0768 2.90524 11.8579 3.68629L23.1716 15L11.8579 26.3137C11.0768 27.0948 11.0768 28.3611 11.8579 29.1421C12.6389 29.9232 13.9052 29.9232 14.6863 29.1421L27.4142 16.4142ZM2 17L26 17L26 13L2 13L2 17Z'
				}
				fill={'currentcolor'}
			/>
		</svg>
	);
}

export default IconArrow;
