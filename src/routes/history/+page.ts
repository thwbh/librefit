import { subDays } from "date-fns";
import type { PageLoad } from "../$types";
import { getTrackerHistory } from "$lib/api/tracker-history";
import { getLastCalorieTarget } from "$lib/api/target";
import { getFoodCategories } from "$lib/api/food-categories";

export const load: PageLoad = async () => {
  const dateTo = new Date();
  const dateFrom = subDays(dateTo, 7);

  return {
    trackerHistory: await getTrackerHistory(dateFrom, dateTo),
    calorieTarget: await getLastCalorieTarget(),
    foodCategories: await getFoodCategories()
  };
};
