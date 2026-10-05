import { describe, it, expect } from 'vitest';
import { aiErrorMessage, confidenceLevel } from './index';

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
});
