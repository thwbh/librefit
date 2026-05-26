import { describe, test, it, expect } from 'vitest';
import type { FoodCategory } from '../../../src/lib/api/gen';
import {
	defaultCategoryForDate,
	defaultCategoryForHour,
	getFoodCategoryLongvalue
} from '../../../src/lib/api/category';

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

describe('defaultCategoryForHour', () => {
	it('[IT-006] Breakfast window 05–10: endpoints both default to b', () => {
		expect(defaultCategoryForHour(5)).toBe('b');
		expect(defaultCategoryForHour(10)).toBe('b');
		// midpoint sanity
		expect(defaultCategoryForHour(8)).toBe('b');
	});

	it('[IT-007] Lunch window 11–14: endpoints both default to l', () => {
		expect(defaultCategoryForHour(11)).toBe('l');
		expect(defaultCategoryForHour(14)).toBe('l');
		expect(defaultCategoryForHour(13)).toBe('l');
	});

	it('[IT-008] Dinner window 15–20: endpoints both default to d', () => {
		expect(defaultCategoryForHour(15)).toBe('d');
		expect(defaultCategoryForHour(20)).toBe('d');
		expect(defaultCategoryForHour(18)).toBe('d');
	});

	it('[IT-009] Snack: hours outside the meal windows default to s', () => {
		// first hour after dinner window
		expect(defaultCategoryForHour(21)).toBe('s');
		// last hour before breakfast window
		expect(defaultCategoryForHour(4)).toBe('s');
		// middle of the snack window
		expect(defaultCategoryForHour(2)).toBe('s');
	});
});

describe('defaultCategoryForDate', () => {
	it('forwards the local hour to defaultCategoryForHour', () => {
		const date = new Date();
		date.setHours(13, 0, 0, 0);
		expect(defaultCategoryForDate(date)).toBe('l');

		date.setHours(2, 0, 0, 0);
		expect(defaultCategoryForDate(date)).toBe('s');
	});
});
