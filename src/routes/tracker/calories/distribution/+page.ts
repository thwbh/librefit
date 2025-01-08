import { subMonths } from 'date-fns';
import { listCalorieTrackerRange } from '$lib/api/tracker';
import { getDateAsStr } from '$lib/date';
import type { CalorieTracker } from '$lib/model';
export const load = async ({ fetch }): Promise<{ caloriesMonthList: Array<CalorieTracker> }> => {
	const today = new Date();
	const lastMonth = subMonths(today, 1);

	const monthList: Array<CalorieTracker> = await listCalorieTrackerRange(getDateAsStr(lastMonth), getDateAsStr(today));

	return {
		caloriesMonthList: monthList
	};
};
