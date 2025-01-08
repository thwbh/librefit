// Importing the required dependencies
import { expect, describe, it } from 'vitest';
import { getFieldError, validateAmount } from '../../src/lib/validation';

describe('validateAmount', () => {
	it('should return error when amount is null or undefined', () => {
		expect(validateAmount(null)).toBe('Please enter a valid amount.');
		expect(validateAmount(undefined)).toBe('Please enter a valid amount.');
	});

	it('should return error when amount is less than or equal to 0', () => {
		expect(validateAmount(0)).toBe('Please enter a valid amount.');
		expect(validateAmount(-1)).toBe('Please enter a valid amount.');
	});

	it('should not return error when amount is greater than 0', () => {
		expect(validateAmount(1)).toBeUndefined();
	});
});

describe('getFieldError', () => {
	const mockedResponse = {
		success: false,
		errors: [
			{ field: 'age', message: 'Invalid age.' },
			{ field: 'name', message: 'Invalid name.' }
		]
	};

	it('should return undefined when errorResponse is null or undefined', () => {
		expect(getFieldError(null, 'age')).toBeUndefined();
		expect(getFieldError(undefined, 'age')).toBeUndefined();
	});

	it('should return undefined when success property in errorResponse is true', () => {
		expect(getFieldError({ success: true }, 'age')).toBeUndefined();
	});

	it('should return undefined when there is no error for the specified field', () => {
		expect(getFieldError(mockedResponse, 'address')).toBeUndefined();
	});

	it('should return error message when there is an error for the specified field', () => {
		expect(getFieldError(mockedResponse, 'age')).toBe('Invalid age.');
		expect(getFieldError(mockedResponse, 'name')).toBe('Invalid name.');
	});
});
