const { ethers } = require('ethers');

const { LIQUIDATOR_ABI, DATA, ADDRESS_ZERO } = require('../lib/constants.js');
require('dotenv').config();

const ID_TO_PRODUCT = {
	1: 'ETH-USD',
	2: 'BTC-USD',
	3: 'LINK-USD',
	//8: 'EUR-USD',
	//12: 'AUD-USD',
	//13: 'KRW-USD',
	//14: 'PHP-USD'
	16: 'AAVE-USD',
	17: 'SUSHI-USD',
	18: 'UNI-USD',
	19: 'YFI-USD',
};

function formatUnits(number, units) {
  return ethers.utils.formatUnits(number || 0, units || 8);
}

function formatToDisplay(amount, maxPrecision) {
	if (isNaN(amount)) return 0;
	if (!maxPrecision) maxPrecision = 100000;

	if ((amount*1 == 0 || amount * 1 >= 1) && (amount * 1).toFixed(3)*1 == Math.round(amount * 1)) return Math.round(amount);
	
	if (amount * 1 >= 1000 || amount * 1 <= -1000) {
		return Math.round(amount*1);
	} else if (amount * 1 >= 100 || amount * 1 <= -100) {
		return (amount * 1).toFixed(2);
	} else if (amount * 1 >= 10 || amount * 1 <= -10) {
		return (amount * 1).toFixed(Math.min(maxPrecision,3));
	} else if (amount * 1 >= 0.1 || amount * 1 <= -0.1) {
		return (amount * 1).toFixed(Math.min(maxPrecision,5));
	} else {
		return (amount * 1).toFixed(Math.min(maxPrecision,6));
	}
}

function returnRes(res, status, obj, isLocal) {
	if (isLocal) {
		console.log(status, obj);
		return;
	}
	res.status(status).json(obj);
}

function formatNewPosition(p, positionId) {
	//console.log('p to format', p);
	return {
		positionId,
		product: ID_TO_PRODUCT[p.productId],
		//productId: p.productId,
		isLong: p.isLong ? '⬆' : '⬇',
		margin: formatToDisplay(formatUnits(p.margin)) * 1,
		leverage: formatToDisplay(formatUnits(p.leverage)),
		amount: formatToDisplay(formatUnits(p.margin) * formatUnits(p.leverage)) * 1,
		price: formatToDisplay(formatUnits(p.price)) * 1,
		productPrice: formatToDisplay(formatUnits(p.productPrice)) * 1,
		upl: formatToDisplay(p.upl) * 1,
		interest: formatToDisplay(p.interest || 0) * 1,
		liquidationPrice: formatToDisplay(formatUnits(p.liquidationPrice)) * 1,
		timestamp: new Date(p.timestamp * 1000).toLocaleString(),
		owner: p.owner,
		isSettling: p.isSettling ? '•' : '',
	};
}

function formatClosePosition(ev) {

	const { positionId, user, productId, price, entryPrice, margin, leverage, pnl, pnlIsNegative, isFullClose, wasLiquidated } = ev.args;

	return {
		positionId: positionId && positionId.toNumber(),
		product: ID_TO_PRODUCT[productId],
		//productId: productId && productId.toNumber(),
		entryPrice: formatToDisplay(formatUnits(entryPrice)) * 1,
		closePrice: formatToDisplay(formatUnits(price)) * 1,
		margin: formatToDisplay(formatUnits(margin)) * 1,
		leverage: formatToDisplay(formatUnits(leverage)) + '×',
		amount: formatToDisplay(formatUnits(margin) * formatUnits(leverage)) * 1,
		pnl: formatToDisplay(pnlIsNegative ? -1 * formatUnits(pnl) : formatUnits(pnl)) * 1,
		isFullClose: isFullClose ? '' : 'no',
		wasLiquidated: wasLiquidated ? '✓' : '',
		owner: user,
		block: ev.blockNumber,
		txHash: ev.transactionHash
	};

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
	const events_close = await contract.queryFilter(filter_close, -99000);

	//console.log('events_close', events_close);

	let full_close_ids = {};
	let closed_positions = [];
	for (const ev of events_close) {
		let args = ev.args;
		if (args.isFullClose) {
			full_close_ids[args.positionId] = true;
		}
		closed_positions.push(formatClosePosition(ev));
	}

	closed_positions.reverse();

	//console.log('closed_positions', closed_positions);

	const filter_new = contract.filters.NewPosition();
	const events_new = await contract.queryFilter(filter_new, -99000);

	//console.log('events_settled', events_settled);

	let open_position_ids = {};
	for (let ev of events_new) {
		let args = ev.args;
		if (!full_close_ids[args.positionId]) open_position_ids[args.positionId] = true;
	}

	open_position_ids = Object.keys(open_position_ids);

	//console.log('open_position_ids', open_position_ids);

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

	//console.log('batches', batches);

	let positions = {};
	let j = 0;
	for (const batch of batches) {
		const _positions = await contract.getPositions(batch);
		for (const p of _positions) {
			positions[batch[i]] = {
				isLong: p.isLong,
				isSettling: p.isSettling,
				margin: p.margin.toNumber(),
				leverage: p.leverage.toNumber(),
				price: p.price.toNumber(),
				productId: p.productId.toNumber(),
				timestamp: p.timestamp.toNumber(),
				owner: p.owner
			};
			i++;
		}
		j = 0;
	}

	//console.log('positions1', positions);

	// positions contains open positions with up to date data. now get products and product current price

	let product_prices = {}; // product id => product price
	let product_info = {}; // product id => product info
	let total_upl = 0, total_margin = 0;
	let unique_owners = {};
	for (const positionId in positions) {
		
		let p = positions[positionId];
		if (!p.productId) continue;

		if (!product_prices[p.productId]) {
			let productInfo = await contract.getProduct(p.productId);
			let price = await contract.getLatestPrice(ADDRESS_ZERO, p.productId);
			product_info[p.productId] = productInfo;
			product_prices[p.productId] = price;
		}

		// Calculate liq price for each position

		//console.log('product_info', product_info);
		let product_price_with_fee;
		let fee = product_info[p.productId]['fee'];
		if (p.isLong) {
			product_price_with_fee = product_prices[p.productId] * (1 - fee/10000);
		} else {
			product_price_with_fee = product_prices[p.productId] * (1 + fee/10000);
		}

		let position_price = p.price;

		//console.log('product_price_with_fee', product_price_with_fee);
		//console.log('position price', position_price);

		let liquidationPrice;
		if (p.isLong) {
			liquidationPrice = position_price - position_price * 0.8 / (p.leverage / 10**8);
		} else {
			liquidationPrice = position_price + position_price * 0.8 / (p.leverage / 10**8);
		}

		//console.log('liquidationPrice', liquidationPrice);
		//console.log('-------')

		//positions[positionId] = formatNewPosition(positions[positionId], positionId);

		p['productPrice'] = Math.round(product_price_with_fee);
		p['liquidationPrice'] = Math.round(liquidationPrice);

		//console.log('positions[positionId]', positions[positionId]);

		// Calculate unrealized p/l

		let pf = p;

		let latestPrice = pf.productPrice;
		let upl = 0;
		let interest = 0;
		if (latestPrice) {
			if (pf.isLong) {
				upl = pf.margin * pf.leverage * (latestPrice * 1 - pf.price * 1) / (pf.price * 10**16);
			} else {
				upl = pf.margin * pf.leverage * (pf.price * 1 - latestPrice * 1) / (pf.price * 10**16);
			}
			// Add interest
			let now = parseInt(Date.now() / 1000);
			//console.log('product_info[p.productId].interest', product_info[p.productId].interest);
			if (pf.isSettling || now < pf.timestamp * 1 + 1800) {
				//console.log('i1');
				interest = 0;
			} else {
				//console.log('i2');
				interest = pf.margin * pf.leverage * ((product_info[p.productId].interest * 1 || 0) / 10000) * (now - pf.timestamp * 1) / (360 * 24 * 3600 * 10**16);
			}
			if (interest < 0) interest = 0;
			upl -= interest;
		}

		p['upl'] = upl;
		total_upl += upl;
		if (interest) p['interest'] = -1 * interest;

		total_margin += p.margin / 10**8;
		unique_owners[p.owner] = 1;

		positions[positionId] = formatNewPosition(p, positionId);

	}

	positions = Object.values(positions);
	positions.reverse();

	// Display in terminal

	if (req.query.isLocal) {

		let sorted_positions = [...positions].sort((a,b) => {
			return b.amount*1 - a.amount*1;
		});

		console.log("Open Positions sorted by Amount");
		console.log("Total UPL: " + formatToDisplay(total_upl) + " | Total Margin: ", formatToDisplay(total_margin) + " | Positions: " + positions.length + " |  Unique Wallets: " + Object.keys(unique_owners).length);
		console.table(sorted_positions);


		console.log("Recent Positions");
		console.table(positions.slice(0,10));

		console.log("Closed Positions");
		console.table(closed_positions);

	} else {
		return returnRes(res, 200, {success: true, closed_positions, positions}, false);
	}
	

}

module.exports = main;