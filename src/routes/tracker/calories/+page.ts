import { subDays } from 'date-fns';
import { listCalorieTrackerDatesRange, listCalorieTrackerRange } from '$lib/api/tracker';
import type { CalorieTracker } from '$lib/model';

export const load = async () => {
	const today = new Date();
	const fromDate = subDays(today, 6);

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
