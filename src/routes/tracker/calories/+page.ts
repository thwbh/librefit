import { subDays } from 'date-fns';
import { listCalorieTrackerDatesRange, listCalorieTrackerRange } from '$lib/api/tracker';
import { getDateAsStr } from '$lib/date';
import type { CalorieTracker } from '$lib/model';

export const load = async ({ fetch }) => {
	const today = getDateAsStr(new Date());
	const fromDate = getDateAsStr(subDays(new Date(), 6));

	const trackedDaysWeek: Array<CalorieTracker> = await listCalorieTrackerDatesRange(
		fromDate,
		today
	);
	const calorieTrackerToday: Array<CalorieTracker> = await listCalorieTrackerRange(today, today);

	if (calorieTrackerToday && trackedDaysWeek) {
		return {
			availableDates: trackedDaysWeek,
			entryToday: calorieTrackerToday
		};
	} else {
		return { error: 'An error has occurred. Please try again later.' };
	}
};
