import { getPositions, getTrades, getPrice } from '../lib/api.js'
import { ADDRESS_ZERO } from '../lib/constants.js'
import { initContract, wrapRes, formatUnits, formatToDisplay } from '../lib/utils.js'
import { Table } from 'console-table-printer'

export default async function main(req, res) {

	if (req && req.query.secret != process.env.SECRET) return;

	const { trading, treasury, provider } = initContract();
	if (!trading || !treasury) return wrapRes(req, res, 403, {error: 'Contracts null.'});

	// get positions
	let positions = {
		recent: await getPositions('recent'),
		size: await getPositions('size')
	}

	// console.log('positions', positions);

	let product_prices = {}; // product => product price
	let product_info = {}; // product id => product info
	let total_upl = {
		ETH: 0,
		USDC: 0
	};
	let total_margin = {
		ETH: 0,
		USDC: 0
	};
	let longs = {
		ETH: 0,
		USDC: 0
	};
	let shorts = {
		ETH: 0,
		USDC: 0
	};
	let unique_owners = {};

	const augmentPositions = async (type) => {

		let i = 0;
		for (let p of positions[type]) {
			
			if (!p.productId) continue;

			if (!product_prices[p.product]) {
				let productInfo = await trading.getProduct(p.productId);

				let price = await getPrice(p.product);

				product_info[p.productId] = productInfo;
				product_prices[p.product] = price;
			}

			const _p = JSON.parse(JSON.stringify(p));

			let currency = _p.currency == ADDRESS_ZERO ? 'ETH' : 'USDC';

			// Calculate unrealized p/l

			let latestPrice = product_prices[p.product] * 1;
			let upl = 0;
			let interest = 0;

			if (latestPrice) {
			
				if (p.isLong) {
					upl = p.size * (latestPrice * 1 - p.price * 1) / p.price;
				} else {
					upl = p.size * (p.price * 1 - latestPrice * 1) / p.price;
				}

				// Add interest
				let now = parseInt(Date.now() / 1000);

				if (now < p.createdAtTimestamp * 1 + 1800) {
					//console.log('i1');
					interest = 0;
				} else {
					//console.log('i2');
					interest = p.size * ((product_info[p.productId].interest * 1 || 0) / 10000) * (now - p.createdAtTimestamp * 1) / (360 * 24 * 3600);
				}

				if (interest < 0) interest = 0;
				upl -= interest;

			}

			p.canBeLiquidated = p.isLong && p.liquidationPrice*1 > latestPrice*1 || !p.isLong && p.liquidationPrice*1 < latestPrice*1 ? 'Y' : '';

			p.upl = formatToDisplay(upl) * 1;
			p.productPrice = formatToDisplay(latestPrice) * 1;
			if (interest) p.interest = formatToDisplay(-1 * interest) * 1 || 0;

			p.createdAtTimestamp = new Date(p.createdAtTimestamp * 1000).toLocaleString();
			p.updatedAtTimestamp = new Date(p.updatedAtTimestamp * 1000).toLocaleString();

			total_margin[currency] += p.margin * 1;
			total_upl[currency] += upl;
			if (p.isLong) {
				longs[currency] += p.size * 1;
			} else {
				shorts[currency] += p.size * 1;
			}

			p.margin = `${p.margin} ${currency}`;
			p.size = `${p.size} ${currency}`;
			p.upl = `${p.upl} ${currency}`;
			let direction = _p.isLong == true ? '↑' : '↓';

			p.product = `${direction} ${p.product}`;

			delete p.productId;
			delete p.currency;
			delete p.isLong;

			positions[type][i] = p;
			
			unique_owners[p.user] = 1;

			i++;

		}

	}

	await augmentPositions('recent');
	await augmentPositions('size');

	// get trades
	const trades = await getTrades();

	// // treasury
	// const vaultBalance = formatUnits(await treasury.vaultBalance(), 18);
	// const vaultThreshold = formatUnits(await treasury.vaultThreshold(), 18);
	// const treasuryBalance = formatUnits(await provider.getBalance(treasury.address), 18);

	// Display in terminal

	// console.log('Treasury Balance: ' + treasuryBalance + ' | Vault Balance: ' + vaultBalance + ' | Vault Threshold: ' + vaultThreshold);

	const p = new Table({
	  columns: [
	    { name: 'product', title: 'Product', color: 'green' },
	    { name: 'price', title: 'Entry Price', color: 'yellow' },
	    { name: 'productPrice', title: 'Current Price', color: 'yellow' },
	    { name: 'margin', title: 'Margin', color: 'yellow' },
	    { name: 'size', title: 'Size', color: 'yellow' },
	    { name: 'leverage', title: 'Lev', color: 'yellow' },
	    { name: 'upl', title: 'UP/L', color: 'yellow' },
	    { name: 'interest', title: 'Interest', color: 'yellow' },
	    { name: 'liquidationPrice', title: 'Liq. Price', color: 'yellow' },
	    { name: 'createdAtTimestamp', title: 'Created', color: 'green' },
	    { name: 'updatedAtTimestamp', title: 'Updated', color: 'green' },
	    { name: 'user', title: 'User', color: 'green' },
	    { name: 'canBeLiquidated', title: 'Can Liq.', color: 'green' }
	  ],
	});

	p.addRows(positions.size);

	console.log("Open Positions sorted by Size");
	console.log("Total UPL: " + formatToDisplay(total_upl.ETH) + " ETH, " + formatToDisplay(total_upl.USDC) + " USDC | Total Margin: ", formatToDisplay(total_margin.ETH) + " ETH, " + formatToDisplay(total_margin.USDC) + " USDC | Positions: " + positions.size.length + " |  Unique Wallets: " + Object.keys(unique_owners).length);
	console.log("Longs: " + formatToDisplay(longs.ETH) + " ETH, " + formatToDisplay(longs.USDC) + " USDC | Shorts: ", formatToDisplay(shorts.ETH) + " ETH, " + formatToDisplay(shorts.USDC) + " USDC");
	// console.table(positions.size);
	p.printTable();

	const p2 = new Table({
	  columns: [
	    { name: 'product', title: 'Product', color: 'green' },
	    { name: 'price', title: 'Entry Price', color: 'yellow' },
	    { name: 'productPrice', title: 'Current Price', color: 'yellow' },
	    { name: 'margin', title: 'Margin', color: 'yellow' },
	    { name: 'size', title: 'Size', color: 'yellow' },
	    { name: 'leverage', title: 'Lev', color: 'yellow' },
	    { name: 'upl', title: 'UP/L', color: 'yellow' },
	    { name: 'interest', title: 'Interest', color: 'yellow' },
	    { name: 'liquidationPrice', title: 'Liq. Price', color: 'yellow' },
	    { name: 'createdAtTimestamp', title: 'Created', color: 'green' },
	    { name: 'updatedAtTimestamp', title: 'Updated', color: 'green' },
	    { name: 'user', title: 'User', color: 'green' },
	    { name: 'canBeLiquidated', title: 'Can Liq.', color: 'green' }
	  ],
	});

	p2.addRows(positions.recent);

	console.log("Recent Positions");
	p2.printTable();

	// console.table(positions.recent);

	const p3 = new Table({
	  columns: [
	    { name: 'isLong', title: 'Direction', color: 'green' },
	    { name: 'product', title: 'Product', color: 'green' },
	    { name: 'entryPrice', title: 'Entry Price', color: 'yellow' },
	    { name: 'closePrice', title: 'Close Price', color: 'yellow' },
	    { name: 'margin', title: 'Margin', color: 'yellow' },
	    { name: 'size', title: 'Size', color: 'yellow' },
	    { name: 'leverage', title: 'Lev', color: 'yellow' },
	    { name: 'pnl', title: 'P/L', color: 'yellow' },
	    { name: 'duration', title: 'Duration', color: 'yellow' },
	    { name: 'timestamp', title: 'Closed At', color: 'green' },
	    { name: 'user', title: 'User', color: 'green' },
	    { name: 'wasLiquidated', title: 'Was Liq.', color: 'green' },
	    { name: 'currency', title: 'Currency', color: 'green' }
	  ],
	});

	p3.addRows(trades);

	console.log("Trades");
	p3.printTable();

}