import type { ChangeEventHandler } from 'svelte/elements';
import type { NewCalorieTarget, NewWeightTarget } from './model';

export interface ValidatedInputChangeEvent extends ChangeEventHandler<HTMLInputElement> {}

export class CheckboxEventTarget extends EventTarget {
	public checked: boolean = false;
}

export interface TrackerButtonEvent {
	callback: () => void;
	target?: HTMLButtonElement;
}

export interface TrackerInputDetails {
	id?: number;
	added: string;
	amount?: number;
	category?: string;
}

export interface TrackerInputEvent<T> {
	details: T;
	buttonEvent: TrackerButtonEvent;
}

export interface WizardRateSelectionEvent {
	rate: number;
}

export interface WizardTargetSelectionEvent {
	newWeightTarget: NewWeightTarget;
	newCalorieTarget: NewCalorieTarget;
}
