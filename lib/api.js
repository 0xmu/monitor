import fetch from 'node-fetch';
import { formatPositions, formatTrades } from './utils.js';

const graph_url = 'https://api.thegraph.com/subgraphs/name/0xcap/cap3';

export async function getPositions(_sort) {
	let filter;
	if (_sort == 'size') {
		filter = 'orderBy: size, orderDirection: desc, first: 100';
	} else {
		filter = 'orderBy: updatedAtTimestamp, orderDirection: desc, first: 20';
	}
	const response = await fetch(graph_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
				query {
					positions(${filter}) {
						id,
						productId,
						currency,
						leverage,
						price,
						margin,
						size,
						user,
						liquidationPrice,
						isLong,
						createdAtTimestamp
						updatedAtTimestamp
					}
				}
			`
		})
	});
	const json = await response.json();
	return formatPositions(json.data.positions);
}

export async function getTrades() {
	const response = await fetch(graph_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
				query {
				  trades(
				    orderBy: timestamp,
				    orderDirection: desc,
				    first:100
				  ) {
				    id,
				    txHash,
				    positionKey,
				    currency,
				    productId,
				    margin,
				    leverage,
				    size,
				    duration,
				    entryPrice,
				    closePrice,
				    isLong,
				    pnl,
				    timestamp,
				    blockNumber,
				    wasLiquidated,
				    user
				  }
				}
			`
		})
	});
	const json = await response.json();
	return formatTrades(json.data.trades);
}

export async function getPrice(product) {

	// console.log('getPrice', product);

	const url = `https://api.exchange.coinbase.com/products/${product}/ticker`;
	try {
		const response = await fetch(url, {timeout: 10000});
		const json = await response.json();
		// console.log('json', json);
		return json.price;
	} catch(e) {
		throw e;
	}

}