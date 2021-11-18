import { getPositions, getTrades, getPrice } from '../lib/api.js'
import { ADDRESS_ZERO } from '../lib/constants.js'
import { initContract, wrapRes, formatUnits, formatToDisplay } from '../lib/utils.js'

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
		recent: 0,
		size: 0
	};
	let total_margin = {
		recent: 0,
		size: 0
	};
	let unique_owners = {
		recent: {},
		size: {}
	};

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

				if (now < p.timestamp * 1 + 1800) {
					//console.log('i1');
					interest = 0;
				} else {
					//console.log('i2');
					interest = p.size * ((product_info[p.productId].interest * 1 || 0) / 10000) * (now - p.timestamp * 1) / (360 * 24 * 3600);
				}

				if (interest < 0) interest = 0;
				upl -= interest;

			}

			p.canBeLiquidated = p.isLong && p.liquidationPrice*1 > latestPrice*1 || !p.isLong && p.liquidationPrice*1 < latestPrice*1;

			p.upl = formatToDisplay(upl) * 1;
			p.productPrice = formatToDisplay(latestPrice) * 1;
			if (interest) p.interest = formatToDisplay(-1 * interest) * 1 || 0;

			p.timestamp = new Date(p.timestamp * 1000).toLocaleString();

			delete p.productId;

			positions[type][i] = p;
			
			total_upl[type] += upl;
			total_margin[type] += p.margin * 1;
			unique_owners[type][p.owner] = 1;

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

	console.log("Open Positions sorted by Size");
	console.log("Total UPL: " + formatToDisplay(total_upl.size) + " | Total Margin: ", formatToDisplay(total_margin.size) + " | Positions: " + positions.size.length + " |  Unique Wallets: " + Object.keys(unique_owners.size).length);
	console.table(positions.size);


	console.log("Recent Positions");
	console.table(positions.recent);

	console.log("Trades");
	console.table(trades);

}