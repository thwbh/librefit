/**
 * Error formatting utilities for API errors and validation errors
 */

import type { ZodError } from 'zod';
import { ZodError as ZodErrorClass } from 'zod';

export function formatError(error: ZodError | unknown) {
  if (error instanceof ZodErrorClass) {
    return formatZodError(error);
  }

  return formatInvokeError(error);
}

/**
 * Extract user-friendly error message from Zod validation error
 */
export function formatZodError(error: ZodError): string {
  const issues = error.issues;
  if (issues && issues.length > 0) {
    const firstError = issues[0];
    const path = firstError.path.length > 0 ? `${firstError.path.join('.')}: ` : '';
    return `${path}${firstError.message}`;
  }
  return 'Invalid input data';
}

/**
 * Extract user-friendly error message from unknown error
 */
export function formatInvokeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return 'An unexpected error occurred';
}
