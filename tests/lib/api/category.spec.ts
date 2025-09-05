import { describe, test, expect } from 'vitest';
import type { FoodCategory } from '../../../src/lib/model';
import { getFoodCategoryLongvalue } from '../../../src/lib/api/category';

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
});
