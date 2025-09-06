import type { WizardInput, WizardResult, WizardTargetWeightResult, NewCalorieTarget, NewWeightTarget } from '$lib/api/gen';
import { getDateAsStr } from '$lib/date';

export const convertFormDataToJson = (formData: FormData): object => {
  const json: any = {};
  formData.forEach((value, key) => (json[key] = value));

  return json;
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
    endDate: customWizardResult.dateByRate.get(selectedRate)!,
    targetCalories: wizardResult.tdee + multiplier * selectedRate,
    maximumCalories: wizardResult.tdee
  };

  const weightTarget: NewWeightTarget = {
    added: todayStr,
    startDate: getDateAsStr(startDate),
    endDate: customWizardResult.dateByRate.get(selectedRate)!,
    initialWeight: wizardInput.weight,
    targetWeight: targetWeight
  };

  return {
    calorieTarget,
    weightTarget
  };
};
