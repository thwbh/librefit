import { BmiCategory } from '$lib/model';

export enum DataViews {
	Week = 'WEEK',
	Month = 'MONTH',
	Year = 'YEAR'
}

export enum TrackerInputEventType {
	Add = 'add',
	Update = 'update',
	Delete = 'delete'
}

export enum WizardOptions {
	Default = 'DEFAULT',
	Recommended = 'RECOMMENDED',
	Custom_weight = 'CUSTOM_WEIGHT',
	Custom_date = 'CUSTOM_DATE',
	Custom = 'CUSTOM'
}

export function enumKeys(obj: object) {
	return Object.keys(obj).filter((k) => Number.isNaN(+k));
}

export const getBmiCategoryDisplayValue = (bmiCategory: BmiCategory) => {
	return bmiCategory
		.split(/(?=[A-Z])/)
		.join(' ')
		.toLowerCase();
};
