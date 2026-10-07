import { describe, it, expect, vi, beforeEach } from 'vitest';

const add = vi.fn();
vi.mock('@thwbh/veilchen', () => ({
	snackbar: { add: (...args: unknown[]) => add(...args) }
}));

import {
	undoSnackbar,
	UNDO_SNACKBAR_DURATION,
	actionSnackbar,
	ACTION_SNACKBAR_DURATION
} from './snackbar';

describe('actionSnackbar', () => {
	beforeEach(() => add.mockReset());

	it('[FR-039] enqueues a failure snackbar wiring a one-tap recovery action', () => {
		// A failed AI analysis turns into a snackbar with an "Add manually" action
		// that opens the normal intake mask (FR-028..030 actionability).
		const onAction = vi.fn();
		actionSnackbar('Your API key was rejected.', 'Add manually', onAction);

		expect(add).toHaveBeenCalledTimes(1);
		const [message, options] = add.mock.calls[0];
		expect(message).toBe('Your API key was rejected.');
		expect(options).toMatchObject({
			actionLabel: 'Add manually',
			duration: ACTION_SNACKBAR_DURATION
		});

		expect(onAction).not.toHaveBeenCalled();
		options.onAction();
		expect(onAction).toHaveBeenCalledTimes(1);
	});
});

describe('undoSnackbar', () => {
	beforeEach(() => add.mockReset());

	it('[WO-042] [UND-001] [UND-002] [UND-003] enqueues a snackbar wiring the Undo action to the callback', () => {
		const onUndo = vi.fn();
		undoSnackbar('Tagged 3 exercises.', onUndo);

		expect(add).toHaveBeenCalledTimes(1);
		const [message, options] = add.mock.calls[0];
		expect(message).toBe('Tagged 3 exercises.');
		expect(options).toMatchObject({
			actionLabel: 'Undo',
			duration: UNDO_SNACKBAR_DURATION
		});

		expect(onUndo).not.toHaveBeenCalled();
		options.onAction();
		expect(onUndo).toHaveBeenCalledTimes(1);
	});
});
