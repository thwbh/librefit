import { getContext, setContext } from 'svelte';
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

const WIZARD_CONTEXT_KEY = Symbol('wizard-state');

/**
 * Set wizard state context - call this in Setup.svelte
 */
export function setWizardContext(state: WizardState) {
	setContext(WIZARD_CONTEXT_KEY, state);
}

/**
 * Get wizard state context - use in wizard step components
 * @throws Error if context not found
 */
export function getWizardContext(): WizardState {
	const state = getContext<WizardState>(WIZARD_CONTEXT_KEY);
	if (!state) {
		throw new Error(
			'Wizard context not found. Make sure setWizardContext() is called in Setup.svelte.'
		);
	}
	return state;
}

/**
 * Try to get wizard context without throwing
 * @returns WizardState or null if not found
 */
export function tryGetWizardContext(): WizardState | null {
	return getContext<WizardState | null>(WIZARD_CONTEXT_KEY) ?? null;
}
