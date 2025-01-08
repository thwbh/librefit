import { subDays } from 'date-fns';
import { listWeightRange } from '$lib/api/tracker';
import { getDateAsStr } from '$lib/date';

export const load = async ({ fetch }) => {
	const today = new Date();
	const fromDate = subDays(today, 6);	

	return {
		weightWeekList: await listWeightRange(getDateAsStr(fromDate), getDateAsStr(today))
	};
};
