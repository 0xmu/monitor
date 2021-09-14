import fetch from 'node-fetch';
import { formatPositions, formatTrades } from './utils.js';

const graph_url = 'https://api.thegraph.com/subgraphs/name/0xcap/capv1';

export async function getSettlingPositionIDs() {
	const response = await fetch(graph_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
				query {
					positions(where: {isSettling: true}) {
						id
					}
				}
			`
		})
	});
	const json = await response.json();
	let ids = json.data.positions.map((x) => {return x.id});
	return ids;
}

export async function getPositionIDsToLiquidate(productId, price, isLong) {

	let varText;
	if (isLong) {
		varText = `isLong: true, liquidationPrice_gt: ${Math.round(price*1.005)}`;
	} else {
		varText = `isLong: false, liquidationPrice_lt: ${Math.round(price*0.995)}`;
	}

	const response = await fetch(graph_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
				query {
					positions(where: {productId: ${productId}, ${varText} }) {
						id
					}
				}
			`
		})
	});
	const json = await response.json();
	let ids = json.data.positions.map((x) => {return x.id});
	return ids;
}

export async function getPositions(_sort) {
	let filter;
	if (_sort == 'amount') {
		filter = 'orderBy: amount, orderDirection: desc, first: 300';
	} else {
		filter = 'orderBy: createdAtTimestamp, orderDirection: desc, first: 10';
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
						leverage,
						price,
						margin,
						amount,
						owner,
						liquidationPrice,
						isLong,
						isSettling,
						createdAtTimestamp
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
				    positionId,
				    productId,
				    margin,
				    leverage,
				    amount,
				    entryPrice,
				    closePrice,
				    isLong,
				    pnl,
				    pnlIsNegative,
				    timestamp,
				    blockNumber,
				    wasLiquidated,
				    isFullClose,
				    owner
				  }
				}
			`
		})
	});
	const json = await response.json();
	return formatTrades(json.data.trades);
}