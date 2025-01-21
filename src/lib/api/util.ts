export const convertFormDataToJson = (formData: FormData): object => {
	const json: object = {};
	formData.forEach((value, key) => (json[key] = value));

	return json;
};
