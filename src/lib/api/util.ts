export const convertFormDataToJson = (formData: FormData): any => {
	const json: any = {};
	formData.forEach((value, key) => (json[key] = value));

	return json;
};
