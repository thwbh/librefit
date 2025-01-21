import { parseStringAsDate } from './date';
import { isAfter } from 'date-fns';
import type {
	CalorieTarget,
	ErrorDescription,
	ErrorResponse,
	ValidationMessage,
	WeightTarget
} from './model';

export const validateAmount = (amount: number | undefined): string => {
	if (!amount || amount <= 0) {
		return 'Please enter a valid amount.';
	}
};

export const getFieldError = (
	errorResponse: ErrorResponse,
	fieldName: string
): undefined | string => {
	if (!errorResponse || errorResponse.success) {
		return undefined;
	}

	const descriptions: Array<ErrorDescription> = errorResponse.errors;
	const description: ErrorDescription = descriptions.filter(
		(description) => description.field === fieldName
	)[0];

	return description ? description.message : undefined;
};

export const validateCalorieTarget = (
	target: CalorieTarget
): {
	endDate: ValidationMessage;
	targetCalories: ValidationMessage;
	maximumCalories: ValidationMessage;
} => {
	let endDateValidation = validateEndDate(target.startDate, target.endDate);
	let targetCaloriesValidation = validateTargetAmount({ value: target.targetCalories });
	let maximumCaloriesValidation = validateTargetAmount({ value: target.maximumCalories });

	if (maximumCaloriesValidation.valid) {
		maximumCaloriesValidation =
			target.targetCalories > target.maximumCalories
				? { valid: false, errorMessage: 'Maximum calories should be greater than target calories.' }
				: maximumCaloriesValidation;
	}

	return {
		endDate: endDateValidation,
		targetCalories: targetCaloriesValidation,
		maximumCalories: maximumCaloriesValidation
	};
};

export const validateWeightTarget = (
	target: WeightTarget
): {
	endDate: ValidationMessage;
	initialWeight: ValidationMessage;
	targetWeight: ValidationMessage;
} => {
	let endDateValidation = validateEndDate(target.startDate, target.endDate);
	let initialWeightMessage = validateTargetAmount({ value: target.initialWeight });
	let targetWeightMessage = validateTargetAmount({ value: target.targetWeight });

	return {
		endDate: endDateValidation,
		initialWeight: initialWeightMessage,
		targetWeight: targetWeightMessage
	};
};

export const validateEndDate = (startDateStr: string, endDateStr: string): ValidationMessage => {
	let startDate = parseStringAsDate(startDateStr);
	let endDate = parseStringAsDate(endDateStr);

	if (isAfter(startDate, endDate)) {
		return {
			valid: false,
			errorMessage: 'End date must be after start date.'
		};
	}

	return { valid: true };
};

export const validateTargetAmount = (detail): ValidationMessage => {
	if (!detail.value || detail.value <= 0) {
		return {
			valid: false,
			errorMessage: `${detail.label ? detail.label : 'Value'} must be greater than zero.`
		};
	}

	return { valid: true };
};
