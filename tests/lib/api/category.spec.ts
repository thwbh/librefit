import { describe, test, expect } from 'vitest';
import type { CalorieTracker, FoodCategory } from '../../../src/lib/model';
import { getFoodCategoryLongvalue, skimCategories } from '../../../src/lib/api/category';

describe('category', () => {
  test('should return the correct long value of food category', () => {
    // set up some dummy data
    /** @type Array<FoodCategory> */
    const foodCategories: Array<FoodCategory> = [
      { shortvalue: 'f1', longvalue: 'Food1' },
      { shortvalue: 'f2', longvalue: 'Food2' },
      { shortvalue: 'f3', longvalue: 'Food3' }
    ];
    const shortvalue = 'f2';

    // call the function
    const result = getFoodCategoryLongvalue(foodCategories, shortvalue);

    // assert that the function returns the expected result
    expect(result).toBe('Food2');
  });

  test('should return the unique categories from the entries', () => {
    const calorieTrackers: CalorieTracker[] = [
      {
        id: 1,
        added: '2023-10-25',
        amount: 500,
        category: 'Breakfast',
        description: 'Oatmeal with fruits'
      },
      {
        id: 2,
        added: '2023-10-25',
        amount: 700,
        category: 'Lunch',
        description: 'Grilled chicken salad'
      },
      {
        id: 3,
        added: '2023-10-25',
        amount: 300,
        category: 'Snack',
        description: 'Greek yogurt'
      },
      {
        id: 4,
        added: '2023-10-25',
        amount: 100,
        category: 'Snack',
        description: 'Flatbread'
      }
    ];

    // call the function
    const result = skimCategories(calorieTrackers);

    // assert that the function returns the expected result
    expect(result).toEqual(new Set(['Breakfast', 'Lunch', 'Snack']));
  });
});
