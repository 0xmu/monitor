const { ethers } = require('ethers');
const { SETTLER_ABI, DATA } = require('../lib/constants.js');
require('dotenv').config();

function returnRes(res, status, obj, isLocal) {
	if (isLocal) {
		console.log(status, obj);
		return;
	}
	res.status(status).json(obj);
}

async function main(req, res) {

	const chain = req.query.chain; // rinkeby, mainnet, etc.

	if (!chain || !DATA[chain]) return returnRes(res, 403, {success: false, message: 'chain invalid'}, req.query.isLocal);

	const pkey = process.env[`SETTLER_PKEY_${chain.toUpperCase()}`];

	if (!pkey) return returnRes(res, 403, {success: false, message: 'no pkey'}, req.query.isLocal);

	const trading = process.env[`TRADING_CONTRACT_${chain.toUpperCase()}`];

	if (!trading) return returnRes(res, 403, {success: false, message: 'no trading contract'}, req.query.isLocal);

	const provider = new ethers.providers.JsonRpcProvider(DATA[chain]['network']);
	const walletWithProvider = new ethers.Wallet(pkey, provider);

	const contract = new ethers.Contract(trading, SETTLER_ABI, walletWithProvider);


	// determine which IDs to settle based on recent NewPosition events

	const filter_settled = contract.filters.NewPositionSettled();
	const events_settled = await contract.queryFilter(filter_settled, -1000);

	let already_settled = {};
	for (let ev of events_settled) {
		let args = ev.args;
		already_settled[args.positionId] = true;
	}

	const filter_new = contract.filters.NewPosition();
	const events_new = await contract.queryFilter(filter_new, -1000);

	let settle_these_ids = {};
	for (let ev of events_new) {
		let args = ev.args;
		if (!already_settled[args.positionId]) settle_these_ids[args.positionId] = true;
	}

	let settleTheseIds = Object.keys(settle_these_ids);

	console.log('settleTheseIds', settleTheseIds);
	// Check if they can be settled
	if (settleTheseIds.length > 0) {
		const canBeSettled = await contract.canSettlePositions(settleTheseIds);
		if (canBeSettled.length > 0) {
			// Go through it and make sure there are non zeros
			let idsToActuallySettle = [];
			for (const id of canBeSettled) {
				if (!id || id.toNumber() == 0) continue;
				idsToActuallySettle.push(id);
			}
			console.log('idsToActuallySettle', idsToActuallySettle);
			if (idsToActuallySettle.length > 0) {
				await contract.settlePositions(idsToActuallySettle);
				console.log('Settled Ids', idsToActuallySettle);
				return returnRes(res, 200, {success: true, settled: idsToActuallySettle}, req.query.isLocal);
			}
		}
	}

	return returnRes(res, 200, {success: true}, req.query.isLocal);

}

module.exports = main;