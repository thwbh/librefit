import { render, screen, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ExercisesPage from './+page.svelte';
import {
	getExerciseLibrary,
	listExerciseCategories,
	listMuscles,
	type ExerciseDetail
} from '$lib/api';

// Dedicated exercise-library management screen: the entry point for editing/deleting
// user-created exercises (WO-030, WO-031). Seeded rows are read-only and excluded
// from the list (WO-028). The persistence commands are stubbed via the picker form.
vi.mock('$lib/api', () => ({
	getExerciseLibrary: vi.fn(),
	createExercise: vi.fn(),
	updateExercise: vi.fn(),
	deleteExercise: vi.fn(),
	listExerciseCategories: vi.fn(),
	listMuscles: vi.fn(),
	createCommandHooks: vi.fn(() => ({}))
}));

const m = (exerciseId: number, muscle: string, role: string) => ({ exerciseId, muscle, role });
const library: ExerciseDetail[] = [
	{
		id: 1,
		name: 'Bench Press',
		category: 'barbell',
		defaultRestSeconds: 180,
		muscles: [m(1, 'chest', 'primary')],
		seeded: true,
		verified: true
	},
	{
		id: 50,
		name: 'Atlas Press',
		category: 'barbell',
		defaultRestSeconds: 90,
		muscles: [m(50, 'deltoids', 'primary')],
		seeded: false,
		verified: true
	}
];

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getExerciseLibrary).mockResolvedValue(library);
	vi.mocked(listExerciseCategories).mockResolvedValue([
		{ longvalue: 'Barbell', shortvalue: 'barbell' }
	]);
	vi.mocked(listMuscles).mockResolvedValue([{ longvalue: 'Deltoids', shortvalue: 'deltoids' }]);
});

describe('Exercises management page', () => {
	it('[WO-028] lists only user-created exercises, excluding read-only seeded ones', async () => {
		render(ExercisesPage);

		expect(await screen.findByText('Atlas Press')).toBeInTheDocument();
		expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
	});

	it('[WO-030] opens the edit screen pre-filled for a user exercise', async () => {
		render(ExercisesPage);

		await fireEvent.click(await screen.findByLabelText('Edit Atlas Press'));

		// The add/edit modal opens with the exercise's current name (MOD-001).
		expect(await screen.findByTestId('exercise-name')).toHaveValue('Atlas Press');
	});

	it('[WO-031] opens a blank add screen from the Add action', async () => {
		render(ExercisesPage);
		await screen.findByText('Atlas Press');

		await fireEvent.click(screen.getByTestId('add-exercise'));

		expect(await screen.findByText('Add Exercise')).toBeInTheDocument();
		expect(screen.getByTestId('exercise-name')).toHaveValue('');
	});
});
