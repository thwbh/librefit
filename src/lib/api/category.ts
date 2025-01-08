import type { CalorieTracker, FoodCategory } from '../model';


export const getFoodCategoryLongvalue = (foodCategories: Array<FoodCategory>, shortvalue: string) => {
	return foodCategories.filter((fc) => fc.shortvalue === shortvalue)[0].longvalue;
};

/** @param calorieTracker {Array<CalorieTracker>} */
export const skimCategories = (calorieTracker: Array<CalorieTracker>) => {
	return new Set(calorieTracker.map((entry) => entry.category));
};
