import { subMonths } from 'date-fns';
import { listCalorieTrackerRange } from '$lib/api/tracker';
import type { CalorieTracker } from '$lib/model';

export const load = async (): Promise<{ caloriesMonthList: Array<CalorieTracker> }> => {
	const today = new Date();
	const lastMonth = subMonths(today, 1);

	const monthList: Array<CalorieTracker> = await listCalorieTrackerRange(lastMonth, today);

	return {
		caloriesMonthList: monthList
	};
};
