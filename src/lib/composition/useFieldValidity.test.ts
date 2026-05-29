import { describe, it, expect } from 'vitest';
import { useFieldValidity, type ValidationResult } from './useFieldValidity.svelte';

function makeInputEvent(value: string, type = 'number'): Event {
	const input = document.createElement('input');
	input.type = type;
	input.value = value;
	const event = new Event('input', { bubbles: true });
	Object.defineProperty(event, 'target', { value: input });
	return event;
}

// Convenience: build a numeric-range validator with a single message.
function rangeValidator(min: number, max: number, message = 'out of range') {
	return (value: unknown): ValidationResult => {
		const raw = value == null ? '' : String(value);
		if (raw === '') return { ok: false, message };
		const parsed = parseFloat(raw);
		if (Number.isNaN(parsed) || parsed < min || parsed > max) return { ok: false, message };
		return { ok: true };
	};
}

describe('useFieldValidity', () => {
	it('[VAL-012] starts with showError=false even if the initial value would be invalid (deferred until attempt)', () => {
		const validity = useFieldValidity({ validate: () => ({ ok: false, message: 'nope' }) });
		expect(validity.hasAttempted).toBe(false);
		expect(validity.showError).toBe(false);
	});

	it('[VAL-012] displayValid flips to false when validate rejects the input — but showError stays false pre-attempt', () => {
		const validity = useFieldValidity({ validate: rangeValidator(30, Infinity) });

		validity.handleInput(makeInputEvent('25'));
		expect(validity.displayValid).toBe(false);
		expect(validity.showError).toBe(false);
	});

	it('[VAL-013] attempt() marks the field as attempted and returns the current validity', () => {
		const validity = useFieldValidity({ validate: rangeValidator(30, Infinity) });

		validity.handleInput(makeInputEvent('25'));
		const ok = validity.attempt();
		expect(ok).toBe(false);
		expect(validity.hasAttempted).toBe(true);
		expect(validity.showError).toBe(true);
	});

	it('[VAL-012] showError tracks live validity once hasAttempted is set', () => {
		const validity = useFieldValidity({ validate: rangeValidator(30, 330) });

		validity.handleInput(makeInputEvent('25'));
		validity.attempt();
		expect(validity.showError).toBe(true);

		validity.handleInput(makeInputEvent('70'));
		expect(validity.showError).toBe(false);

		validity.handleInput(makeInputEvent('500'));
		expect(validity.showError).toBe(true);
	});

	it('[VAL-012] empty input is rejected when the validator excludes it', () => {
		const validity = useFieldValidity({ validate: rangeValidator(30, Infinity) });

		validity.handleInput(makeInputEvent(''));
		expect(validity.displayValid).toBe(false);
	});

	it('[VAL-014] errorMessage exposes the message returned by validate', () => {
		const validity = useFieldValidity({
			validate: (value) => {
				const raw = String(value);
				return raw === 'ok' ? { ok: true } : { ok: false, message: 'value must equal "ok"' };
			}
		});

		validity.handleInput(makeInputEvent('nope', 'text'));
		expect(validity.errorMessage).toBe('value must equal "ok"');

		validity.handleInput(makeInputEvent('ok', 'text'));
		expect(validity.errorMessage).toBeUndefined();
	});

	it('ignores events whose target is not an input (defaults to selector "input")', () => {
		const validity = useFieldValidity({ validate: () => ({ ok: false, message: 'nope' }) });

		const div = document.createElement('div');
		const event = new Event('input', { bubbles: true });
		Object.defineProperty(event, 'target', { value: div });
		validity.handleInput(event);

		expect(validity.displayValid).toBe(true); // unchanged
	});

	it('matches selector option scopes which inputs drive the validity', () => {
		const validity = useFieldValidity({
			validate: () => ({ ok: false, message: 'nope' }),
			matches: 'input[type="number"]'
		});

		// A text input event must NOT drive this number-field's validity.
		validity.handleInput(makeInputEvent('anything', 'text'));
		expect(validity.displayValid).toBe(true);

		// A number input event must.
		validity.handleInput(makeInputEvent('25', 'number'));
		expect(validity.displayValid).toBe(false);
	});

	it('reset() clears hasAttempted so a fresh session does not surface a sticky alert', () => {
		// Simulate: user typed invalid → clicked Save (attempt) → modal closed
		// → modal reopens with another invalid initial value. Without reset(),
		// showError would be true immediately even though the user hasn't
		// engaged with the new form yet.
		const validity = useFieldValidity({
			validate: (value) => {
				const raw = String(value);
				return parseFloat(raw) > 0 ? { ok: true } : { ok: false, message: 'must be positive' };
			}
		});

		validity.handleInput(makeInputEvent('0'));
		validity.attempt();
		expect(validity.showError).toBe(true);
		expect(validity.hasAttempted).toBe(true);

		validity.reset();
		expect(validity.hasAttempted).toBe(false);
		expect(validity.showError).toBe(false);
		// displayValid stays in sync with the live value (still '0' → still invalid).
		expect(validity.displayValid).toBe(false);
	});

	it('revalidate(value) lets callers re-evaluate without an event (e.g. programmatic reset)', () => {
		const validity = useFieldValidity({
			validate: (value) => (value === 'ok' ? { ok: true } : { ok: false, message: 'wrong' })
		});

		validity.revalidate('nope');
		expect(validity.displayValid).toBe(false);
		expect(validity.errorMessage).toBe('wrong');

		validity.revalidate('ok');
		expect(validity.displayValid).toBe(true);
		expect(validity.errorMessage).toBeUndefined();
	});
});
