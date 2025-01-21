import type { HTMLCanvasAttributes } from "svelte/elements";
import type { CalorieTarget, CalorieTracker, Dashboard, FoodCategory, NewCalorieTracker, ValidationMessage, WeightTarget } from "./model";
import type { WizardTargetError } from "./types";
import type { ChartData, ChartOptions, ChartTypeRegistry, Point } from "chart.js";

export interface CalorieQuickviewProps {
  calorieTracker: Array<CalorieTracker>;
  calorieTarget: CalorieTarget;
  displayClass?: string;
  displayHeader?: boolean;
  headerText?: string;
}

export interface ChartProps<T extends keyof ChartTypeRegistry> extends HTMLCanvasAttributes {
  data: ChartData<T, (number | [number, number] | Point)[], unknown>;
  options: ChartOptions<T>;
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

