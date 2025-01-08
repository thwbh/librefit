import { describe, it, expect } from 'vitest';
import {
	convertDateStrToDisplayDateStr, Daytime,
	default_date_format,
	display_date_format,
	getDateAsStr, getDaytimeFoodCategory, getDaytimeGreeting, getDisplayDateAsStr,
	parseStringAsDate
} from '../../src/lib/date';

describe('getDateAsStr function', () => {
	it('should return date string in default format', () => {
		const date = new Date(2022, 7, 1); // Note: Date month is 0-based.
		expect(getDateAsStr(date), default_date_format).toBe('2022-08-01');
	});

	it('should return date string in provided format', () => {
		const date = new Date(2022, 7, 1);
		expect(getDateAsStr(date, display_date_format)).toBe('01.08.2022');
	});
});

describe('parseStringAsDate function', () => {
	it('should parse date string in default format', () => {
		const dateString = '2022-08-01';
		expect(parseStringAsDate(dateString)).toEqual(new Date(2022, 7, 1));
	});

	it('should parse date string in provided format', () => {
		const dateString = '01.08.2022';
		expect(parseStringAsDate(dateString, display_date_format)).toEqual(new Date(2022, 7, 1));
	});

	it('should fail to parse invalid date string', () => {
		const result = parseStringAsDate('invalid-date');
		expect(isNaN(result.getTime())).toBe(true);
	});
});

describe('convertDateStrToDisplayDateStr function', () => {
	it('should convert date string from default to display format', () => {
		const dateString = '2022-08-01';
		expect(convertDateStrToDisplayDateStr(dateString)).toBe('01.08.2022');
	});

	it('should fail to convert invalid date string', () => {
		expect(() => convertDateStrToDisplayDateStr('invalid-date')).toThrow();
	});
});

describe('getDisplayDateAsStr function', () => {
	it('should get display date string in display format', () => {
		const date = new Date(2022, 7, 1);
		expect(getDisplayDateAsStr(date)).toBe('01.08.2022');
	});

	it('should get display date string in locale format', () => {
		const date = new Date(2022, 7, 1);
		expect(getDisplayDateAsStr(date, 'en-US')).toBe('8/1/2022');
	});
});

describe('getDaytimeGreeting function', () => {
	it('should return daytime greeting based on time', () => {
		expect(getDaytimeGreeting(new Date(2022, 7, 1, 9))).toBe(Daytime.Morning);
		expect(getDaytimeGreeting(new Date(2022, 7, 1, 14))).toBe(Daytime.Day);
		expect(getDaytimeGreeting(new Date(2022, 7, 1, 19))).toBe(Daytime.Night);
	});
});

describe('getDaytimeFoodCategory function', () => {
	it('should return food category based on time', () => {
		expect(getDaytimeFoodCategory(new Date(2022, 7, 1, 9))).toBe('b');
		expect(getDaytimeFoodCategory(new Date(2022, 7, 1, 14))).toBe('l');
		expect(getDaytimeFoodCategory(new Date(2022, 7, 1, 20))).toBe('d');
	});
});
