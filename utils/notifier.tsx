import axios from 'axios';

function notify({from, fromName, to, toName, tokenName, amountNormalized, value, txLink}: {
	from: string,
	fromName: string,
	to: string,
	toName: string,
	tokenName: string,
	amountNormalized: string,
	value: string,
	txLink: string
}): void {
	axios.post('/api/notify', {
		messages: [
			'*❤️ A new gib has been detected*',
			`\t\t\t\t\t\t[${fromName}](https://etherscan.io/address/${from}) sent ${amountNormalized} ${tokenName} (~$${value}) to [${toName}](https://etherscan.io/address/${to})`,
			`\t\t\t\t\t\t[View on Etherscan](${txLink})`
		]
	});
}

export default notify;
