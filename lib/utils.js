import { ethers } from 'ethers'
import { ABI, NETWORK, PRODUCTS } from './constants.js'
import dotenv from 'dotenv';
dotenv.config();

export function formatUnits(number, units) {
  return ethers.utils.formatUnits(number || 0, units || 8);
}

export function wrapRes(req, res, status, obj) {
	if (!req) return console.log(status, obj);
	res.status(status).json(obj);
}

export function initContract(authed) {

	const address = process.env[`CONTRACT`];
	if (!address) return null;
	
	const provider = new ethers.providers.JsonRpcProvider(NETWORK);

	let authedProvider;
	if (authed) {
		const pkey = process.env[`PKEY`];
		if (!pkey) return null;
		authedProvider = new ethers.Wallet(pkey, provider);
	}

	return new ethers.Contract(address, ABI, authedProvider || provider);

}

export function formatToDisplay(amount, maxPrecision) {
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

export function formatPositions(positions) {
	let formattedPositions = [];
	let i = 0;
	for (const p of positions) {
		if (!p.productId) {
			i++;
			continue;
		}
		formattedPositions.push({
			product: PRODUCTS[p.productId],
			isLong: p.isLong,
			price: formatToDisplay(formatUnits(p.price))*1,
			margin: formatToDisplay(formatUnits(p.margin))*1,
			leverage: formatToDisplay(formatUnits(p.leverage))*1,
			amount: formatToDisplay(formatUnits(p.margin) * formatUnits(p.leverage))*1,
			owner: p.owner,
			timestamp: p.createdAtTimestamp,
			isSettling: p.isSettling,
			productId: p.productId,
			positionId: p.id
		});
		i++;
	}
	return formattedPositions;
}

export function formatTrades(trades, blockNumber, txHash) {
	let formattedTrades = [];
	for (const t of trades) {
		formattedTrades.push({
			product: PRODUCTS[t.productId],
			isLong: t.isLong,
			closePrice: formatToDisplay(formatUnits(t.closePrice || t.price))*1,
			entryPrice: formatToDisplay(formatUnits(t.entryPrice))*1,
			margin: formatToDisplay(formatUnits(t.margin))*1,
			leverage: formatToDisplay(formatUnits(t.leverage))*1,
			amount: formatToDisplay(formatUnits(t.margin) * formatUnits(t.leverage))*1,
			pnl: formatToDisplay(t.pnlIsNegative ? -1 * formatUnits(t.pnl) : formatUnits(t.pnl))*1,
			isFullClose: t.isFullClose,
			wasLiquidated: t.wasLiquidated,
			owner: t.owner,
			timestamp: new Date(t.timestamp * 1000).toLocaleString(),
			productId: t.productId,
			positionId: t.positionId,
			//txHash: t.txHash || t.transactionHash || txHash,
			//block: t.blockNumber || blockNumber
		});
	}
	return formattedTrades;
}