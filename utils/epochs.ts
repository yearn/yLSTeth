import {EPOCH_DURATION, INITIAL_PERIOD_TIMESTAMP} from 'utils/constants';
import {CBETH_TOKEN, MPETH_TOKEN, SFRXETH_TOKEN, STADERETH_TOKEN, SWETH_TOKEN, WSTETH_TOKEN} from 'utils/tokens';

import type {TEpoch} from './types';

const emptyEpoch: TEpoch = {
	index: 0,
	inclusion: {
		id: '0x0',
		candidates: []
	},
	weight: {
		id: '0x0',
		participants: []
	},
	merkle: {}
};

/**************************************************************************************************
** Calculate the current epoch based on the current timestamp, the initial period timestamp and
** the epoch duration.
** The formula used is: (currentTimestamp - INITIAL_PERIOD_TIMESTAMP) / EPOCH_DURATION
** The result is then rounded down to the nearest whole number to get the current epoch.
**************************************************************************************************/
export function getCurrentEpochNumber(): number {
	const currentTimestamp = Math.floor(Date.now() / 1000);
	const currentEpoch = Math.floor((currentTimestamp - INITIAL_PERIOD_TIMESTAMP) / EPOCH_DURATION);
	return currentEpoch;
}

/**************************************************************************************************
** This function returns the current epoch object based on the current epoch number.
** It uses the getCurrentEpochNumber function to get the current epoch number and then
** retrieves the corresponding epoch object from the allEpochs array.
**************************************************************************************************/
export function getCurrentEpoch(): TEpoch {
	const currentEpochNumber = getCurrentEpochNumber();
	if (currentEpochNumber > allEpochs.length - 1) {
		const baseEpoch = emptyEpoch;
		baseEpoch.weight = allEpochs[allEpochs.length - 1].weight;
		return baseEpoch;
	}
	return allEpochs[currentEpochNumber];
}

/**************************************************************************************************
** This function returns the previous epoch object based on the current epoch number.
** It uses the getCurrentEpochNumber function to get the current epoch number and then
** retrieves the corresponding epoch object from the allEpochs array.
**************************************************************************************************/
export function getPreviousEpoch(): TEpoch {
	const currentEpochNumber = getCurrentEpochNumber();
	if (currentEpochNumber > allEpochs.length - 1) {
		return allEpochs[allEpochs.length - 1];
	}
	return allEpochs[currentEpochNumber - 1];
}



/** 🔵 - Yearn *************************************************************************************
** To add a new epoch, follow these steps:
**
** 1. Copy the first allEpochs.push block.
** 2. Replace the index with the new epoch number.
** 3. Replace the list of candidates with the new candidates for this epoch.
** 4. Replace the list of participants with the new participants for this epoch.
** 5. Update the ids to the correct voteid.
**
** Note:
** - Both the candidates and participants lists are order sensitive. The first element in the list
**   will be the choice number 2 in snapshot, as the first one will always be to keep the same as before.
** - The candidates and participants must respect a specific type that is available in the @tokens.ts file.
**
** Here is an example of how to add a new epoch:
**
** allEpochs.push({
** 	index: NEW_EPOCH_NUMBER,
** 	inclusion: {
** 		id: 'NEW_VOTE_ID',
** 		candidates: [
** 			{...NEW_CANDIDATE_1, index: 0},
** 			{...NEW_CANDIDATE_2, index: 1},
** 			{...NEW_CANDIDATE_3, index: 2}
** 		]
** 	},
** 	weight: {
** 		id: 'NEW_VOTE_ID',
** 		participants: [
** 			{...NEW_PARTICIPANT_1, index: 0},
** 			{...NEW_PARTICIPANT_2, index: 1},
** 			{...NEW_PARTICIPANT_3, index: 2},
** 			{...NEW_PARTICIPANT_4, index: 3},
** 			{...NEW_PARTICIPANT_5, index: 4}
** 		]
** 	}
** });
**************************************************************************************************/
const allEpochs: TEpoch[] = [];
// Epoch 0
allEpochs.push({
	index: 0,
	inclusion: {
		id: '0x0101000000000000000000000000000000000000000000000000000000000000',
		candidates: [{...MPETH_TOKEN, index: 0}]
	},
	weight: {
		id: '0x0102000000000000000000000000000000000000000000000000000000000000',
		participants: [
			{...SFRXETH_TOKEN, index: 0},
			{...SWETH_TOKEN, index: 1},
			{...WSTETH_TOKEN, index: 2},
			{...STADERETH_TOKEN, index: 3},
			{...CBETH_TOKEN, index: 4}
		]
	},
	merkle: {
		'0xD619F816156EFfABF9dDab313cff6b46cad3Fbdd': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 44220965648794n,
				'proof': [
					'0x738b4b1869f79473671786b3fbdc745e74b04d981cdc7145b6e48d2c790274ce',
					'0x1c594934e32b9ad15fe5bec6b15d83042116d63d9d6f580c0eb9bf382f80c791',
					'0xdd9028f825608e2faa79f9fbca2c52a1cedb719bbc9c4d3302492b941d321522',
					'0x4f275c8e61718254387cd21c1db65b3b874a4dc158ae1dffd84e8f60ce4794a0'
				]
			}
		],
		'0xd67f2ED258deF09d5B7F0021482A5648D65562dC': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 147469599903461n,
				'proof': [
					'0xa14b5ac6583540b2301270fa1d54ca894f696564f3d8f54e53f6f3899e72e02c',
					'0x1c594934e32b9ad15fe5bec6b15d83042116d63d9d6f580c0eb9bf382f80c791',
					'0xdd9028f825608e2faa79f9fbca2c52a1cedb719bbc9c4d3302492b941d321522',
					'0x4f275c8e61718254387cd21c1db65b3b874a4dc158ae1dffd84e8f60ce4794a0'
				]
			}
		],
		'0x20216577f78eE7D6d5b2b962C744a950efc77437': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 65665759040582984n,
				'proof': [
					'0xc0150febfcfc365b8ad4a585a83ba6288f50ad963e93d1c657fc6839c0e240ab',
					'0x18f2ab94b2cf319a1094b7d847d5a53b11d9bc3f5bb66a444d18eed40621478a',
					'0xdd9028f825608e2faa79f9fbca2c52a1cedb719bbc9c4d3302492b941d321522',
					'0x4f275c8e61718254387cd21c1db65b3b874a4dc158ae1dffd84e8f60ce4794a0'
				]
			}
		],
		'0x95adAec801B3e8cb7aa90c6922E23dC987cA2bBf': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 542859633294239n,
				'proof': [
					'0x66edd46e84d24018f3c7c199dc0596fd9322ed639eb0cbb18952798a0bcd1e15',
					'0x18f2ab94b2cf319a1094b7d847d5a53b11d9bc3f5bb66a444d18eed40621478a',
					'0xdd9028f825608e2faa79f9fbca2c52a1cedb719bbc9c4d3302492b941d321522',
					'0x4f275c8e61718254387cd21c1db65b3b874a4dc158ae1dffd84e8f60ce4794a0'
				]
			}
		],
		'0x324b6194AC36Ad9A94d5125920580459a573e184': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 14670082866740770n,
				'proof': [
					'0x79d3cc17a36217c90b113ee79f1a634efbd878f0ae8e1b12935eeb59dedadcc6',
					'0xa4258056b35f39303688a062e263c91ea98f68755340f3a2a9b88aae8f267914',
					'0x1b94b36705b6e1cfcaad043263af7e4091565d840dff65a9ccb1eca823e52763',
					'0x4f275c8e61718254387cd21c1db65b3b874a4dc158ae1dffd84e8f60ce4794a0'
				]
			}
		],
		'0xa8CC9BCf39E981e5629731A18e87A7FCaf4D72B3': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 33579081327570841n,
				'proof': [
					'0xe2fa5baaa3900c4f53904df221e7e126c4e3c0a251d7ba4a8326cef030f94156',
					'0xa4258056b35f39303688a062e263c91ea98f68755340f3a2a9b88aae8f267914',
					'0x1b94b36705b6e1cfcaad043263af7e4091565d840dff65a9ccb1eca823e52763',
					'0x4f275c8e61718254387cd21c1db65b3b874a4dc158ae1dffd84e8f60ce4794a0'
				]
			}
		],
		'0xb957DccaA1CCFB1eB78B495B499801D591d8a403': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 1167626955169256n,
				'proof': [
					'0x0373b7ea3780269244b70318a20c0fe1a1f91520f7e5a61dd7d70a9b65e781fb',
					'0x15113afd88fe83f039e229356a3d826ce5788b67c9be3945fccf4fe8e43e3a65',
					'0x1b94b36705b6e1cfcaad043263af7e4091565d840dff65a9ccb1eca823e52763',
					'0x4f275c8e61718254387cd21c1db65b3b874a4dc158ae1dffd84e8f60ce4794a0'
				]
			}
		],
		'0x7BFEe91193d9Df2Ac0bFe90191D40F23c773C060': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 298480722911740820n,
				'proof': [
					'0x3954aa925e69c8c0acb0016e22e61f41971775bed48bf98f80cb3b689c76ca56',
					'0x15113afd88fe83f039e229356a3d826ce5788b67c9be3945fccf4fe8e43e3a65',
					'0x1b94b36705b6e1cfcaad043263af7e4091565d840dff65a9ccb1eca823e52763',
					'0x4f275c8e61718254387cd21c1db65b3b874a4dc158ae1dffd84e8f60ce4794a0'
				]
			}
		],
		'0x7609c725d6BC864e83d39B1b4fbe2676d134e47B': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 56099224615753635n,
				'proof': [
					'0xda987d81bce840000ebafcafb98e66be1b7629358176186009a1b308434791c1',
					'0xf4903f4047b1f9be1c0fd14c6ab54b099358c99c071aaab7bb55ab7746925cb5',
					'0xbbfcf5ab1f0f44805bc3c6a5491970058e499f68d20cf1a51a98cb879a1d7d3f',
					'0xbb4f9d05f813856673f76444bbe72db9fb67defe8b2ddce09b9382c7cd84962a'
				]
			}
		],
		'0x3B15CEc2d922Ab0Ef74688bcC1056461049f89CB': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 518476647387n,
				'proof': [
					'0x14143acdd09d18af5617af37272ca1f250d712137c0419648e5d1c9f7845974d',
					'0xf4903f4047b1f9be1c0fd14c6ab54b099358c99c071aaab7bb55ab7746925cb5',
					'0xbbfcf5ab1f0f44805bc3c6a5491970058e499f68d20cf1a51a98cb879a1d7d3f',
					'0xbb4f9d05f813856673f76444bbe72db9fb67defe8b2ddce09b9382c7cd84962a'
				]
			}
		],
		'0xdAb4cc54a8BeA0cd7833c9a453E7F4C996b3D100': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 3608709522370443n,
				'proof': [
					'0x7e7a8e21f1860645468f16730697092a7c8a8abb89914c2df1417a8554dc6915',
					'0x5a915b71a8293db584806eb36678ba2c4b8b728ac71ef4926b586c899c951fc9',
					'0xbbfcf5ab1f0f44805bc3c6a5491970058e499f68d20cf1a51a98cb879a1d7d3f',
					'0xbb4f9d05f813856673f76444bbe72db9fb67defe8b2ddce09b9382c7cd84962a'
				]
			}
		],
		'0x4d0bddEc656ED7C3b33AB581b6f14c9ab5C205d4': [
			{
				'vote': '0x0102000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0xf951E335afb289353dc249e82926178EaC7DEd78',
				'amount': 525993724084577364n,
				'proof': [
					'0x8c70aa28a364aa95e96978bbf48541750c34aa0c44515d42372969c5a3a25214',
					'0x5a915b71a8293db584806eb36678ba2c4b8b728ac71ef4926b586c899c951fc9',
					'0xbbfcf5ab1f0f44805bc3c6a5491970058e499f68d20cf1a51a98cb879a1d7d3f',
					'0xbb4f9d05f813856673f76444bbe72db9fb67defe8b2ddce09b9382c7cd84962a'
				]
			}
		],
		'0x962d00611208f83175dA312277925b88E44708c7': [
			{
				'vote': '0x0101000000000000000000000000000000000000000000000000000000000000',
				'incentive': '0x583019fF0f430721aDa9cfb4fac8F06cA104d0B4',
				'amount': 2000000000000000000n,
				'proof': ['0xe4f351fcb87a0e6d5b40cbecb8232b6e643d675d8e01de9c09575248588f0a3e']
			}
		]
	}
});
// Epoch 1
allEpochs.push({
	index: 1,
	inclusion: {
		id: '0x0201000000000000000000000000000000000000000000000000000000000000',
		candidates: []
	},
	weight: {
		id: '0x0202000000000000000000000000000000000000000000000000000000000000',
		participants: [
			{...SFRXETH_TOKEN, index: 0},
			{...SWETH_TOKEN, index: 1},
			{...WSTETH_TOKEN, index: 2},
			{...STADERETH_TOKEN, index: 3},
			{...CBETH_TOKEN, index: 4}
		]
	}
});
