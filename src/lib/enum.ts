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

export const getBmiCategoryDisplayValue = (bmiCategory: string) => {
	return bmiCategory
		.split(/(?=[A-Z])/)
		.join(' ')
		.toLowerCase();
};
