import fetch from 'node-fetch';
import { formatPositions, formatTrades } from './utils.js';

const graph_url = 'https://api.thegraph.com/subgraphs/name/0xcap/cap2';

export async function getPositions(_sort) {
	let filter;
	if (_sort == 'amount') {
		filter = 'orderBy: amount, orderDirection: desc, first: 50';
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
				    first:50
				  ) {
				    id,
				    txHash,
				    positionId,
				    productId,
				    margin,
				    leverage,
				    amount,
				    duration,
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