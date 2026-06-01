import { createContext } from 'svelte';
import type {
	LibreUser,
	NewIntakeTarget,
	NewWeightTarget,
	WizardInput,
	WizardResult
} from '$lib/api/gen';

/**
 * Wizard state shared across wizard steps
 */
export interface WizardState {
	wizardResult?: WizardResult;
	wizardInput: WizardInput;
	userData: LibreUser;
	chosenRate: number;
	weightTarget?: NewWeightTarget;
	intakeTarget?: NewIntakeTarget;
}

/**
 * Create wizard context getter/setter pair.
 *
 * Uses `createContext` (Svelte 5.40+) which enables the wrapper pattern for
 * testing: a wrapper component can call the setter during initialization and
 * the context becomes available to child components rendered by `mount`/`render`.
 */
export const [getWizardContext, setWizardContext] = createContext<WizardState>();

export function tryGetWizardContext(): WizardState | null {
	try {
		return getWizardContext();
	} catch {
		return null;
	}
}
