import type { FoodCategory } from '$lib/api/gen';

export const getFoodCategoryLongvalue = (
  foodCategories: Array<FoodCategory>,
  shortvalue: string
): string => {
  return foodCategories.filter((fc) => fc.shortvalue === shortvalue)[0].longvalue;
};

