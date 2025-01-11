import type { NewCalorieTarget, NewWeightTarget } from './model';

export class CheckboxEventTarget extends EventTarget {
  public checked: boolean = false;
}

export interface CaloriesModificationEvent {
  detail: {
    dateStr: string;
    value: number;
    category: string;
    description?: string | undefined;
    id?: number | undefined;
  };
}

export interface CaloriesDeletionEvent {
  detail: {
    id: number;
    dateStr: string;
  };
}

export interface WeightModificationEvent {
  detail: {
    dateStr: string;
    value: number;
    id?: number | undefined;
  };
}

export interface WeightDeletionEvent {
  detail: {
    id: number;
    dateStr: string;
  };
}

export interface WizardRateSelectionEvent {
  rate: number
}

export interface WizardTargetSelectionEvent {
  newWeightTarget: NewWeightTarget,
  newCalorieTarget: NewCalorieTarget
}
