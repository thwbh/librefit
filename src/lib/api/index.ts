/**
 * LibreFit API Layer
 *
 * This module provides the interface between the Svelte frontend and the Rust backend.
 *
 * ## Usage Guidelines
 *
 * ### Using Commands with Hooks (Recommended)
 * Import commands from `gen/commands` and use with pre-configured hooks for toast notifications:
 *
 * ```typescript
 * import { createCalorieTrackerEntry } from '$lib/api/gen/commands';
 * import { CommonHooks } from '$lib/api';
 *
 * // Automatically shows success/error toasts
 * const entry = await createCalorieTrackerEntry(
 *   { newEntry: { added: '2024-01-01', amount: 500, category: 'l' } },
 *   CommonHooks.create('Entry')
 * );
 * ```
 *
 * ### Custom Hook Configuration
 * For fine-grained control over notifications:
 *
 * ```typescript
 * import { createCalorieTrackerEntry } from '$lib/api/gen/commands';
 * import { createCommandHooks } from '$lib/api';
 *
 * const entry = await createCalorieTrackerEntry(
 *   params,
 *   createCommandHooks({
 *     successMessage: 'Entry saved!',
 *     errorContext: 'Failed to save entry',
 *     successDuration: 2000
 *   })
 * );
 * ```
 *
 * ### Silent Operations
 * For background operations or frequent calls without toast notifications:
 *
 * ```typescript
 * import { dailyDashboard } from '$lib/api/gen/commands';
 * import { createSilentHooks } from '$lib/api';
 *
 * // Only logs errors, no toasts
 * const dashboard = await dailyDashboard(
 *   { date: '2024-01-01' },
 *   createSilentHooks('Failed to load dashboard')
 * );
 * ```
 *
 * ### Extending Hooks
 * Add custom behavior while keeping toast notifications:
 *
 * ```typescript
 * import { updateUser } from '$lib/api/gen/commands';
 * import { createCommandHooks } from '$lib/api';
 *
 * const baseHooks = createCommandHooks({
 *   successMessage: 'Profile updated',
 *   errorContext: 'Failed to update profile'
 * });
 *
 * const result = await updateUser(params, {
 *   ...baseHooks,
 *   onSuccess: (user) => {
 *     baseHooks.onSuccess?.(user);
 *     // Custom logic
 *     goto('/profile');
 *   }
 * });
 * ```
 *
 * ### Type Definitions
 * Import types from `gen/types`:
 *
 * ```typescript
 * import type { CalorieTracker, NewCalorieTracker } from '$lib/api/gen/types';
 * ```
 */

// Export all generated commands
export * from './gen/commands';

// Export all generated types
export type * from './gen/types';

// Export hook utilities
export {
	createCommandHooks,
	createSilentHooks,
	CommonHooks,
	type HookOptions
} from './command-hooks';

// Export category utilities
export * from './category';

// Export utility functions
export * from './util';
