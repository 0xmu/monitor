const { ethers } = require('ethers');
const { LIQUIDATOR_ABI, DATA, ADDRESS_ZERO } = require('../lib/constants.js');
require('dotenv').config();

function returnRes(res, status, obj, isLocal) {
	if (isLocal) {
		console.log(status, obj);
		return;
	}
	res.setHeader('Cache-Control', 's-maxage=1800');
	res.status(status).json(obj);
}

async function main(req, res) {

	const chain = req.query.chain; // rinkeby, mainnet, etc.

	if (!chain || !DATA[chain]) return returnRes(res, 403, {success: false, message: 'chain invalid'}, req.query.isLocal);

	const trading = process.env[`TRADING_CONTRACT_${chain.toUpperCase()}`];

	if (!trading) return returnRes(res, 403, {success: false, message: 'no trading contract'}, req.query.isLocal);

	const provider = new ethers.providers.JsonRpcProvider(DATA[chain]['network']);

	const contract = new ethers.Contract(trading, LIQUIDATOR_ABI, provider);

	// close
	const filter_close = contract.filters.ClosePosition();
	const events_close = await contract.queryFilter(filter_close, -71000); // 1 week

	console.log('events_close', events_close.length);

	let volume = 0;
	let trades = 0;

	for (const ev of events_close) {
		let args = ev.args;
		volume += args.margin.toNumber() * args.leverage.toNumber() / 10**8;
	}

	const filter_new = contract.filters.NewPosition();
	const events_new = await contract.queryFilter(filter_new, -71000); // 1 week

	console.log('events_new', events_new.length);

	for (let ev of events_new) {
		let args = ev.args;
		volume += args.margin.toNumber() * args.leverage.toNumber() / 10**8;
	}

	volume = parseInt(volume);
	trades = events_close.length + events_new.length;

	return returnRes(res, 200, {success: true, volume, trades}, req.query.isLocal);

}

module.exports = main;