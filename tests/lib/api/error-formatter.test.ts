import { describe, it, expect } from 'vitest';
import { formatError, formatZodError, formatInvokeError } from '$lib/api/error-formatter';
import { ZodError, type ZodIssue } from 'zod';

describe('error-formatter', () => {
	describe('formatZodError', () => {
		it('should format simple validation error', () => {
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					path: ['name'],
					message: 'Expected string, received number'
				} as ZodIssue
			]);

			const result = formatZodError(zodError);

			expect(result).toBe('name: Expected string, received number');
		});

		it('should format nested path', () => {
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					path: ['user', 'profile', 'email'],
					message: 'Required'
				} as ZodIssue
			]);

			const result = formatZodError(zodError);

			expect(result).toBe('user.profile.email: Required');
		});

		it('should format error without path', () => {
			const zodError = new ZodError([
				{
					code: 'custom',
					path: [],
					message: 'General validation error'
				}
			]);

			const result = formatZodError(zodError);

			expect(result).toBe('General validation error');
		});

		it('should use first error when multiple issues exist', () => {
			const zodError = new ZodError([
				{
					code: 'too_small',
					minimum: 5,
					inclusive: true,
					origin: 'string',
					path: ['password'],
					message: 'String must contain at least 5 character(s)'
				} as ZodIssue,
				{
					code: 'invalid_type',
					expected: 'string',
					path: ['email'],
					message: 'Required'
				} as ZodIssue
			]);

			const result = formatZodError(zodError);

			expect(result).toBe('password: String must contain at least 5 character(s)');
		});

		it('should handle empty issues array', () => {
			const zodError = new ZodError([]);

			const result = formatZodError(zodError);

			expect(result).toBe('Invalid input data');
		});

		it('should format array index in path', () => {
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					path: ['items', 0, 'name'],
					message: 'Expected string'
				} as ZodIssue
			]);

			const result = formatZodError(zodError);

			expect(result).toBe('items.0.name: Expected string');
		});
	});

	describe('formatInvokeError', () => {
		it('should format Error object', () => {
			const error = new Error('Database connection failed');

			const result = formatInvokeError(error);

			expect(result).toBe('Database connection failed');
		});

		it('should format string error', () => {
			const result = formatInvokeError('Something went wrong');

			expect(result).toBe('Something went wrong');
		});

		it('should format object with message property', () => {
			const error = { message: 'Custom error message' };

			const result = formatInvokeError(error);

			expect(result).toBe('Custom error message');
		});

		it('should handle numeric message', () => {
			const error = { message: 500 };

			const result = formatInvokeError(error);

			expect(result).toBe('500');
		});

		it('should handle null', () => {
			const result = formatInvokeError(null);

			expect(result).toBe('An unexpected error occurred');
		});

		it('should handle undefined', () => {
			const result = formatInvokeError(undefined);

			expect(result).toBe('An unexpected error occurred');
		});

		it('should handle number', () => {
			const result = formatInvokeError(404);

			expect(result).toBe('An unexpected error occurred');
		});

		it('should handle boolean', () => {
			const result = formatInvokeError(false);

			expect(result).toBe('An unexpected error occurred');
		});

		it('should handle object without message', () => {
			const error = { code: 'ERR_UNKNOWN', details: 'Some details' };

			const result = formatInvokeError(error);

			expect(result).toBe('An unexpected error occurred');
		});

		it('should handle empty string', () => {
			const result = formatInvokeError('');

			expect(result).toBe('');
		});
	});

	describe('formatError', () => {
		it('should delegate to formatZodError for ZodError', () => {
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					path: ['field'],
					message: 'Expected string'
				} as ZodIssue
			]);

			const result = formatError(zodError);

			expect(result).toBe('field: Expected string');
		});

		it('should delegate to formatInvokeError for Error', () => {
			const error = new Error('Test error');

			const result = formatError(error);

			expect(result).toBe('Test error');
		});

		it('should delegate to formatInvokeError for string', () => {
			const result = formatError('String error');

			expect(result).toBe('String error');
		});

		it('should delegate to formatInvokeError for unknown types', () => {
			const result = formatError(null);

			expect(result).toBe('An unexpected error occurred');
		});

		it('should handle complex ZodError', () => {
			const zodError = new ZodError([
				{
					code: 'too_big',
					maximum: 100,
					inclusive: true,
					origin: 'string',
					path: ['description'],
					message: 'String must contain at most 100 character(s)'
				} as ZodIssue
			]);

			const result = formatError(zodError);

			expect(result).toBe('description: String must contain at most 100 character(s)');
		});
	});
});
