import { DataViews } from '../enum';
import { getDateAsStr, getDaytimeFoodCategory, parseStringAsDate } from '../date';
import { invoke } from '@tauri-apps/api/core';
import type {
  CalorieTracker,
  NewCalorieTracker,
  NewWeightTracker,
  WeightTracker
} from '$lib/model';

export const addCalories = (newEntry: NewCalorieTracker): Promise<Array<CalorieTracker>> => {
  return invoke('create_calorie_tracker_entry', { newEntry });
};

export const updateCalories = (
  calories: CalorieTracker
): Promise<Array<CalorieTracker>> => {
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

export const deleteCalories = (calories: CalorieTracker): Promise<Array<CalorieTracker>> => {
  return invoke('delete_calorie_tracker_entry', {
    trackerId: calories.id,
    addedStr: calories.added
  });
};

export const listCaloriesForDate = async (
  dateStr: string
): Promise<Array<CalorieTracker | NewCalorieTracker>> => {
  // add a blank entry for new input
  const blankEntry: NewCalorieTracker = {
    added: dateStr,
    amount: 0,
    category: getDaytimeFoodCategory(parseStringAsDate(dateStr)),
    description: ''
  };

  return listCalorieTrackerRange(dateStr, dateStr).then(async (response) => {
    const ctList: Array<CalorieTracker | NewCalorieTracker> = response;
    ctList.unshift(blankEntry);

    return Promise.resolve(ctList);
  });
};

export const listCalorieTrackerDatesRange = (
  dateFrom: string,
  dateTo: string
): Promise<Array<CalorieTracker>> => {
  return invoke('get_calorie_tracker_dates_in_range', {
    dateFromStr: dateFrom,
    dateToStr: dateTo
  });
};

export const listCalorieTrackerRange = (
  dateFrom: string,
  dateTo: string
): Promise<Array<CalorieTracker>> => {
  return invoke('get_calorie_tracker_for_date_range', {
    dateFromStr: dateFrom,
    dateToStr: dateTo
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

  return listCalorieTrackerRange(getDateAsStr(fromDate), getDateAsStr(toDate));
};

export const addWeight = (newEntry: NewWeightTracker): Promise<Array<WeightTracker>> => {
  return invoke('create_weight_tracker_entry', { newEntry });
};

export const updateWeight = (weight: WeightTracker): Promise<Array<WeightTracker>> => {
  const entry: NewWeightTracker = {
    added: weight.added,
    amount: weight.amount
  };

  return invoke('update_weight_tracker_entry', {
    trackerId: weight.id,
    updatedEntry: entry
  });
};

export const deleteWeight = (weight: WeightTracker): Promise<Array<WeightTracker>> => {
  return invoke('delete_weight_tracker_entry', {
    trackerId: weight.id,
    addedStr: weight.added
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

export const listWeightRange = (
  dateFrom: string,
  dateTo: string
): Promise<Array<WeightTracker>> => {
  return invoke('get_weight_tracker_for_date_range', {
    dateFromStr: dateFrom,
    dateToStr: dateTo
  });
};
