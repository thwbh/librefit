import { getDateAsStr } from '$lib/date';
import { listWeightRange } from '$lib/api/tracker';

export const load = async () => {
	const today = new Date();
	const fromDate = new Date();
	fromDate.setMonth(fromDate.getMonth() - 1);

	const listWeightResponse = await listWeightRange(getDateAsStr(fromDate), getDateAsStr(today));

	return {
		entries: listWeightResponse
	};
};
