/**
 * @param formData {FormData}
 * @return {Promise}
 */
export const startImport = async (formData) => {
	/*const importApi = api.postImportBulk;

	const importerSelection = formData['importer'];

	const file = formData.get('file');

	if (file.type !== 'text/csv') {
		return fail(400, { errors: [{ field: 'file', message: 'Please choose a valid CSV file.' }] });
	}

	if (file.size > 32768) {
		return fail(400, {
			errors: [{ field: 'file', message: 'File size exceeds the limit of 32 KB.' }]
		});
	}

	/** @type ImportConfig */
	/*
	const config = {
		datePattern: formData['datePattern'],
		headerLength: formData['headerLength'],
		drop: formData['drop'],
		updateCalorieTracker: importerSelection !== 'W',
		updateWeightTracker: importerSelection !== 'C'
	};

	formData.append('config', JSON.stringify(config));

	formData.delete('datePattern');
	formData.delete('headerLength');
	formData.delete('drop');
	formData.delete('importer');

	const response = await proxyFetch(fetch, importApi, formData);

	let result;

	if (response.status === 200) {
		result = {
			success: true
		};
	} else {
	}

	return result;*/
};
