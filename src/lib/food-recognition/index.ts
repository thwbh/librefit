/**
 * Food recognition (add-food-recognition, FR) — frontend helpers.
 *
 * The webview only ever transports image bytes to the Rust backend; the API key
 * and provider endpoint never live here (FR-008). These helpers turn a picked
 * file into bytes and map the backend's error `code` to a user-facing message.
 */

/** Shape of the `{ code, message }` error the `analyze_meal_photo` command rejects with. */
export interface FrError {
	code: string;
	message: string;
}

/** Type guard for the structured backend error. */
export function isFrError(e: unknown): e is FrError {
	return (
		typeof e === 'object' &&
		e !== null &&
		'code' in e &&
		typeof (e as Record<string, unknown>).code === 'string'
	);
}

/**
 * Distinct, user-facing messages per failure class (FR-028/029/030). Each nudges
 * the user back to manual entry, which always stays available.
 */
const AI_ERROR_MESSAGES: Record<string, string> = {
	bad_key: 'Your API key was rejected.',
	quota: 'Your provider quota is used up.',
	timeout: 'The request timed out. Check your connection.',
	parse: "Couldn't read the result. Please add this meal manually.",
	not_configured:
		'AI intake is not set up yet. Configure it in settings, or add this meal manually.',
	consent_required: 'Please accept the one-time consent to use AI intake.'
};

/** Map a backend error (or anything) to a message that always offers manual entry. */
export function aiErrorMessage(e: unknown): string {
	if (isFrError(e)) {
		return AI_ERROR_MESSAGES[e.code] ?? e.message;
	}
	return 'Something went wrong. Please add this meal manually.';
}

/** Read a picked image file into a plain byte array for the `invoke` boundary. */
export async function fileToBytes(file: File): Promise<number[]> {
	const buffer = await file.arrayBuffer();
	return Array.from(new Uint8Array(buffer));
}
