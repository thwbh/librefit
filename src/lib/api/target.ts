import { invoke } from '@tauri-apps/api/core';
import type { CalorieTarget, NewCalorieTarget, NewWeightTarget, WeightTarget } from '../model';

export const createCalorieTarget = async (calorieTarget: NewCalorieTarget): Promise<CalorieTarget> => {
	calorieTarget.targetCalories = +calorieTarget.targetCalories;
	calorieTarget.maximumCalories = +calorieTarget.maximumCalories;

	return invoke('create_calorie_target', { newTarget: calorieTarget });
};

export const createWeightTarget = async (weightTarget: NewWeightTarget): Promise<WeightTarget> => {
	weightTarget.targetWeight = +weightTarget.targetWeight;
	weightTarget.initialWeight = +weightTarget.initialWeight;

	return invoke('create_weight_target', { newTarget: weightTarget });
};
