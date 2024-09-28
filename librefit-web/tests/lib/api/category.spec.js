import { describe, test, expect } from 'vitest';
import { getFoodCategoryLongvalue, skimCategories } from '$lib/api/category.js';

describe('category', () => {
	test('should return the correct long value of food category', () => {
		// set up some dummy data
		/** @type Array<FoodCategory> */
		const foodCategories = [
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
		// set up some dummy data
		const calorieTrackerEntries = [
			{ category: 'cat1' },
			{ category: 'cat2' },
			{ category: 'cat1' }
		];

		// call the function
		const result = skimCategories(calorieTrackerEntries);

		// assert that the function returns the expected result
		expect(result).toEqual(new Set(['cat1', 'cat2']));
	});
});
