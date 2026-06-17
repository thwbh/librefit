import { render, screen, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

// The Add FAB is portaled to <body> and removed on a short delay, so it can outlive
// a test's unmount; drop any leftovers to keep renders isolated.
afterEach(() => {
	document.querySelectorAll('[data-testid="add-exercise"]').forEach((n) => n.remove());
});

describe('Exercises management page', () => {
	it('[WO-028] [WO-044] lists only user-created exercises, excluding read-only seeded ones', async () => {
		render(ExercisesPage);

		expect(await screen.findByText('Atlas Press')).toBeInTheDocument();
		expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
	});

	it('[WO-030] [WO-046] long-press on a row opens the edit screen pre-filled', async () => {
		render(ExercisesPage);

		// Edit gesture: long-press (mirrors swipe-left) — `_conv-gestures`.
		const row = await screen.findByTestId('exercise-row');
		row.dispatchEvent(new CustomEvent('longpress'));

		// The add/edit modal opens with the exercise's current name (MOD-001).
		expect(await screen.findByTestId('exercise-name')).toHaveValue('Atlas Press');
	});

	it('[WO-045] opens a blank add screen from the Add action', async () => {
		render(ExercisesPage);
		await screen.findByText('Atlas Press');

		await fireEvent.click(screen.getByTestId('add-exercise'));

		expect(await screen.findByText('Add Exercise')).toBeInTheDocument();
		expect(screen.getByTestId('exercise-name')).toHaveValue('');
	});

	it('[WO-047] filters the list by the search query', async () => {
		render(ExercisesPage);
		await screen.findByText('Atlas Press');

		const search = screen.getByLabelText('Search exercises');
		await fireEvent.input(search, { target: { value: 'zzz' } });
		expect(screen.getByTestId('exercise-no-match')).toBeInTheDocument();
		expect(screen.queryByText('Atlas Press')).not.toBeInTheDocument();

		await fireEvent.input(search, { target: { value: 'atlas' } });
		expect(await screen.findByText('Atlas Press')).toBeInTheDocument();
	});
});
