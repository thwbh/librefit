import { afterEach, expect, describe, it } from 'vitest';
import { Indicator } from '../../src/lib/indicator';

describe('Indicator', () => {
	const indicator = new Indicator();

	afterEach(() => {
		indicator.reset();
	});

	it('should correctly set properties when "start" is called', () => {
		let actor = { disabled: false };
		indicator.start(actor);

		expect(indicator.progress).toBeUndefined();
		expect(indicator.actorDisabled).toBeTruthy();
		expect(actor.disabled).toBeTruthy();
		expect(indicator.invisible).toBe('');

		indicator.start();

		expect(indicator.progress).toBeUndefined();
		expect(indicator.actorDisabled).toBeTruthy();
		expect(indicator.actor).toStrictEqual({ disabled: true });
		expect(indicator.invisible).toBe('');
	});

	it('should correctly set properties when "finishSuccess" is called', () => {
		let actor = { disabled: true };
		indicator.start(actor);
		indicator.finishSuccess();

		expect(indicator.progress).toBe(100);
		expect(indicator.actorDisabled).toBe(false);
		expect(indicator.meter).toBe('bg-success-500');
		expect(actor.disabled).toBe(false);
		expect(indicator.actor).toBeUndefined();
		expect(indicator.invisible).toBe('invisible');
	});

	it('should correctly set properties when "finishError" is called', () => {
		let actor = { disabled: true };
		indicator.start(actor);
		indicator.finishError();

		expect(indicator.progress).toBe(100);
		expect(indicator.actorDisabled).toBe(false);
		expect(indicator.meter).toBe('bg-error-500');
		expect(actor.disabled).toBe(false);
		expect(indicator.actor).toBeUndefined();
		expect(indicator.invisible).toBe('invisible');
	});

	it('should correctly set properties when "finish" is called', () => {
		let actor = { disabled: true };
		indicator.start(actor);
		indicator.finish();

		expect(indicator.progress).toBe(100);
		expect(indicator.actorDisabled).toBe(false);
		expect(actor.disabled).toBe(false);
		expect(indicator.actor).toBeUndefined();
		expect(indicator.invisible).toBe('invisible');
	});

	it('should make indicator invisible when "hide" is called', () => {
		indicator.hide();

		expect(indicator.invisible).toBe('invisible');
	});

	it('should reset indicator when "reset" is called', () => {
		let actor = { disabled: true };
		indicator.start(actor);
		indicator.reset();

		expect(indicator.progress).toBe(0);
		expect(indicator.meter).toBe('bg-surface-900');
		expect(actor.disabled).toBe(false);
		expect(indicator.actor).toBeUndefined();
		expect(indicator.invisible).toBe('');
	});
});
