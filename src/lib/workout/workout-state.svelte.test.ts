import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the generated API layer so the store's optimistic transitions can be
// exercised without a backend.
vi.mock('$lib/api', () => ({
	startWorkoutSession: vi.fn(),
	getActiveWorkout: vi.fn(),
	logWorkoutSet: vi.fn(),
	updateWorkoutSet: vi.fn(),
	deleteWorkoutSet: vi.fn(),
	pauseWorkoutSession: vi.fn(),
	resumeWorkoutSession: vi.fn(),
	endWorkoutSession: vi.fn(),
	discardWorkoutSession: vi.fn()
}));

import * as api from '$lib/api';
import { WorkoutStore } from './workout-state.svelte';

const detail = {
	session: {
		id: 1,
		workoutType: 'wl',
		name: undefined,
		startedAt: new Date().toISOString(),
		endedAt: undefined
	},
	exercises: [],
	pauses: []
};

describe('WorkoutStore optimistic transitions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('[DH-009] the morph begins on initiation, before the command commits', async () => {
		let resolve: (v: unknown) => void = () => {};
		(api.startWorkoutSession as ReturnType<typeof vi.fn>).mockReturnValue(
			new Promise((r) => (resolve = r))
		);
		const store = new WorkoutStore();
		const pending = store.start();
		// Optimistically active immediately — without waiting for the command.
		expect(store.optimisticActive).toBe(true);
		expect(store.active).toBe(true);
		resolve(detail);
		await pending;
		expect(store.session).toEqual(detail);
		store.dispose();
	});

	it('[DH-010] a failed transition reverts the morph and surfaces the error', async () => {
		(api.startWorkoutSession as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error('A workout session is already active')
		);
		const store = new WorkoutStore();
		await expect(store.start()).rejects.toThrow(/already active/);
		expect(store.optimisticActive).toBe(false); // reverted
		expect(store.active).toBe(false);
		expect(store.session).toBeNull();
		expect(store.error).toContain('already active');
		store.dispose();
	});
});
