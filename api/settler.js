import { getSettlingPositionIDs } from '../lib/api.js'
import { initContract, wrapRes } from '../lib/utils.js'

export default async function main(req, res) {

	if (req && req.query.secret != process.env.SECRET) return;

	const contract = initContract(true);
	if (!contract) return wrapRes(req, res, 403, {error: 'Contract null.'});

	//await contract.settlePositions(['']);
	//return;

	let ids = await getSettlingPositionIDs();

	/*** Graph issues, get from events */
	const filter_new = contract.filters.NewPosition();
	const _events_new = await contract.queryFilter(filter_new, -10000);

	console.log('_events_new', _events_new);
	let new_position_ids = {};
	for (let ev of _events_new) {
		let positionId = ev.args.positionId && ev.args.positionId.toNumber();
		new_position_ids[positionId] = true;
	}

	let all_ids = ids.concat(Object.keys(new_position_ids));
	// unique
	all_ids = all_ids.filter((value, index, self) => {
		return self.indexOf(value) === index;
	});
	/***/

	console.log('all_ids', all_ids);

	if (all_ids.length > 0) {

		const canBeSettled = await contract.canSettlePositions(all_ids);
		
		console.log('canBeSettled', canBeSettled);

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