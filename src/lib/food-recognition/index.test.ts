import { describe, it, expect, vi } from 'vitest';
import {
	aiErrorMessage,
	capturePhotoFromCamera,
	confidenceLevel,
	fileToBytes,
	isFrError
} from './index';

// The camera boundary talks to tauri-plugin-camera via `invoke`; mock the IPC so
// the tests exercise the response→bytes decoding without a native camera.
// Vitest 5 hoists `vi.mock` above this module's imports, so the mock fn must be
// created via `vi.hoisted` (see tests/utils/mocks.ts note).
const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({
	invoke: mocks.invoke
}));

describe('confidenceLevel', () => {
	it('[FR-034] buckets a raw confidence into low/medium/high', () => {
		// The badge is derived from the numeric confidence carried on the candidate.
		expect(confidenceLevel(0.2)).toBe('low');
		expect(confidenceLevel(0.65)).toBe('medium');
		expect(confidenceLevel(0.95)).toBe('high');
	});

	it('[FR-035] low boundary mirrors the backend threshold so badge and warning agree', () => {
		// < 0.5 is low (matches LOW_CONFIDENCE_THRESHOLD); 0.5 exactly is no longer low.
		expect(confidenceLevel(0.49)).toBe('low');
		expect(confidenceLevel(0.5)).not.toBe('low');
		// medium/high split at 0.8.
		expect(confidenceLevel(0.79)).toBe('medium');
		expect(confidenceLevel(0.8)).toBe('high');
	});
});

describe('isFrError', () => {
	it('[FR-028] narrows structured backend errors ({ code, message })', () => {
		expect(isFrError({ code: 'quota', message: 'exceeded' })).toBe(true);
	});

	it('[FR-028] rejects anything without a string `code`', () => {
		// Non-structured failures (raw Error, plain values, missing code) must not
		// be mistaken for a typed failure class.
		expect(isFrError(new Error('boom'))).toBe(false);
		expect(isFrError('bad_key')).toBe(false);
		expect(isFrError(null)).toBe(false);
		expect(isFrError({ code: 42, message: 'not a string code' })).toBe(false);
		expect(isFrError({})).toBe(false);
	});
});

describe('aiErrorMessage', () => {
	it('[FR-028] maps a bad-key code to a distinct message', () => {
		expect(aiErrorMessage({ code: 'bad_key', message: 'x' })).toMatch(/api key was rejected/i);
	});

	it('[FR-029] maps a quota code to a distinct message', () => {
		expect(aiErrorMessage({ code: 'quota', message: 'x' })).toMatch(/quota/i);
	});

	it('[FR-030] maps a timeout code to a distinct message', () => {
		expect(aiErrorMessage({ code: 'timeout', message: 'x' })).toMatch(/timed out/i);
	});

	it('[FR-028] an unmapped code falls back to the backend message', () => {
		// Codes the frontend doesn't specifically translate still surface the
		// backend's own wording rather than a generic blob.
		expect(aiErrorMessage({ code: 'provider_meltdown', message: 'provider exploded' })).toBe(
			'provider exploded'
		);
	});

	it('[FR-029] a non-structured failure nudges back to manual entry', () => {
		// Anything untyped (network glitch, unexpected throw) still ends in a
		// message that keeps manual entry on the table (FR-011/013 degradation).
		expect(aiErrorMessage(new Error('boom'))).toMatch(/add this meal manually/i);
		expect(aiErrorMessage('nope')).toMatch(/add this meal manually/i);
		expect(aiErrorMessage(null)).toMatch(/add this meal manually/i);
	});
});

describe('fileToBytes', () => {
	it('[FR-032] reads a picked file into a plain byte array', async () => {
		// The `analyze_meal_photo` boundary takes `number[]`, not a Blob.
		const file = new File([new Uint8Array([1, 2, 3])], 'meal.jpg', { type: 'image/jpeg' });
		await expect(fileToBytes(file)).resolves.toEqual([1, 2, 3]);
	});

	it('[FR-032] preserves byte order for multi-byte content', async () => {
		const bytes = new Uint8Array([0, 255, 128, 7, 42]);
		const file = new File([bytes], 'meal.png', { type: 'image/png' });
		await expect(fileToBytes(file)).resolves.toEqual([0, 255, 128, 7, 42]);
	});
});

describe('capturePhotoFromCamera', () => {
	// NOTE: deliberately no `beforeEach(() => mocks.invoke.mockReset())` here.
	// On Vitest 5.0.1, resetting a spy that tracked a resolved promise from a
	// previous test makes a *later* mock rejection surface as an unhandled
	// error and fail its test (see vitest#2493 for the underlying dynamic-import
	// interaction). Each test below fully specifies the mock behaviour instead,
	// and the project-level `clearMocks: true` keeps call-history assertions
	// (toHaveBeenCalledWith / toHaveBeenCalledOnce) isolated between tests.

	it('[FR-031] invokes the camera plugin with no payload — only bytes come back over the bridge', async () => {
		// The API key and endpoint never cross this boundary (FR-008): the
		// invoke carries no arguments at all.
		mocks.invoke.mockResolvedValue({
			imageData: 'data:image/png;base64,AAEC',
			width: 1,
			height: 1
		});
		await capturePhotoFromCamera();
		expect(mocks.invoke).toHaveBeenCalledWith('plugin:camera|take_picture');
	});

	it('[FR-032] decodes a data-URL capture into bytes and its MIME type', async () => {
		// 'AAEC' → bytes 0,1,2; the MIME comes from the URL prefix.
		mocks.invoke.mockResolvedValue({
			imageData: 'data:image/png;base64,AAEC',
			width: 640,
			height: 480
		});
		await expect(capturePhotoFromCamera()).resolves.toEqual({
			image: [0, 1, 2],
			mime: 'image/png'
		});
	});

	it('[FR-032] a bare base64 payload falls back to image/jpeg', async () => {
		// Some camera plugin versions return the raw base64 without a
		// `data:` prefix — the MIME defaults rather than crashing.
		mocks.invoke.mockResolvedValue({ imageData: 'AQID', width: 1, height: 1 });
		await expect(capturePhotoFromCamera()).resolves.toEqual({
			image: [1, 2, 3],
			mime: 'image/jpeg'
		});
	});

	it('[FR-033] rejects when the camera plugin is unavailable so the caller can fall back', async () => {
		// Desktop / missing plugin: the rejection IS the fallback signal for the
		// file-picker path — it must propagate, not be swallowed.
		mocks.invoke.mockRejectedValue(new Error('plugin camera not found'));
		await expect(capturePhotoFromCamera()).rejects.toThrow(/camera/i);
	});
});
