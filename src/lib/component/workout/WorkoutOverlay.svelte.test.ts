import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, within } from '@testing-library/svelte';

// Drive the overlay through a real WorkoutStore with the generated API mocked,
// so it exercises the actual store wiring (the same seam as
// workout-state.svelte.test.ts). The overlay itself owns the layout: pinned
// header context, the single Start-Set flow, the completed-set list, footer.
vi.mock('$lib/api', () => ({
	startWorkoutSession: vi.fn(),
	getActiveWorkout: vi.fn(),
	getExerciseLibrary: vi.fn().mockResolvedValue([]),
	logWorkoutSet: vi.fn(),
	updateWorkoutSet: vi.fn(),
	deleteWorkoutSet: vi.fn(),
	pauseWorkoutSession: vi.fn(),
	resumeWorkoutSession: vi.fn(),
	endWorkoutSession: vi.fn(),
	discardWorkoutSession: vi.fn()
}));

import * as api from '$lib/api';
import WorkoutOverlay from './WorkoutOverlay.svelte';
import { WorkoutStore } from '$lib/workout/workout-state.svelte';

type Detail = Awaited<ReturnType<typeof api.getActiveWorkout>>;

function sessionWith(exercises: unknown[] = [], pauses: unknown[] = []): Detail {
	return {
		session: {
			id: 1,
			workoutType: 'wl',
			name: undefined,
			startedAt: new Date().toISOString(),
			endedAt: undefined
		},
		exercises,
		pauses
	} as unknown as Detail;
}

async function activeStore(detail: Detail) {
	(api.getActiveWorkout as ReturnType<typeof vi.fn>).mockResolvedValue(detail);
	const store = new WorkoutStore();
	await store.load();
	return store;
}

describe('WorkoutOverlay', () => {
	beforeEach(() => vi.clearAllMocks());

	it('shows the Start Set affordance with no entry in progress', async () => {
		const store = await activeStore(sessionWith());
		render(WorkoutOverlay, { props: { store } });
		expect(screen.getByRole('button', { name: /Start Set/i })).toBeInTheDocument();
		store.dispose();
	});

	it('Start Set opens the exercise picker', async () => {
		const store = await activeStore(sessionWith());
		render(WorkoutOverlay, { props: { store } });
		await fireEvent.click(screen.getByRole('button', { name: /Start Set/i }));
		expect(screen.getByPlaceholderText('Search exercises')).toBeInTheDocument();
		store.dispose();
	});

	it('renders pinned header context: current exercise + set number', async () => {
		const store = await activeStore(
			sessionWith([
				{
					id: 1,
					exerciseId: 1,
					name: 'Back Squat',
					defaultRestSeconds: 180,
					sets: [{ id: 1, loggedAt: new Date().toISOString(), metrics: { reps: 8, weightKg: 100 } }]
				}
			])
		);
		const { container } = render(WorkoutOverlay, { props: { store } });
		// The name appears both in the pinned header and as the completed-exercise
		// heading; assert the header copy specifically.
		const header = container.querySelector('.modal-header') as HTMLElement;
		expect(within(header).getByText('Back Squat')).toBeInTheDocument();
		expect(within(header).getByText('Set 1')).toBeInTheDocument(); // most-recent set number
		store.dispose();
	});

	it('lists completed sets under their exercise', async () => {
		const store = await activeStore(
			sessionWith([
				{
					id: 1,
					exerciseId: 1,
					name: 'Back Squat',
					defaultRestSeconds: 180,
					sets: [
						{ id: 1, loggedAt: new Date().toISOString(), metrics: { reps: 8, weightKg: 100 } },
						{ id: 2, loggedAt: new Date().toISOString(), metrics: { reps: 6, weightKg: 110 } }
					]
				}
			])
		);
		render(WorkoutOverlay, { props: { store } });
		expect(screen.getByText('8 × 100 kg')).toBeInTheDocument();
		expect(screen.getByText('6 × 110 kg')).toBeInTheDocument();
		store.dispose();
	});

	it('minimize control fires onminimize', async () => {
		const store = await activeStore(sessionWith());
		const onminimize = vi.fn();
		render(WorkoutOverlay, { props: { store, onminimize } });
		await fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
		expect(onminimize).toHaveBeenCalledOnce();
		store.dispose();
	});

	it('shows Pause while running and Resume once paused', async () => {
		const running = await activeStore(sessionWith());
		const { unmount } = render(WorkoutOverlay, { props: { store: running } });
		expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
		running.dispose();
		unmount();

		const paused = await activeStore(
			sessionWith([], [{ pausedAt: new Date().toISOString(), resumedAt: null }])
		);
		render(WorkoutOverlay, { props: { store: paused } });
		expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
		paused.dispose();
	});

	it('renders the slide-to-confirm end and discard controls', async () => {
		const store = await activeStore(sessionWith());
		render(WorkoutOverlay, { props: { store } });
		expect(screen.getByRole('button', { name: 'Slide to end' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Slide to discard' })).toBeInTheDocument();
		store.dispose();
	});
});
