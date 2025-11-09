import type { FoodCategory } from '$lib/api/gen';


const categoryColors = new Map([
  ['b', 'bg-warning'],      // Breakfast → #f5b474 (warm orange)
  ['l', 'bg-success'],      // Lunch → #63ca7b (fresh green)
  ['d', 'bg-primary'],      // Dinner → oklch(52% 0.105 223) (cool blue)
  ['s', 'bg-secondary'],    // Snack → oklch(70% 0.183 293) (purple)
  ['t', 'bg-accent']        // Treat → oklch(82% 0.119 306) (pink/lavender)
]);
export const getFoodCategoryLongvalue = (
  foodCategories: Array<FoodCategory>,
  shortvalue: string
): string => {
  return foodCategories.filter((fc) => fc.shortvalue === shortvalue)[0].longvalue;
};

export const getFoodCategoryColor = (shortvalue: string): string => {
  return categoryColors.get(shortvalue)!;
}
