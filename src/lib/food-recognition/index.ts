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

/** Coarse confidence bucket surfaced as a badge in the intake modal (FR-034/037). */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * Bucket a raw analysis confidence (0.0–1.0) into low/medium/high. The low
 * boundary mirrors the backend's `LOW_CONFIDENCE_THRESHOLD` (0.5) so the badge
 * and the low-confidence warning never disagree (FR-035); medium/high split at
 * 0.8.
 */
export function confidenceLevel(confidence: number): ConfidenceLevel {
	if (confidence < 0.5) return 'low';
	if (confidence < 0.8) return 'medium';
	return 'high';
}

/** Read a picked image file into a plain byte array for the `invoke` boundary. */
export async function fileToBytes(file: File): Promise<number[]> {
	const buffer = await file.arrayBuffer();
	return Array.from(new Uint8Array(buffer));
}

/** Image bytes plus their MIME type, ready for the `analyze_meal_photo` boundary. */
export interface CapturedImage {
	image: number[];
	mime: string;
}

/** Response shape of the `tauri-plugin-camera` `take_picture` command. */
interface TakePictureResponse {
	imageData: string;
	width: number;
	height: number;
}

/** Decode a base64 string (tolerating a `data:` URL prefix) into a byte array. */
function base64ToBytes(data: string): number[] {
	const comma = data.indexOf(',');
	const payload = data.startsWith('data:') && comma !== -1 ? data.slice(comma + 1) : data;
	const binary = atob(payload);
	const bytes = new Array<number>(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

/**
 * Open the device camera via `tauri-plugin-camera` and return the captured image
 * as bytes (FR-032). The camera is mobile-only; on desktop (or if the plugin is
 * unavailable) the invoke rejects and the caller falls back to the gallery/file
 * picker. The key and endpoint never cross this boundary — only image bytes do
 * (FR-008); EXIF is stripped backend-side before upload (FR-009).
 */
export async function capturePhotoFromCamera(): Promise<CapturedImage> {
	const { invoke } = await import('@tauri-apps/api/core');
	const res = await invoke<TakePictureResponse>('plugin:camera|take_picture');
	const dataUrl = res.imageData.startsWith('data:') ? res.imageData : '';
	const mime = dataUrl ? dataUrl.slice(5, dataUrl.indexOf(';')) : 'image/jpeg';
	return { image: base64ToBytes(res.imageData), mime: mime || 'image/jpeg' };
}
