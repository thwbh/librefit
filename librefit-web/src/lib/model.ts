// types/model.d.ts

export enum BmiCategory {
	Underweight = 'UNDERWEIGHT',
	Standard_Weight = 'STANDARD_WEIGHT',
	Overweight = 'OVERWEIGHT',
	Obese = 'OBESE',
	Severely_obese = 'SEVERELY_OBESE'
}

export enum CalculationGoal {
	Gain = 'GAIN',
	Loss = 'LOSS'
}

export enum CalculationSex {
	Male = 'MALE',
	Female=  'FEMALE'
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
}

export interface LibreUser {
	id: number;
	avatar?: string | null;
	name?: string | null;
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
	dateByRate: HashMap<i32, string>;
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
	targetDate: string;
}

export interface WizardTargetDateResult {
	resultByRate: Map<number, WizardResult>;
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
	valid: boolean,
	errorMessage?: string,
	skip?: boolean
}
