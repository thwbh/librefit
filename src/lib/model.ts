// types/model.ts

/** contains types shared between UI and backend */

export enum BmiCategory {
  Underweight = 'Underweight',
  Standard_Weight = 'StandardWeight',
  Overweight = 'Overweight',
  Obese = 'Obese',
  Severely_obese = 'SeverelyObese'
}

export enum CalculationGoal {
  Gain = 'GAIN',
  Loss = 'LOSS'
}

export enum CalculationSex {
  Male = 'MALE',
  Female = 'FEMALE'
}

export enum WizardRecommendation {
  Hold = 'HOLD',
  Lose = 'LOSE',
  Gain = 'GAIN'
}

export interface Dashboard {
  userData: LibreUser;
  calorieTarget?: CalorieTarget | null;
  caloriesTodayList: CalorieTracker[];
  caloriesWeekList: CalorieTracker[];
  weightTarget?: WeightTarget | null;
  weightTodayList: WeightTracker[];
  weightMonthList: WeightTracker[];
  foodCategories: FoodCategory[];
  currentDay: number;
}

export interface CalorieChartData {
  avg: number;
  min: number;
  max: number;
  legend: Array<string>;
  values: Array<number>;
  categoryAverage: Map<string, number>;
  dailyAverage: number;
}

export interface WeightChartData {
  avg: number;
  min: number;
  max: number;
  legend: Array<string>;
  values: Array<number>;
}

export interface TrackerProgress {
  calorieTarget: CalorieTarget;
  weightTarget: WeightTarget;
  daysPassed: number;
  daysTotal: number;
  calorieChartData: CalorieChartData;
  weightChartData: WeightChartData;
}

export interface TrackerHistory {
  caloriesHistory: Map<string, Array<CalorieTracker>>;
  caloriesAverage: number;
  weightHistory: Map<string, Array<WeightTracker>>;
  dateLastStr: string;
}

export interface LibreUser {
  id: number;
  avatar?: string | null;
  name?: string | null;
}

export interface BodyData {
  id: number;
  age: number;
  height: number;
  weight: number;
  sex: CalculationSex;
}

export interface CalorieTracker {
  id: number;
  added: string;
  amount: number;
  category: string;
  description?: string | null;
}

export interface WeightTracker {
  id: number;
  added: string;
  amount: number;
}

export interface FoodCategory {
  longvalue: string;
  shortvalue: string;
}

export interface CalorieTarget {
  id: number;
  added: string;
  endDate: string;
  maximumCalories: number;
  startDate: string;
  targetCalories: number;
}

export interface WeightTarget {
  id: number;
  added: string;
  endDate: string;
  initialWeight: number;
  startDate: string;
  targetWeight: number;
}

export interface NewCalorieTracker {
  added: string;
  amount: number;
  category: string;
  description: string;
}

export interface NewWeightTracker {
  added: string;
  amount: number;
}

export interface NewFoodCategory {
  longvalue: string;
  shortvalue: string;
}

export interface NewCalorieTarget {
  added: string;
  endDate: string;
  maximumCalories: number;
  startDate: string;
  targetCalories: number;
}

export interface NewWeightTarget {
  added: string;
  endDate: string;
  initialWeight: number;
  startDate: string;
  targetWeight: number;
}

export interface Wizard {
  calorieTarget: NewCalorieTarget;
  weightTarget: NewWeightTarget;
  weightTracker: NewWeightTracker;
}

export interface WizardInput {
  age: number;
  sex: CalculationSex;
  weight: number;
  height: number;
  activityLevel: number;
  weeklyDifference: number;
  calculationGoal: CalculationGoal;
}

export interface WizardResult {
  bmr: number;
  tdee: number;
  deficit: number;
  target: number;
  bmi: number;
  bmiCategory: BmiCategory;
  recommendation: WizardRecommendation;
  targetBmi: number;
  targetBmiUpper: number;
  targetBmiLower: number;
  targetWeight: number;
  targetWeightUpper: number;
  targetWeightLower: number;
  durationDays: number;
  durationDaysUpper: number;
  durationDaysLower: number;
}

export interface WizardTargetWeightInput {
  age: number;
  sex: CalculationSex;
  currentWeight: number;
  height: number;
  targetWeight: number;
  startDate: string;
}

export interface WizardTargetWeightResult {
  dateByRate: Map<number, string>;
  progressByRate: Map<number, number>;
  targetClassification: BmiCategory;
  warning: boolean;
  message: string;
}

export interface WizardTargetDateInput {
  age: number;
  sex: CalculationSex;
  currentWeight: number;
  height: number;
  calculationGoal: CalculationGoal;
  startDate: string;
  targetDate: string;
}

export interface WizardTargetDateResult {
  weightByRate: Map<number, number>;
  bmiByRate: Map<number, number>;
  targetClassification: BmiCategory;
  warning: boolean;
  message: string;
}

export interface ErrorDescription {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: boolean;
  errors?: Array<ErrorDescription>;
}

export interface ValidationMessage {
  valid: boolean;
  errorMessage?: string;
  skip?: boolean;
}
