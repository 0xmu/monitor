import { getSettlingPositionIDs } from '../lib/api.js'
import { initContract, wrapRes } from '../lib/utils.js'

export default async function main(req, res) {

	const contract = initContract(true);
	if (!contract) return wrapRes(req, res, 403, {error: 'Contract null.'});

	//await contract.settlePositions(['']);
	//return;

	const ids = await getSettlingPositionIDs();

	if (ids.length > 0) {

		const canBeSettled = await contract.canSettlePositions(ids);
		
		if (canBeSettled.length > 0) {
		
			// Go through it and make sure there are non zeros
			let idsToActuallySettle = [];
			for (const id of canBeSettled) {
				if (!id || id.toNumber() == 0) continue;
				idsToActuallySettle.push(id);
			}
		
			if (idsToActuallySettle.length > 0) {
				await contract.settlePositions(idsToActuallySettle);
				return wrapRes(req, res, 200, {success: true, settled: idsToActuallySettle});
			}
		
		}
	
	}

	wrapRes(req, res, 200, {success: true});

}