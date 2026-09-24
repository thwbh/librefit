import { describe, it, expect, vi, beforeEach } from 'vitest';

const add = vi.fn();
vi.mock('@thwbh/veilchen', () => ({
	snackbar: { add: (...args: unknown[]) => add(...args) }
}));

import { undoSnackbar, UNDO_SNACKBAR_DURATION } from './snackbar';

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
