import { getPositions, getTrades } from '../lib/api.js'
import { ADDRESS_ZERO } from '../lib/constants.js'
import { initContract, wrapRes, formatUnits, formatToDisplay } from '../lib/utils.js'

export default async function main(req, res) {

	const contract = initContract();
	if (!contract) return wrapRes(req, res, 403, {error: 'Contract null.'});

	// get positions
	let positions = {
		recent: await getPositions('recent'),
		amount: await getPositions('amount')
	}

	let product_prices = {}; // product id => product price
	let product_info = {}; // product id => product info
	let total_upl = {
		recent: 0,
		amount: 0
	};
	let total_margin = {
		recent: 0,
		amount: 0
	};
	let unique_owners = {
		recent: {},
		amount: {}
	};

	const augmentPositions = async (type) => {

		let i = 0;
		for (let p of positions[type]) {
			
			if (!p.productId) continue;

			if (!product_prices[p.productId]) {
				let productInfo = await contract.getProduct(p.productId);
				let price = await contract.getLatestPrice(ADDRESS_ZERO, p.productId);
				product_info[p.productId] = productInfo;
				product_prices[p.productId] = price.toNumber();
			}

			// Calculate unrealized p/l

			let latestPrice = product_prices[p.productId] / 10**8;
			let upl = 0;
			let interest = 0;

			if (latestPrice) {
			
				if (p.isLong) {
					latestPrice = latestPrice * (1 - product_info[p.productId].fee/10000);
					upl = p.margin * p.leverage * (latestPrice * 1 - p.price * 1) / p.price;
				} else {
					latestPrice = latestPrice * (1 + product_info[p.productId].fee/10000);
					upl = p.margin * p.leverage * (p.price * 1 - latestPrice * 1) / p.price;
				}

				// Add interest
				let now = parseInt(Date.now() / 1000);

				if (p.isSettling || now < p.timestamp * 1 + 1800) {
					//console.log('i1');
					interest = 0;
				} else {
					//console.log('i2');
					interest = p.margin * p.leverage * ((product_info[p.productId].interest * 1 || 0) / 10000) * (now - p.timestamp * 1) / (360 * 24 * 3600);
				}

				if (interest < 0) interest = 0;
				upl -= interest;

			}

			p.canBeLiquidated = p.isLong && p.liquidationPrice*1 > latestPrice*1 || !p.isLong && p.liquidationPrice*1 < latestPrice*1;

			p.upl = formatToDisplay(upl) * 1;
			p.productPrice = formatToDisplay(latestPrice) * 1;
			if (interest) p.interest = formatToDisplay(-1 * interest) * 1 || 0;

			p.timestamp = new Date(p.timestamp * 1000).toLocaleString();

			positions[type][i] = p;
			
			total_upl[type] += upl;
			total_margin[type] += p.margin * 1;
			unique_owners[type][p.owner] = 1;

			i++;

		}

	}

	await augmentPositions('recent');
	await augmentPositions('amount');

	// get trades
	const trades = await getTrades();

	// Display in terminal

	console.log("Open Positions sorted by Amount");
	console.log("Total UPL: " + formatToDisplay(total_upl.amount) + " | Total Margin: ", formatToDisplay(total_margin.amount) + " | Positions: " + positions.amount.length + " |  Unique Wallets: " + Object.keys(unique_owners.amount).length);
	console.table(positions.amount);


	console.log("Recent Positions");
	console.table(positions.recent);

	console.log("Trades");
	console.table(trades);

}