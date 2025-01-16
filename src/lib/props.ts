import type { CalorieTarget, CalorieTracker, Dashboard, FoodCategory, ValidationMessage, WeightTarget, WeightTracker } from "./model";
import type { WizardTargetError } from "./types";

export interface CalorieTrackerComponentProps {
  calorieTracker?: Array<CalorieTracker>;
  categories: Array<FoodCategory>;
  calorieTarget: CalorieTarget;
}

export interface DashboardComponentProps {
  dashboardData: Dashboard;
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

