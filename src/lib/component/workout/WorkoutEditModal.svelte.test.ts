import { render, screen, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import WorkoutEditModal from './WorkoutEditModal.svelte';
import {
	addWorkoutSet,
	createWorkoutForDate,
	deleteWorkoutSet,
	getExerciseLibrary,
	updateWorkoutSet,
	type ExerciseDetail,
	type WorkoutDetail
} from '$lib/api';

// Flat-CRUD editor ([HI-020] edit, [HI-022] add). The persistence commands are
// stubbed; we assert the editor calls them with the right args. SetMask submits its
// initial reps/weight on click, so no NumberStepper interaction is needed.
vi.mock('$lib/api', () => ({
	createWorkoutForDate: vi.fn(),
	addWorkoutSet: vi.fn(),
	updateWorkoutSet: vi.fn(),
	deleteWorkoutSet: vi.fn(),
	getExerciseLibrary: vi.fn()
}));

const mockLibrary: ExerciseDetail[] = [
	{
		id: 1,
		name: 'Bench Press',
		category: 'barbell',
		defaultRestSeconds: 180,
		muscles: [{ exerciseId: 1, muscle: 'chest', role: 'primary' }]
	}
];

function session(id: number, exercises: WorkoutDetail['exercises'] = []): WorkoutDetail {
	return {
		session: {
			id,
			workoutType: 'wl',
			name: undefined,
			startedAt: '2026-06-01T12:00:00.000Z',
			endedAt: '2026-06-01T12:00:00.000Z'
		},
		exercises,
		pauses: []
	} as WorkoutDetail;
}

const exerciseView = (
	id: number,
	exerciseId: number,
	name: string,
	sets: { id: number; loggedAt: string; metrics: { reps: number; weightKg: number } }[]
) => ({ id, exerciseId, name, defaultRestSeconds: 90, sets });

beforeEach(() => vi.clearAllMocks());

describe('WorkoutEditModal', () => {
	it('[HI-022] create mode: picking an exercise then adding a set creates the session, then logs the set', async () => {
		vi.mocked(getExerciseLibrary).mockResolvedValue(mockLibrary);
		vi.mocked(createWorkoutForDate).mockResolvedValue(session(100));
		vi.mocked(addWorkoutSet).mockResolvedValue(
			session(100, [
				exerciseView(1, 1, 'Bench Press', [
					{ id: 1, loggedAt: '2026-06-01T12:00:00.000Z', metrics: { reps: 8, weightKg: 20 } }
				])
			])
		);

		render(WorkoutEditModal, {
			props: { mode: 'create', dateStr: '2026-06-01', onclose: vi.fn() }
		});

		await fireEvent.click(screen.getByRole('button', { name: /Add exercise/ }));
		const search = await screen.findByLabelText('Search exercises');
		await fireEvent.input(search, { target: { value: 'bench' } });
		await fireEvent.click(await screen.findByText('Bench Press'));
		await fireEvent.click(screen.getByRole('button', { name: 'Add set' }));

		expect(createWorkoutForDate).toHaveBeenCalledTimes(1);
		expect(addWorkoutSet).toHaveBeenCalledWith(
			expect.objectContaining({ sessionId: 100, exerciseId: 1, metrics: { reps: 8, weightKg: 20 } })
		);
	});

	it('[HI-020] edit mode: editing a set calls updateWorkoutSet with the set id', async () => {
		const detail = session(5, [
			exerciseView(10, 1, 'Bench Press', [
				{ id: 50, loggedAt: '2026-06-01T12:00:00.000Z', metrics: { reps: 10, weightKg: 80 } }
			])
		]);
		vi.mocked(updateWorkoutSet).mockResolvedValue(detail);

		render(WorkoutEditModal, { props: { mode: 'edit', detail, onclose: vi.fn() } });

		await fireEvent.click(screen.getByLabelText('Edit set'));
		await fireEvent.click(screen.getByRole('button', { name: 'Save set' }));

		expect(updateWorkoutSet).toHaveBeenCalledWith({
			setId: 50,
			metrics: { reps: 10, weightKg: 80 }
		});
	});

	it('[HI-020] edit mode: deleting a set calls deleteWorkoutSet with the set id', async () => {
		const detail = session(5, [
			exerciseView(10, 1, 'Bench Press', [
				{ id: 50, loggedAt: '2026-06-01T12:00:00.000Z', metrics: { reps: 10, weightKg: 80 } }
			])
		]);
		vi.mocked(deleteWorkoutSet).mockResolvedValue(
			session(5, [exerciseView(10, 1, 'Bench Press', [])])
		);

		render(WorkoutEditModal, { props: { mode: 'edit', detail, onclose: vi.fn() } });

		await fireEvent.click(screen.getByLabelText('Delete set'));

		expect(deleteWorkoutSet).toHaveBeenCalledWith({ setId: 50 });
	});
});
