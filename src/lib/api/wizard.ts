import { getDateAsStr, parseStringAsDate } from '$lib/date';
import { CalculationGoal } from '$lib/model';
import type {
  NewCalorieTarget,
  NewWeightTarget,
  Wizard,
  WizardInput,
  WizardResult,
  WizardTargetDateInput,
  WizardTargetDateResult,
  WizardTargetWeightInput,
  WizardTargetWeightResult
} from '$lib/model';
import { isAfter } from 'date-fns';
import { invoke } from '@tauri-apps/api/core';

export const calculateTdee = async (wizardInput: WizardInput): Promise<WizardResult> => {
  wizardInput.age = +wizardInput.age;
  wizardInput.weight = +wizardInput.weight;
  wizardInput.height = +wizardInput.height;
  wizardInput.weeklyDifference = +wizardInput.weeklyDifference;

  return invoke('wizard_calculate_tdee', {
    input: wizardInput
  });
};

export const postWizardResult = async (wizard: Wizard): Promise<void> => {
  wizard.weightTarget.initialWeight = +wizard.weightTarget.initialWeight;
  wizard.weightTarget.targetWeight = +wizard.weightTarget.targetWeight;

  wizard.weightTracker.amount = +wizard.weightTracker.amount;

  wizard.calorieTarget.targetCalories = +wizard.calorieTarget.targetCalories;
  wizard.calorieTarget.maximumCalories = +wizard.calorieTarget.maximumCalories;

  return invoke('wizard_create_targets', {
    input: wizard
  });
};

export const calculateForTargetDate = async (
  wizardTargetDateInput: WizardTargetDateInput
): Promise<WizardTargetDateResult> => {
  return invoke('wizard_calculate_for_target_date', {
    input: wizardTargetDateInput
  });
};

export const calculateForTargetWeight = async (
  wizardTargetWeightInput: WizardTargetWeightInput
): Promise<WizardTargetWeightResult> => {
  wizardTargetWeightInput.targetWeight = +wizardTargetWeightInput.targetWeight;

  return invoke('wizard_calculate_for_target_weight', {
    input: wizardTargetWeightInput
  });
};

export const createTargetWeightTargets = (
  wizardInput: WizardInput,
  wizardResult: WizardResult,
  customWizardResult: WizardTargetWeightResult,
  startDate: Date,
  targetWeight: number,
  selectedRate: number
): { calorieTarget: NewCalorieTarget; weightTarget: NewWeightTarget } => {
  const multiplier = targetWeight < wizardInput.weight ? -1 : 1;
  const todayStr = getDateAsStr(new Date());

  const calorieTarget: NewCalorieTarget = {
    added: todayStr,
    startDate: getDateAsStr(startDate),
    endDate: customWizardResult.dateByRate[selectedRate],
    targetCalories: wizardResult.tdee + multiplier * selectedRate,
    maximumCalories: wizardResult.tdee
  };

  const weightTarget: NewWeightTarget = {
    added: todayStr,
    startDate: getDateAsStr(startDate),
    endDate: customWizardResult.dateByRate[selectedRate],
    initialWeight: wizardInput.weight,
    targetWeight: targetWeight
  };

  return {
    calorieTarget,
    weightTarget
  };
};

export const createTargetDateTargets = (
  wizardInput: WizardInput,
  wizardResult: WizardResult,
  customWizardResult: WizardTargetDateResult,
  startDate: Date,
  endDateStr: string,
  selectedRate: string
): { calorieTarget: NewCalorieTarget; weightTarget: NewWeightTarget } => {
  const multiplier = wizardInput.calculationGoal === CalculationGoal.Loss ? -1 : 1;
  const todayStr = getDateAsStr(new Date());

  const calorieTarget: NewCalorieTarget = {
    added: todayStr,
    startDate: getDateAsStr(startDate),
    endDate: endDateStr,
    targetCalories: wizardResult.tdee + multiplier * parseFloat(selectedRate),
    maximumCalories: wizardResult.tdee
  };

  const weightTarget: NewWeightTarget = {
    added: todayStr,
    startDate: getDateAsStr(startDate),
    endDate: endDateStr,
    initialWeight: wizardInput.weight,
    targetWeight: customWizardResult.weightByRate[selectedRate]
  };

  return {
    calorieTarget,
    weightTarget
  };
};

export const validateCustomWeight = (detail: {
  value: number;
}): { valid: boolean; errorMessage?: string } => {
  if (detail.value < 30 || detail.value > 300) {
    return {
      valid: false,
      errorMessage: 'Please provide a weight between 30kg and 300kg.'
    };
  }

  return { valid: true };
};

export const validateCustomDate = (detail: {
  value: string;
}): { valid: boolean; errorMessage?: string } => {
  if (isAfter(new Date(), parseStringAsDate(detail.value))) {
    return {
      valid: false,
      errorMessage: 'Your target date lies in the past.'
    };
  }

  return { valid: true };
};
