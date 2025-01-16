import type { CalorieTarget, CalorieTracker, Dashboard, FoodCategory, ValidationMessage, WeightTarget, WeightTracker } from "./model";
import type { WizardTargetError } from "./types";

export interface CalorieTrackerComponentProps {
  calorieTracker?: Array<CalorieTracker>;
  categories: Array<FoodCategory>;
  calorieTarget: CalorieTarget;
}

export interface DashboardComponentProps {
  dashboardData: Dashboard;
  today: Date;
  // these properties needs to be passed as reactive
  caloriesTodayList?: Array<CalorieTracker>;
  calorieTarget?: CalorieTarget;
  caloriesWeekList?: Array<CalorieTracker>;
  weightTodayList?: Array<WeightTracker>;
  weightTarget?: WeightTarget;
  onAddWeight: (e: CustomEvent<any>) => void;
  onAddCalories: (e: CustomEvent<any>) => void;
  onUpdateCalories: (e: CustomEvent<any>) => void;
  onDeleteCalories: (e: CustomEvent<any>) => void;
  onUpdateWeight: (e: CustomEvent<any>) => void;
  onDeleteWeight: (e: CustomEvent<any>) => void;
  setCalorieTarget: (e: CustomEvent<any>) => void;
  setWeightTarget: (e: CustomEvent<any>) => void;
}

export interface TargetComponentProps {
  startDate: string;
  endDate: string;
  errors: WizardTargetError;
  errorEndDate?: ValidationMessage;
  weightTarget?: WeightTarget;
  calorieTarget?: CalorieTarget;
}


export interface ValidatedInputProps {
  value: any;
  name: string;
  label: string;
  type: string;
  styling?: string;
  placeholder?: string;
  unit?: string;
  validateDetail?: (e: any) => {};
  emptyMessage?: string;
  required?: boolean;
  readonly?: boolean;
  errorMessage?: string | undefined;
  validate?: () => {};
}

