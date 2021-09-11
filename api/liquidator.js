const { ethers } = require('ethers');
const { LIQUIDATOR_ABI, DATA, ADDRESS_ZERO } = require('../lib/constants.js');
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

	const pkey = process.env[`LIQUIDATOR_PKEY_${chain.toUpperCase()}`];

	if (!pkey) return returnRes(res, 403, {success: false, message: 'no pkey'}, req.query.isLocal);

	const trading = process.env[`TRADING_CONTRACT_${chain.toUpperCase()}`];

	if (!trading) return returnRes(res, 403, {success: false, message: 'no trading contract'}, req.query.isLocal);

	const provider = new ethers.providers.JsonRpcProvider(DATA[chain]['network']);
	const walletWithProvider = new ethers.Wallet(pkey, provider);

	const contract = new ethers.Contract(trading, LIQUIDATOR_ABI, walletWithProvider);

	// LOCAL TEST

	//await contract.liquidatePositions([ '2' ], {gasLimit: 2000000});
	//return;

	// determine which positions to liquidate

	// fetch currently open position Ids using same technique as client, then bacth get their details (up to date margin) with getPositions method in contract (50 max per call)

	// get product info tied to these positions and each product current price

	// calculate liquidation price for each of these positions and determine if they can be liquidated

	// full close
	const filter_close = contract.filters.ClosePosition(null, null, null, 1);
	const events_close = await contract.queryFilter(filter_close, -150000);

	//console.log('events_close', events_close);

	let full_close_ids = {};
	for (const ev of events_close) {
		let args = ev.args;
		full_close_ids[args.positionId] = true;
	}

	const filter_settled = contract.filters.NewPositionSettled();
	const events_settled = await contract.queryFilter(filter_settled, -150000); // about 6 months

	//console.log('events_settled', events_settled);

	let open_position_ids = {};
	for (let ev of events_settled) {
		let args = ev.args;
		if (!full_close_ids[args.positionId]) open_position_ids[args.positionId] = true;
	}

	open_position_ids = Object.keys(open_position_ids);

	console.log('open_position_ids', open_position_ids);

	let batches = [];

	let i = 0;
	for (const id of open_position_ids) {
		if (!batches[i]) batches[i] = [];
		if (batches[i].length == 50) {
			i++;
			continue;
		}
		batches[i].push(id);
	}

	console.log('batches', batches);

	let positions = {};
	let j = 0;
	for (const batch of batches) {
		const _positions = await contract.getPositions(batch);
		for (const p of _positions) {
			positions[batch[i]] = p;
			i++;
		}
		j = 0;
	}

	console.log('positions', positions);

	// positions contains open positions with up to date data. now get products and product current price

	let product_prices = {}; // product id => product price
	let product_info = {}; // product id => product info
	let liquidate_position_ids = [];
	for (const positionId in positions) {
		
		const p = positions[positionId];
		if (!p.productId.toNumber()) continue;

		if (!product_prices[p.productId]) {
			let productInfo = await contract.getProduct(p.productId);
			let price = await contract.getLatestPrice(ADDRESS_ZERO, p.productId);
			product_info[p.productId] = productInfo;
			product_prices[p.productId] = price;
		}

		// Calculate liq price for each position

		let product_price_with_fee;
		let fee = product_info[p.productId]['fee'];
		if (p.isLong) {
			product_price_with_fee = product_prices[p.productId] * (1 - fee/10000);
		} else {
			product_price_with_fee = product_prices[p.productId] * (1 + fee/10000);
		}

		let position_price = p.price.toNumber();

		console.log('product_price_with_fee', product_price_with_fee);
		console.log('position price', position_price);

		let liquidationPrice;
		if (p.isLong) {
			liquidationPrice = position_price - position_price * 0.8 / (p.leverage / 10**8);
		} else {
			liquidationPrice = position_price + position_price * 0.8 / (p.leverage / 10**8);
		}

		console.log('liquidationPrice', liquidationPrice);
		console.log('-------')

		if (p.isLong && product_price_with_fee <= liquidationPrice || !p.isLong && product_price_with_fee >= liquidationPrice) {
			// Can be liquidated
			liquidate_position_ids.push(positionId);
		}

	}

	console.log('liquidate_position_ids', liquidate_position_ids);

	if (liquidate_position_ids.length > 0) {
		await contract.liquidatePositions(liquidate_position_ids);
	}

	return returnRes(res, 200, {success: true, liquidate_position_ids}, req.query.isLocal);

}

module.exports = main;