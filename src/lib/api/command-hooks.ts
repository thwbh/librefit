/**
 * Reusable command hooks for tauri-typegen generated commands
 * Provides toast notifications for validation errors, invoke errors, and success messages
 */

import { toast } from '@thwbh/veilchen';
import { error as logError } from '@tauri-apps/plugin-log';
import { ZodError } from 'zod';
import type { CommandHooks } from './gen/commands';
import { formatZodError, formatInvokeError } from './error-formatter';

/**
 * Options for creating command hooks
 */
export interface HookOptions {
  /** Custom success message. If not provided, no success toast is shown */
  successMessage?: string;

  /** Custom error message prefix. Will be prepended to the actual error */
  errorContext?: string;

  /** Duration for success toast in milliseconds (default: 3000) */
  successDuration?: number;

  /** Duration for error toast in milliseconds (default: 5000) */
  errorDuration?: number;

  /** Whether to show validation errors as toasts (default: true) */
  showValidationErrors?: boolean;

  /** Whether to show invoke errors as toasts (default: true) */
  showInvokeErrors?: boolean;
}

/**
 * Create command hooks with toast notifications
 *
 * @example
 * ```typescript
 * import { createCalorieTrackerEntry } from '$lib/api/gen/commands';
 * import { createCommandHooks } from '$lib/api/command-hooks';
 *
 * const result = await createCalorieTrackerEntry(
 *   params,
 *   createCommandHooks({
 *     successMessage: 'Entry created successfully',
 *     errorContext: 'Failed to create calorie entry'
 *   })
 * );
 * ```
 *
 * @example With custom error handling
 * ```typescript
 * const hooks = createCommandHooks({
 *   successMessage: 'Saved!',
 *   errorContext: 'Save failed'
 * });
 *
 * // Add custom onSuccess behavior
 * const customHooks = {
 *   ...hooks,
 *   onSuccess: (result) => {
 *     hooks.onSuccess?.(result);
 *     // Custom logic here
 *     navigateToNextPage();
 *   }
 * };
 *
 * await updateUser(params, customHooks);
 * ```
 */
export function createCommandHooks<T>(options: HookOptions = {}): CommandHooks<T> {
  const {
    successMessage,
    errorContext,
    successDuration = 3000,
    errorDuration = 5000,
    showValidationErrors = true,
    showInvokeErrors = true
  } = options;

  return {
    onValidationError: (error: ZodError) => {
      const message = formatZodError(error);
      const fullMessage = errorContext ? `${errorContext}: ${message}` : message;

      // Log for debugging
      logError(`[Validation Error] ${fullMessage}`);

      // Show toast notification
      if (showValidationErrors) {
        toast.error(fullMessage, errorDuration);
      }
    },

    onInvokeError: (error: unknown) => {
      const message = formatInvokeError(error);
      const fullMessage = errorContext ? `${errorContext}: ${message}` : message;

      // Log for debugging
      logError(`[Invoke Error] ${fullMessage}`);

      // Show toast notification
      if (showInvokeErrors) {
        toast.error(fullMessage, errorDuration);
      }
    },

    onSuccess: successMessage
      ? () => {
        toast.success(successMessage, successDuration);
      }
      : undefined
  };
}

/**
 * Create hooks for silent operations (no toast notifications, only logging)
 * Useful for background operations or frequent API calls
 */
export function createSilentHooks<T>(errorContext?: string): CommandHooks<T> {
  return {
    onValidationError: (error: ZodError) => {
      const message = formatZodError(error);
      const fullMessage = errorContext ? `${errorContext}: ${message}` : message;
      logError(`[Validation Error] ${fullMessage}`);
    },

    onInvokeError: (error: unknown) => {
      const message = formatInvokeError(error);
      const fullMessage = errorContext ? `${errorContext}: ${message}` : message;
      logError(`[Invoke Error] ${fullMessage}`);
    }
  };
}

/**
 * Pre-configured hooks for common CRUD operations
 */
export const CommonHooks = {
  create: (entityName: string) =>
    createCommandHooks({
      successMessage: `${entityName} created successfully`,
      errorContext: `Failed to create ${entityName.toLowerCase()}`
    }),

  update: (entityName: string) =>
    createCommandHooks({
      successMessage: `${entityName} updated successfully`,
      errorContext: `Failed to update ${entityName.toLowerCase()}`
    }),

  delete: (entityName: string) =>
    createCommandHooks({
      successMessage: `${entityName} deleted successfully`,
      errorContext: `Failed to delete ${entityName.toLowerCase()}`
    }),

  /** For read operations - silent by default, only shows errors */
  read: (errorContext?: string) =>
    createCommandHooks({
      errorContext,
      showValidationErrors: true,
      showInvokeErrors: true
    })
};
