/** types.ts contains types exclusive to the UI */

import type { WizardOptions } from './enum';

export interface RadioInputChoice {
  value: string;
  label: string;
}

export interface WizardTargetSelection {
  customDetails: unknown;
  userChoice: WizardOptions;
}

export interface WizardTargetCaloriesError {
  targetCalories: { errorMessage: string };
  maximumCalories: { errorMessage: string };
}

export interface WizardTargetWeightError {
  initialWeight: { errorMessage: string };
  targetWeight: { errorMessage: string };
}

export interface WizardTargetError {
  valid: boolean;
  calorieTarget: WizardTargetCaloriesError;
  weightTarget: WizardTargetWeightError;
}
