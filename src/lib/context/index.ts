/**
 * Context API Exports
 *
 * Centralized exports for all context providers and consumers.
 */

export { setUserContext, getUserContext, tryGetUserContext } from './user.svelte';

export {
  setCategoriesContext,
  getCategoriesContext,
  tryGetCategoriesContext,
  getCategoryByCode
} from './categories.svelte';

export {
  setWizardContext,
  getWizardContext,
  tryGetWizardContext,
  type WizardState
} from './wizard';
