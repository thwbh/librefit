/**
 * Centralized error handling for Tauri API calls
 * Provides user-friendly error messages and structured error information
 */

import { error as logError } from '@tauri-apps/plugin-log';
import { ZodError } from 'zod';

/**
 * Error types for categorizing different error scenarios
 */
export enum ApiErrorType {
	VALIDATION = 'validation',
	NETWORK = 'network',
	NOT_FOUND = 'not_found',
	PERMISSION = 'permission',
	UNKNOWN = 'unknown'
}

/**
 * Structured error information
 */
export interface ApiError {
	message: string;
	type: ApiErrorType;
	originalError: unknown;
}

/**
 * Extract user-friendly error message from various error types
 */
export function extractErrorMessage(error: unknown): ApiError {
	// Zod validation errors - extract first meaningful error
	if (error instanceof ZodError) {
		const issues = error.issues;
		if (issues && issues.length > 0) {
			const firstError = issues[0];
			return {
				message: firstError.message || 'Invalid input data',
				type: ApiErrorType.VALIDATION,
				originalError: error
			};
		}
		return {
			message: 'Invalid input data',
			type: ApiErrorType.VALIDATION,
			originalError: error
		};
	}

	// Standard Error objects
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		// Categorize by error message patterns
		if (message.includes('validation') || message.includes('invalid')) {
			return { message: error.message, type: ApiErrorType.VALIDATION, originalError: error };
		}
		if (message.includes('not found') || message.includes('no such')) {
			return { message: error.message, type: ApiErrorType.NOT_FOUND, originalError: error };
		}
		if (message.includes('permission') || message.includes('unauthorized')) {
			return { message: error.message, type: ApiErrorType.PERMISSION, originalError: error };
		}
		if (message.includes('network') || message.includes('connection')) {
			return { message: error.message, type: ApiErrorType.NETWORK, originalError: error };
		}

		return { message: error.message, type: ApiErrorType.UNKNOWN, originalError: error };
	}

	// String errors
	if (typeof error === 'string') {
		return { message: error, type: ApiErrorType.UNKNOWN, originalError: error };
	}

	// Object with message property
	if (typeof error === 'object' && error !== null && 'message' in error) {
		return {
			message: String(error.message),
			type: ApiErrorType.UNKNOWN,
			originalError: error
		};
	}

	return {
		message: 'An unexpected error occurred',
		type: ApiErrorType.UNKNOWN,
		originalError: error
	};
}

/**
 * Log API errors for debugging
 *
 * @param error - The error to log
 * @param context - Optional context about where the error occurred
 */
export function logApiError(error: unknown, context?: string): ApiError {
	const apiError = extractErrorMessage(error);
	const fullMessage = context ? `${context}: ${apiError.message}` : apiError.message;

	// Log to Tauri logger for debugging
	logError(`[API Error] ${fullMessage} - Type: ${apiError.type}`);

	return apiError;
}
