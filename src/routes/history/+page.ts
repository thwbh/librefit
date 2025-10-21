import { subDays } from 'date-fns';
import type { PageLoad } from '../$types';
import { getTrackerHistory, getLastCalorieTarget, getFoodCategories } from '$lib/api/gen';
import { getDateAsStr } from '$lib/date';

export const load: PageLoad = async () => {
  const dateTo = subDays(new Date(), 1);
  const dateFrom = subDays(dateTo, 6);

  const dateFromStr = getDateAsStr(dateFrom);
  const dateToStr = getDateAsStr(dateTo);

  return {
    trackerHistory: await getTrackerHistory({ dateFromStr, dateToStr }),
    calorieTarget: await getLastCalorieTarget(),
    foodCategories: await getFoodCategories()
  };
};
