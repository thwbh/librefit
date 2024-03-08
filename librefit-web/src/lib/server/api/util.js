import { PUBLIC_API_BASE_PATH } from '$env/static/public';
import { error, redirect } from '@sveltejs/kit';

/**
 * This is to be used in +server.js/+page.server.js files.
 */

/**
 * @param {function} fetchApi
 * @param {{path: String; method: String; contentType: String; guarded: boolean}} api
 * @param {String} [jwt]
 * @param {any} [data]
 */
export const proxyFetch = async (fetchApi, api, jwt, data) => {
	let response;
	let call;

	const method = api.method.toUpperCase();
	let path = api.path;

	/** @type {any} */
	let headers = {
		'content-type': api.contentType
	};

	if (api.guarded === true) {
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
		} else {
			console.error(`${method} ${api.path} requires authentication, no JWT provided!`);

			throw redirect(302, '/');
		}
	}

	if (api.contentType === 'multipart/form-data') {
		if (method === 'POST') {
			// content-type header must not be set for multipart/form-data
			// to let the browser decide the appropriate encoding
			headers = {
				Authorization: `Bearer ${jwt}`
			};

			call = fetchApi(PUBLIC_API_BASE_PATH + path, {
				method: api.method,
				headers,
				body: data
			});
		}
	} else {
		if (method === 'POST' || method === 'PUT') {
			call = fetchApi(PUBLIC_API_BASE_PATH + path, {
				method: api.method,
				headers,
				body: JSON.stringify(data)
			});
		} else if (method === 'GET' || method === 'DELETE') {
			path = replaceGetParamsJson(path, data);

			call = fetchApi(PUBLIC_API_BASE_PATH + path, {
				method: api.method,
				headers
			});
		}
	}

	if (!call) {
		console.log(`method ${api.method} not implemented`);
		throw error(405);
	}

	try {
		console.log(`${method} ${PUBLIC_API_BASE_PATH + path}`);

		response = await call;

		console.log(
			`${method} ${path} statusCode=${response.status} statusText=${response.statusText}`
		);
	} catch (e) {
		console.error(
			`${method} ${path} statusCode=${response.status} statusText=${response.statusText}`
		);

		console.log(e);

		response = new Response();
	}

	return response;
};

/**
 * @param {String} path
 * @param {any} json
 */
export const replaceGetParamsJson = (path, json) => {
	if (json) {
		Object.entries(json).forEach(([key, value]) => {
			path = path.replace(`{${key}}`, String(value));
		});
	}

	return path;
};

/**
 * @param {FormData} formData
 */
export const convertFormDataToJson = (formData) => {
	/** @type {any} */
	const json = {};
	formData.forEach((value, key) => (json[key] = value));

	return json;
};