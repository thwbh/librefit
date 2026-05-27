import { describe, it, expect } from 'vitest';
import { useFieldValidity } from './useFieldValidity.svelte';

function makeInputEvent(value: string, type = 'number'): Event {
	const input = document.createElement('input');
	input.type = type;
	input.value = value;
	const event = new Event('input', { bubbles: true });
	Object.defineProperty(event, 'target', { value: input });
	return event;
}

describe('useFieldValidity', () => {
	it('[VAL-012] starts with showError=false even if the initial value would be invalid (deferred until attempt)', () => {
		const validity = useFieldValidity({ isValid: () => false });
		expect(validity.hasAttempted).toBe(false);
		expect(validity.showError).toBe(false);
	});

	it('[VAL-012] displayValid flips to false when the predicate rejects the input — but showError stays false pre-attempt', () => {
		const validity = useFieldValidity({
			isValid: (raw) => raw !== '' && parseFloat(raw) >= 30
		});

		validity.handleInput(makeInputEvent('25'));
		expect(validity.displayValid).toBe(false);
		expect(validity.showError).toBe(false);
	});

	it('[VAL-013] attempt() marks the field as attempted and returns the current validity', () => {
		const validity = useFieldValidity({
			isValid: (raw) => parseFloat(raw) >= 30
		});

		validity.handleInput(makeInputEvent('25'));
		const ok = validity.attempt();
		expect(ok).toBe(false);
		expect(validity.hasAttempted).toBe(true);
		expect(validity.showError).toBe(true);
	});

	it('[VAL-012] showError tracks live validity once hasAttempted is set', () => {
		const validity = useFieldValidity({
			isValid: (raw) => parseFloat(raw) >= 30 && parseFloat(raw) <= 330
		});

		validity.handleInput(makeInputEvent('25'));
		validity.attempt();
		expect(validity.showError).toBe(true);

		validity.handleInput(makeInputEvent('70'));
		expect(validity.showError).toBe(false);

		validity.handleInput(makeInputEvent('500'));
		expect(validity.showError).toBe(true);
	});

	it('[VAL-012] empty input is rejected when the predicate excludes it', () => {
		const validity = useFieldValidity({
			isValid: (raw) => raw !== '' && parseFloat(raw) >= 30
		});

		validity.handleInput(makeInputEvent(''));
		expect(validity.displayValid).toBe(false);
	});

	it('ignores events whose target is not an input (defaults to selector "input")', () => {
		const validity = useFieldValidity({ isValid: () => false });

		const div = document.createElement('div');
		const event = new Event('input', { bubbles: true });
		Object.defineProperty(event, 'target', { value: div });
		validity.handleInput(event);

		expect(validity.displayValid).toBe(true); // unchanged
	});

	it('matches selector option scopes which inputs drive the validity', () => {
		const validity = useFieldValidity({
			isValid: () => false,
			matches: 'input[type="number"]'
		});

		// A text input event must NOT drive this number-field's validity.
		validity.handleInput(makeInputEvent('anything', 'text'));
		expect(validity.displayValid).toBe(true);

		// A number input event must.
		validity.handleInput(makeInputEvent('25', 'number'));
		expect(validity.displayValid).toBe(false);
	});

	it('revalidate(raw) lets callers re-evaluate without an event (e.g. programmatic reset)', () => {
		const validity = useFieldValidity({
			isValid: (raw) => raw === 'ok'
		});

		validity.revalidate('nope');
		expect(validity.displayValid).toBe(false);

		validity.revalidate('ok');
		expect(validity.displayValid).toBe(true);
	});
});
