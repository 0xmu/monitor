import { getPositionIDsToLiquidate } from '../lib/api.js'
import { ADDRESS_ZERO, PRODUCTS } from '../lib/constants.js'
import { initContract, wrapRes } from '../lib/utils.js'

export default async function main(req, res) {

	const contract = initContract(true);
	if (!contract) return wrapRes(req, res, 403, {error: 'Contract null.'});

	// get product prices
	// get position IDs to liquidate for each product
	let liquidate_position_ids = [];
	for (const id in PRODUCTS) {
		const price = await contract.getLatestPrice(ADDRESS_ZERO, id);
		console.log('price', id, price);
		const ids_long = await getPositionIDsToLiquidate(id, price, true);
		console.log('ids_long', ids_long);
		const ids_short = await getPositionIDsToLiquidate(id, price, false);
		console.log('ids_short', ids_short);
		liquidate_position_ids = liquidate_position_ids.concat(ids_long).concat(ids_short);
	}

	//console.log('liquidate_position_ids', liquidate_position_ids);

	if (liquidate_position_ids.length > 0) {
		await contract.liquidatePositions(liquidate_position_ids);
	}

	wrapRes(req, res, 200, {success: true, liquidated: liquidate_position_ids});

}