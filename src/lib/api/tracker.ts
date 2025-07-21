import { DataViews } from '../enum';
import { getDateAsStr } from '../date';
import { invoke } from '@tauri-apps/api/core';
import type {
  CalorieTracker,
  NewCalorieTracker,
  NewWeightTracker,
  WeightTracker
} from '$lib/model';

export const addCalories = (newEntry: NewCalorieTracker): Promise<CalorieTracker> => {
  return invoke('create_calorie_tracker_entry', { newEntry });
};

export const updateCalories = (calories: CalorieTracker): Promise<CalorieTracker> => {
  const entry: NewCalorieTracker = {
    added: calories.added,
    amount: calories.amount,
    category: calories.category,
    description: calories.description
  };

  return invoke('update_calorie_tracker_entry', {
    trackerId: calories.id,
    updatedEntry: entry
  });
};

export const deleteCalories = (calories: CalorieTracker): Promise<number> => {
  return invoke('delete_calorie_tracker_entry', {
    trackerId: calories.id
  });
};

export const listCalorieTrackerDatesRange = (
  dateFrom: Date,
  dateTo: Date
): Promise<Array<CalorieTracker>> => {
  return invoke('get_calorie_tracker_dates_in_range', {
    dateFromStr: getDateAsStr(dateFrom),
    dateToStr: getDateAsStr(dateTo)
  });
};

export const addWeight = (newEntry: NewWeightTracker): Promise<WeightTracker> => {
  return invoke('create_weight_tracker_entry', { newEntry });
};

export const updateWeight = (weight: WeightTracker): Promise<WeightTracker> => {
  const entry: NewWeightTracker = {
    added: weight.added,
    amount: weight.amount
  };

  return invoke('update_weight_tracker_entry', {
    trackerId: weight.id,
    updatedEntry: entry
  });
};

export const deleteWeight = (weight: WeightTracker): Promise<number> => {
  return invoke('delete_weight_tracker_entry', {
    trackerId: weight.id,
  });
};

export const listWeightRange = (dateFrom: Date, dateTo: Date): Promise<Array<WeightTracker>> => {
  return invoke('get_weight_tracker_for_date_range', {
    dateFromStr: dateFrom,
    dateToStr: dateTo
  });
};
