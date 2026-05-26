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
	it('[IT-006] defaults to Breakfast at 08:00', () => {
		expect(defaultCategoryForHour(8)).toBe('b');
	});

	it('[IT-007] defaults to Lunch at 13:00', () => {
		expect(defaultCategoryForHour(13)).toBe('l');
	});

	it('[IT-008] defaults to Dinner at 18:00', () => {
		expect(defaultCategoryForHour(18)).toBe('d');
	});

	it('[IT-009] defaults to Snack at 02:00', () => {
		expect(defaultCategoryForHour(2)).toBe('s');
	});

	it('[IT-028] returns Breakfast at the 05:00 lower bound of the breakfast window', () => {
		expect(defaultCategoryForHour(5)).toBe('b');
	});

	it('[IT-029] Breakfast/Lunch boundary: 10 → b, 11 → l', () => {
		expect(defaultCategoryForHour(10)).toBe('b');
		expect(defaultCategoryForHour(11)).toBe('l');
	});

	it('[IT-030] Lunch/Dinner boundary: 14 → l, 15 → d', () => {
		expect(defaultCategoryForHour(14)).toBe('l');
		expect(defaultCategoryForHour(15)).toBe('d');
	});

	it('[IT-031] Dinner/Snack boundary: 20 → d, 21 → s', () => {
		expect(defaultCategoryForHour(20)).toBe('d');
		expect(defaultCategoryForHour(21)).toBe('s');
	});

	it('[IT-032] Snack/Breakfast boundary: 4 → s', () => {
		expect(defaultCategoryForHour(4)).toBe('s');
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
