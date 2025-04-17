import { DataViews } from '../enum';
import { getDateAsStr, getDaytimeFoodCategory } from '../date';
import { invoke } from '@tauri-apps/api/core';
import type {
  CalorieTracker,
  NewCalorieTracker,
  NewWeightTracker,
  WeightTracker
} from '$lib/model';

export type CalorieTrackerCallback = (
  calories: NewCalorieTracker | CalorieTracker,
  callback: () => void
) => void;

export type WeightTrackerCallback = (
  weight: NewWeightTracker | WeightTracker,
  callback: () => void
) => void;

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

export const listCaloriesForDate = async (
  date: Date
): Promise<Array<CalorieTracker | NewCalorieTracker>> => {
  // add a blank entry for new input
  const blankEntry: NewCalorieTracker = {
    added: getDateAsStr(date),
    amount: 0,
    category: getDaytimeFoodCategory(date),
    description: ''
  };

  return listCalorieTrackerRange(date, date).then(async (response) => {
    const ctList: Array<CalorieTracker | NewCalorieTracker> = response;
    ctList.unshift(blankEntry);

    return Promise.resolve(ctList);
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

export const listCalorieTrackerRange = (
  dateFrom: Date,
  dateTo: Date
): Promise<Array<CalorieTracker>> => {
  return invoke('get_calorie_tracker_for_date_range', {
    dateFromStr: getDateAsStr(dateFrom),
    dateToStr: getDateAsStr(dateTo)
  });
};

export const listCaloriesFiltered = (filter: DataViews): Promise<Array<CalorieTracker>> => {
  const fromDate = new Date();
  const toDate = new Date();

  switch (filter) {
    case DataViews.Week:
      fromDate.setDate(fromDate.getDate() - 7);
      break;
    case DataViews.Month:
      fromDate.setMonth(fromDate.getMonth() - 1);
      break;
    case DataViews.Year:
      fromDate.setFullYear(fromDate.getFullYear() - 1);
      break;
    default:
      break;
  }

  return listCalorieTrackerRange(fromDate, toDate);
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

export const listWeightFiltered = (filter: DataViews): Promise<Array<WeightTracker>> => {
  const fromDate = new Date();
  const toDate = new Date();

  switch (filter) {
    case DataViews.Week:
      fromDate.setDate(fromDate.getDate() - 7);
      break;
    case DataViews.Month:
      fromDate.setMonth(fromDate.getMonth() - 1);
      break;
    case DataViews.Year:
      fromDate.setFullYear(fromDate.getFullYear() - 1);
      break;
    default:
      break;
  }

  return invoke('get_weight_tracker_for_date_range', {
    dateFromStr: getDateAsStr(fromDate),
    dateToStr: getDateAsStr(toDate)
  });
};

export const listWeightRange = (dateFrom: Date, dateTo: Date): Promise<Array<WeightTracker>> => {
  return invoke('get_weight_tracker_for_date_range', {
    dateFromStr: dateFrom,
    dateToStr: dateTo
  });
};
