const { ethers } = require('ethers');
const { SETTLER_ABI, DATA } = require('../lib/constants.js');

async function main(req, res) {

	// local test
	//const chain = 'rinkeby';
	const chain = req.query.chain; // rinkeby, mainnet, etc.

	if (!chain || !DATA[chain]) return res.json({success: false, message: 'chain invalid'});

	const pkey = process.env[`SETTLER_PKEY_${chain.toUpperCase()}`];

	if (!pkey) return res.json({success: false, message: 'no pkey'});

	const provider = new ethers.providers.JsonRpcProvider(DATA[chain]['network']);
	const walletWithProvider = new ethers.Wallet(pkey, provider);

	const contract = new ethers.Contract(DATA[chain]['trading'], SETTLER_ABI, walletWithProvider);

	let settleTheseIds = await contract.checkPositionsToSettle();
	console.log('settleTheseIds:', settleTheseIds);

	if (settleTheseIds.length > 0) {
		await contract.settlePositions(settleTheseIds);
		console.log('Settled Ids', settleTheseIds);
	}

	res.json({success: true});

}

module.exports = main;