import { subDays } from 'date-fns';
import type { PageLoad } from './$types';
import { getTrackerHistory, getLastIntakeTarget } from '$lib/api/gen';
import { getDateAsStr } from '$lib/date';

/**
 * History page loader
 *
 * This loader only fetches history-specific data.
 */
export const load: PageLoad = async ({ parent }) => {
	// Wait for layout data to be available
	await parent();

	const dateTo = subDays(new Date(), 1);
	const dateFrom = subDays(dateTo, 6);

	const dateFromStr = getDateAsStr(dateFrom);
	const dateToStr = getDateAsStr(dateTo);

	return {
		trackerHistory: await getTrackerHistory({ dateFromStr, dateToStr }),
		calorieTarget: await getLastIntakeTarget()
	};
};
