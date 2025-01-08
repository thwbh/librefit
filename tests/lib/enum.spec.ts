import { describe, expect, it } from 'vitest';
import { DataViews, enumKeys } from '../../src/lib/enum';

describe('Enum', () => {
	it('should correctly define DataViews', () => {
		expect(DataViews.Week).toBe('WEEK');
		expect(DataViews.Month).toBe('MONTH');
		expect(DataViews.Year).toBe('YEAR');
	});

	it('should correctly define enumKeys', () => {
		let obj = {
			a: 1,
			b: 2,
			3: 'c'
		};
		let keys = enumKeys(obj);

		expect(keys).toContain('a');
		expect(keys).toContain('b');
		expect(keys).not.toContain('3');
	});
});
