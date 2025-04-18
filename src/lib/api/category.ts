import type { CalorieTracker, FoodCategory } from '../model';

export const getFoodCategoryLongvalue = (
  foodCategories: Array<FoodCategory>,
  shortvalue: string
): string => {
  return foodCategories.filter((fc) => fc.shortvalue === shortvalue)[0].longvalue;
};

export const skimCategories = (calorieTracker: Array<CalorieTracker>): Set<string> => {
  return new Set(calorieTracker.map((entry) => entry.category));
};
