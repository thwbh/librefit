import type { Component } from 'svelte';

export interface StepConfigEntry {
	title: string;
	subtitle: string;
	icon?: Component<Record<string, unknown>>;
}

const HOLD_STEP4_OVERRIDE = {
	title: 'Select Your Target Weight',
	subtitle: 'Choose a target weight within your healthy range'
} as const;

export function deriveStep4Title(
	stepConfig: readonly StepConfigEntry[],
	currentStep: number,
	recommendation: string
): StepConfigEntry {
	const base = stepConfig[currentStep - 1];
	if (currentStep === 4 && recommendation === 'HOLD') {
		return { ...base, ...HOLD_STEP4_OVERRIDE };
	}
	return base;
}
