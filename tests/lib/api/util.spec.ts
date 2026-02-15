import { describe, expect, test } from 'vitest';
import { convertFormDataToJson, createTargetWeightTargets } from '../../../src/lib/api/util';
import type { WizardInput, WizardResult, WizardTargetWeightResult } from '../../../src/lib/api/gen';
import { getDateAsStr } from '$lib/date';

// ============================================================================
// convertFormDataToJson TESTS
// ============================================================================

describe('convertFormDataToJson', () => {
	test('should correctly convert FormData to JSON object', () => {
		const formData = new FormData();
		formData.append('username', 'testUser');
		formData.append('password', 'testPass');

		const expectedJson = { username: 'testUser', password: 'testPass' };

		const result = convertFormDataToJson(formData);
		expect(result).toEqual(expectedJson);
	});

	test('should handle empty FormData', () => {
		const formData = new FormData();
		const result = convertFormDataToJson(formData);
		expect(result).toEqual({});
	});

	test('should handle multiple fields', () => {
		const formData = new FormData();
		formData.append('field1', 'value1');
		formData.append('field2', 'value2');
		formData.append('field3', 'value3');

		const result = convertFormDataToJson(formData);
		expect(result).toEqual({
			field1: 'value1',
			field2: 'value2',
			field3: 'value3'
		});
	});

	test('should handle numeric values as strings', () => {
		const formData = new FormData();
		formData.append('age', '25');
		formData.append('count', '100');

		const result = convertFormDataToJson(formData);
		expect(result).toEqual({
			age: '25',
			count: '100'
		});
	});

	test('should handle special characters in values', () => {
		const formData = new FormData();
		formData.append('name', "O'Brien");
		formData.append('description', 'Test & validate <input>');

		const result = convertFormDataToJson(formData);
		expect(result).toEqual({
			name: "O'Brien",
			description: 'Test & validate <input>'
		});
	});

	test('should override duplicate keys with last value', () => {
		const formData = new FormData();
		formData.append('key', 'first');
		formData.append('key', 'second');

		const result = convertFormDataToJson(formData);
		expect(result).toEqual({ key: 'second' });
	});
});

// ============================================================================
// createTargetWeightTargets TESTS
// ============================================================================

// Helper function to create complete WizardResult with defaults
function createWizardResult(overrides: Partial<WizardResult> = {}): WizardResult {
	return {
		tdee: 2500,
		bmr: 1800,
		bmi: 26.1,
		deficit: 500,
		target: 2000,
		bmiCategory: 'Overweight',
		recommendation: 'LOSE',
		targetBmi: 22.5,
		targetBmiUpper: 24.9,
		targetBmiLower: 18.5,
		targetWeight: 70,
		targetWeightUpper: 76,
		targetWeightLower: 57,
		durationDays: 90,
		durationDaysUpper: 120,
		durationDaysLower: 60,
		...overrides
	};
}

// Helper function to create complete WizardTargetWeightResult with defaults
function createWizardTargetWeightResult(
	overrides: Partial<WizardTargetWeightResult> = {}
): WizardTargetWeightResult {
	return {
		dateByRate: {
			250: '2026-06-15',
			500: '2026-04-15',
			750: '2026-03-15'
		},
		progressByRate: {
			250: 0.25,
			500: 0.5,
			750: 0.75
		},
		targetClassification: 'StandardWeight',
		warning: false,
		message: '',
		...overrides
	};
}

describe('createTargetWeightTargets', () => {
	test('should create targets for weight loss scenario', () => {
		const wizardInput: WizardInput = {
			weight: 80,
			height: 175,
			age: 30,
			sex: 'MALE',
			activityLevel: 1.25,
			weeklyDifference: 0.7,
			calculationGoal: 'LOSS'
		};

		const wizardResult = createWizardResult();
		const customWizardResult = createWizardTargetWeightResult();

		const startDate = new Date('2026-01-15');
		const targetWeight = 75;
		const selectedRate = 500;

		const result = createTargetWeightTargets(
			wizardInput,
			wizardResult,
			customWizardResult,
			startDate,
			targetWeight,
			selectedRate
		);

		// Verify calorie target
		expect(result.calorieTarget.targetCalories).toBe(2500 - 500);
		expect(result.calorieTarget.maximumCalories).toBe(2500);
		expect(result.calorieTarget.startDate).toBe('2026-01-15');
		expect(result.calorieTarget.endDate).toBe('2026-04-15');

		// Verify weight target
		expect(result.weightTarget.initialWeight).toBe(80);
		expect(result.weightTarget.targetWeight).toBe(75);
		expect(result.weightTarget.startDate).toBe('2026-01-15');
		expect(result.weightTarget.endDate).toBe('2026-04-15');
	});

	test('should create targets for weight gain scenario', () => {
		const wizardInput: WizardInput = {
			weight: 70,
			height: 180,
			age: 25,
			sex: 'MALE',
			activityLevel: 1.55,
			weeklyDifference: 0.5,
			calculationGoal: 'GAIN'
		};

		const wizardResult = createWizardResult({
			tdee: 3000,
			bmr: 1900,
			bmi: 21.6,
			recommendation: 'GAIN'
		});

		const customWizardResult = createWizardTargetWeightResult({
			dateByRate: {
				250: '2026-08-15',
				500: '2026-05-15',
				750: '2026-04-01'
			}
		});

		const startDate = new Date('2026-02-01');
		const targetWeight = 75;
		const selectedRate = 250;

		const result = createTargetWeightTargets(
			wizardInput,
			wizardResult,
			customWizardResult,
			startDate,
			targetWeight,
			selectedRate
		);

		// For weight gain, calories should be ADDED (positive multiplier)
		expect(result.calorieTarget.targetCalories).toBe(3000 + 250);
		expect(result.calorieTarget.maximumCalories).toBe(3000);
		expect(result.calorieTarget.endDate).toBe('2026-08-15');

		// Verify weight target
		expect(result.weightTarget.initialWeight).toBe(70);
		expect(result.weightTarget.targetWeight).toBe(75);
	});

	test('should handle aggressive weight loss rate', () => {
		const wizardInput: WizardInput = {
			weight: 100,
			height: 170,
			age: 35,
			sex: 'FEMALE',
			activityLevel: 1.2,
			weeklyDifference: 1.0,
			calculationGoal: 'LOSS'
		};

		const wizardResult = createWizardResult({
			tdee: 2000,
			bmr: 1500,
			bmi: 34.6,
			bmiCategory: 'Obese'
		});

		const customWizardResult = createWizardTargetWeightResult({
			dateByRate: {
				250: '2026-12-15',
				500: '2026-09-15',
				750: '2026-07-15'
			}
		});

		const startDate = new Date('2026-01-01');
		const targetWeight = 80;
		const selectedRate = 750;

		const result = createTargetWeightTargets(
			wizardInput,
			wizardResult,
			customWizardResult,
			startDate,
			targetWeight,
			selectedRate
		);

		expect(result.calorieTarget.targetCalories).toBe(2000 - 750);
		expect(result.calorieTarget.endDate).toBe('2026-07-15');
	});

	test('should include today as "added" date', () => {
		const todayStr = getDateAsStr(new Date());

		const wizardInput: WizardInput = {
			weight: 75,
			height: 175,
			age: 28,
			sex: 'MALE',
			activityLevel: 1.55,
			weeklyDifference: 0.5,
			calculationGoal: 'LOSS'
		};

		const wizardResult = createWizardResult({
			tdee: 2400,
			bmr: 1750,
			bmi: 24.5,
			bmiCategory: 'StandardWeight',
			recommendation: 'HOLD'
		});

		const customWizardResult = createWizardTargetWeightResult({
			dateByRate: {
				250: '2026-06-01',
				500: '2026-04-01',
				750: '2026-03-01'
			}
		});

		const startDate = new Date('2026-01-01');
		const targetWeight = 75;
		const selectedRate = 250;

		const result = createTargetWeightTargets(
			wizardInput,
			wizardResult,
			customWizardResult,
			startDate,
			targetWeight,
			selectedRate
		);

		expect(result.calorieTarget.added).toBe(todayStr);
		expect(result.weightTarget.added).toBe(todayStr);
	});

	test('should handle same current and target weight (maintenance)', () => {
		const wizardInput: WizardInput = {
			weight: 75,
			height: 175,
			age: 30,
			sex: 'MALE',
			activityLevel: 1.55,
			weeklyDifference: 0,
			calculationGoal: 'LOSS'
		};

		const wizardResult = createWizardResult({
			tdee: 2500,
			bmr: 1800,
			bmi: 24.5,
			bmiCategory: 'StandardWeight',
			recommendation: 'HOLD'
		});

		const customWizardResult = createWizardTargetWeightResult({
			dateByRate: {
				250: '2026-06-01',
				500: '2026-06-01',
				750: '2026-06-01'
			}
		});

		const startDate = new Date('2026-01-01');
		const targetWeight = 75;
		const selectedRate = 500;

		const result = createTargetWeightTargets(
			wizardInput,
			wizardResult,
			customWizardResult,
			startDate,
			targetWeight,
			selectedRate
		);

		// Multiplier should be -1 because targetWeight < wizardInput.weight evaluates to false
		// But since they're equal, the logic will use -1 (the else branch)
		expect(result.calorieTarget.targetCalories).toBe(2500 + 500);
	});

	test('should format dates correctly', () => {
		const wizardInput: WizardInput = {
			weight: 80,
			height: 175,
			age: 30,
			sex: 'MALE',
			activityLevel: 1.55,
			weeklyDifference: 0.5,
			calculationGoal: 'LOSS'
		};

		const wizardResult = createWizardResult();

		const customWizardResult = createWizardTargetWeightResult({
			dateByRate: {
				500: '2026-04-15'
			}
		});

		const startDate = new Date('2026-01-15');
		const targetWeight = 75;
		const selectedRate = 500;

		const result = createTargetWeightTargets(
			wizardInput,
			wizardResult,
			customWizardResult,
			startDate,
			targetWeight,
			selectedRate
		);

		// Verify date format (YYYY-MM-DD)
		expect(result.calorieTarget.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(result.calorieTarget.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(result.weightTarget.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(result.weightTarget.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	test('should use correct rate from dateByRate object', () => {
		const wizardInput: WizardInput = {
			weight: 90,
			height: 175,
			age: 40,
			sex: 'MALE',
			activityLevel: 1.2,
			weeklyDifference: 0.7,
			calculationGoal: 'LOSS'
		};

		const wizardResult = createWizardResult({
			tdee: 2200,
			bmr: 1650,
			bmi: 29.4,
			bmiCategory: 'Overweight'
		});

		const customWizardResult = createWizardTargetWeightResult({
			dateByRate: {
				250: '2026-10-01',
				500: '2026-07-01',
				750: '2026-05-15'
			}
		});

		const startDate = new Date('2026-01-01');
		const targetWeight = 75;

		// Test with 250 rate
		const result250 = createTargetWeightTargets(
			wizardInput,
			wizardResult,
			customWizardResult,
			startDate,
			targetWeight,
			250
		);
		expect(result250.calorieTarget.endDate).toBe('2026-10-01');

		// Test with 750 rate
		const result750 = createTargetWeightTargets(
			wizardInput,
			wizardResult,
			customWizardResult,
			startDate,
			targetWeight,
			750
		);
		expect(result750.calorieTarget.endDate).toBe('2026-05-15');
	});
});
