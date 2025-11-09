import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	ApiErrorType,
	extractErrorMessage,
	logApiError,
	type ApiError
} from '$lib/api/error-handler';
import { ZodError } from 'zod';

// Mock the Tauri logger
vi.mock('@tauri-apps/plugin-log', () => ({
	error: vi.fn()
}));

describe('error-handler', () => {
	describe('extractErrorMessage', () => {
		describe('ZodError handling', () => {
			it('should extract message from ZodError', () => {
				const zodError = new ZodError([
					{
						code: 'invalid_type',
						expected: 'string',
						received: 'number',
						path: ['field'],
						message: 'Expected string, received number'
					}
				]);

				const result = extractErrorMessage(zodError);

				expect(result.message).toBe('Expected string, received number');
				expect(result.type).toBe(ApiErrorType.VALIDATION);
				expect(result.originalError).toBe(zodError);
			});

			it('should handle ZodError with empty issues', () => {
				const zodError = new ZodError([]);

				const result = extractErrorMessage(zodError);

				expect(result.message).toBe('Invalid input data');
				expect(result.type).toBe(ApiErrorType.VALIDATION);
			});

			it('should handle ZodError with multiple issues', () => {
				const zodError = new ZodError([
					{
						code: 'too_small',
						minimum: 5,
						type: 'string',
						inclusive: true,
						exact: false,
						path: ['name'],
						message: 'String must contain at least 5 character(s)'
					},
					{
						code: 'invalid_type',
						expected: 'number',
						received: 'string',
						path: ['age'],
						message: 'Expected number, received string'
					}
				]);

				const result = extractErrorMessage(zodError);

				// Should use first error
				expect(result.message).toBe('String must contain at least 5 character(s)');
				expect(result.type).toBe(ApiErrorType.VALIDATION);
			});
		});

		describe('Error object handling', () => {
			it('should categorize validation errors', () => {
				const error = new Error('Validation failed: invalid email');

				const result = extractErrorMessage(error);

				expect(result.message).toBe('Validation failed: invalid email');
				expect(result.type).toBe(ApiErrorType.VALIDATION);
			});

			it('should categorize not found errors', () => {
				const error = new Error('User not found in database');

				const result = extractErrorMessage(error);

				expect(result.message).toBe('User not found in database');
				expect(result.type).toBe(ApiErrorType.NOT_FOUND);
			});

			it('should categorize permission errors', () => {
				const error = new Error('Permission denied: unauthorized access');

				const result = extractErrorMessage(error);

				expect(result.message).toBe('Permission denied: unauthorized access');
				expect(result.type).toBe(ApiErrorType.PERMISSION);
			});

			it('should categorize network errors', () => {
				const error = new Error('Network connection failed');

				const result = extractErrorMessage(error);

				expect(result.message).toBe('Network connection failed');
				expect(result.type).toBe(ApiErrorType.NETWORK);
			});

			it('should categorize unknown errors', () => {
				const error = new Error('Something went wrong');

				const result = extractErrorMessage(error);

				expect(result.message).toBe('Something went wrong');
				expect(result.type).toBe(ApiErrorType.UNKNOWN);
			});

			it('should be case insensitive for categorization', () => {
				const error = new Error('VALIDATION ERROR OCCURRED');

				const result = extractErrorMessage(error);

				expect(result.type).toBe(ApiErrorType.VALIDATION);
			});
		});

		describe('String error handling', () => {
			it('should handle string errors', () => {
				const result = extractErrorMessage('Something went wrong');

				expect(result.message).toBe('Something went wrong');
				expect(result.type).toBe(ApiErrorType.UNKNOWN);
				expect(result.originalError).toBe('Something went wrong');
			});

			it('should handle empty string', () => {
				const result = extractErrorMessage('');

				expect(result.message).toBe('');
				expect(result.type).toBe(ApiErrorType.UNKNOWN);
			});
		});

		describe('Object with message property', () => {
			it('should extract message from object', () => {
				const error = { message: 'Custom error object' };

				const result = extractErrorMessage(error);

				expect(result.message).toBe('Custom error object');
				expect(result.type).toBe(ApiErrorType.UNKNOWN);
			});

			it('should handle numeric message', () => {
				const error = { message: 404 };

				const result = extractErrorMessage(error);

				expect(result.message).toBe('404');
				expect(result.type).toBe(ApiErrorType.UNKNOWN);
			});
		});

		describe('Unknown error types', () => {
			it('should handle null', () => {
				const result = extractErrorMessage(null);

				expect(result.message).toBe('An unexpected error occurred');
				expect(result.type).toBe(ApiErrorType.UNKNOWN);
			});

			it('should handle undefined', () => {
				const result = extractErrorMessage(undefined);

				expect(result.message).toBe('An unexpected error occurred');
				expect(result.type).toBe(ApiErrorType.UNKNOWN);
			});

			it('should handle number', () => {
				const result = extractErrorMessage(42);

				expect(result.message).toBe('An unexpected error occurred');
				expect(result.type).toBe(ApiErrorType.UNKNOWN);
			});

			it('should handle boolean', () => {
				const result = extractErrorMessage(true);

				expect(result.message).toBe('An unexpected error occurred');
				expect(result.type).toBe(ApiErrorType.UNKNOWN);
			});

			it('should handle plain object without message', () => {
				const result = extractErrorMessage({ foo: 'bar' });

				expect(result.message).toBe('An unexpected error occurred');
				expect(result.type).toBe(ApiErrorType.UNKNOWN);
			});
		});
	});

	describe('logApiError', () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it('should log error and return ApiError', async () => {
			const { error: logError } = await import('@tauri-apps/plugin-log');
			const testError = new Error('Test error');

			const result = logApiError(testError);

			expect(result.message).toBe('Test error');
			expect(result.type).toBe(ApiErrorType.UNKNOWN);
			expect(logError).toHaveBeenCalledWith('[API Error] Test error - Type: unknown');
		});

		it('should include context in log message', async () => {
			const { error: logError } = await import('@tauri-apps/plugin-log');
			const testError = new Error('Failed to save');

			const result = logApiError(testError, 'User update');

			expect(result.message).toBe('Failed to save');
			expect(logError).toHaveBeenCalledWith(
				'[API Error] User update: Failed to save - Type: unknown'
			);
		});

		it('should work without context', async () => {
			const { error: logError } = await import('@tauri-apps/plugin-log');
			const testError = new Error('Generic error');

			logApiError(testError);

			expect(logError).toHaveBeenCalledWith('[API Error] Generic error - Type: unknown');
		});

		it('should handle ZodError with context', async () => {
			const { error: logError } = await import('@tauri-apps/plugin-log');
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					received: 'number',
					path: ['email'],
					message: 'Expected string, received number'
				}
			]);

			logApiError(zodError, 'Form validation');

			expect(logError).toHaveBeenCalledWith(
				'[API Error] Form validation: Expected string, received number - Type: validation'
			);
		});
	});
});
