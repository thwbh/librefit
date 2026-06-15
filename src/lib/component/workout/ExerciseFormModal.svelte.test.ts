import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ExerciseFormModal from './ExerciseFormModal.svelte';
import {
	createExercise,
	updateExercise,
	deleteExercise,
	listExerciseCategories,
	listMuscles,
	type ExerciseDetail
} from '$lib/api';

// Full add/edit screen (WO-029, WO-030, WO-035) + guarded delete (WO-031, WO-032).
// Persistence commands are stubbed; the command hooks are passthroughs so a rejected
// command propagates to the component's catch (the toast itself is veilchen's job).
vi.mock('$lib/api', () => ({
	createExercise: vi.fn(),
	updateExercise: vi.fn(),
	deleteExercise: vi.fn(),
	listExerciseCategories: vi.fn(),
	listMuscles: vi.fn(),
	createCommandHooks: vi.fn(() => ({})),
	CommonHooks: { create: vi.fn(() => ({})), update: vi.fn(() => ({})) }
}));

const categories = [
	{ longvalue: 'Barbell', shortvalue: 'barbell' },
	{ longvalue: 'Machine', shortvalue: 'machine' },
	{ longvalue: 'Uncategorized', shortvalue: 'uncategorized' }
];
const muscles = [
	{ longvalue: 'Chest', shortvalue: 'chest' },
	{ longvalue: 'Triceps', shortvalue: 'triceps' }
];

const detail = (over: Partial<ExerciseDetail> = {}): ExerciseDetail => ({
	id: 50,
	name: 'Atlas Press',
	category: 'barbell',
	defaultRestSeconds: 90,
	muscles: [{ exerciseId: 50, muscle: 'chest', role: 'primary' }],
	seeded: false,
	verified: true,
	...over
});

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(listExerciseCategories).mockResolvedValue(categories);
	vi.mocked(listMuscles).mockResolvedValue(muscles);
});

describe('ExerciseFormModal', () => {
	it('[WO-029] creates a user exercise with full metadata', async () => {
		const created = detail({ id: 60, name: 'Bulgarian Split Squat' });
		vi.mocked(createExercise).mockResolvedValue(created);
		const onsaved = vi.fn();
		render(ExerciseFormModal, { props: { mode: 'create', onsaved, onclose: vi.fn() } });

		await fireEvent.input(screen.getByTestId('exercise-name'), {
			target: { value: 'Bulgarian Split Squat' }
		});
		// Category options render once listExerciseCategories resolves.
		await screen.findByRole('option', { name: 'Barbell' });
		await fireEvent.change(screen.getByTestId('exercise-category'), {
			target: { value: 'barbell' }
		});
		// Cycle a muscle Off → Primary.
		await fireEvent.click(await screen.findByText('Chest'));
		await fireEvent.input(screen.getByTestId('exercise-rest'), { target: { value: '90' } });
		await fireEvent.click(screen.getByTestId('save-exercise'));

		await waitFor(() => expect(createExercise).toHaveBeenCalled());
		expect(vi.mocked(createExercise).mock.calls[0][0]).toEqual({
			input: {
				name: 'Bulgarian Split Squat',
				category: 'barbell',
				defaultRestSeconds: 90,
				muscles: [{ muscle: 'chest', role: 'primary' }]
			}
		});
		expect(onsaved).toHaveBeenCalledWith(created);
	});

	it('[WO-029] blocks submit until name, category, and a muscle are supplied', async () => {
		render(ExerciseFormModal, { props: { mode: 'create', onsaved: vi.fn(), onclose: vi.fn() } });
		await screen.findByRole('option', { name: 'Barbell' });

		await fireEvent.click(screen.getByTestId('save-exercise'));
		expect(await screen.findByRole('alert')).toHaveTextContent('A name is required.');
		expect(createExercise).not.toHaveBeenCalled();
	});

	it('[WO-030] edits a user exercise and [WO-035] promotes a Ghost by supplying metadata', async () => {
		// An unverified Ghost: parked under `uncategorized`, no muscles.
		const ghost = detail({
			name: 'Sandbag Carry',
			category: 'uncategorized',
			muscles: [],
			verified: false
		});
		const promoted = detail({ name: 'Sandbag Carry', verified: true });
		vi.mocked(updateExercise).mockResolvedValue(promoted);
		const onsaved = vi.fn();
		render(ExerciseFormModal, {
			props: { mode: 'edit', detail: ghost, onsaved, onclose: vi.fn() }
		});

		// Name pre-filled (MOD-001); the sentinel category is not pre-selected.
		expect(screen.getByTestId('exercise-name')).toHaveValue('Sandbag Carry');
		await screen.findByRole('option', { name: 'Machine' });
		await fireEvent.change(screen.getByTestId('exercise-category'), {
			target: { value: 'machine' }
		});
		await fireEvent.click(await screen.findByText('Chest'));
		await fireEvent.click(screen.getByTestId('save-exercise'));

		await waitFor(() => expect(updateExercise).toHaveBeenCalled());
		expect(vi.mocked(updateExercise).mock.calls[0][0]).toEqual({
			id: 50,
			input: {
				name: 'Sandbag Carry',
				category: 'machine',
				defaultRestSeconds: 90,
				muscles: [{ muscle: 'chest', role: 'primary' }]
			}
		});
		expect(onsaved).toHaveBeenCalledWith(promoted);
	});

	it('[WO-031] deletes an unreferenced user exercise', async () => {
		vi.mocked(deleteExercise).mockResolvedValue(undefined);
		const ondeleted = vi.fn();
		const onclose = vi.fn();
		render(ExerciseFormModal, {
			props: { mode: 'edit', detail: detail(), onsaved: vi.fn(), ondeleted, onclose }
		});

		await fireEvent.click(screen.getByTestId('delete-exercise'));
		await fireEvent.click(screen.getByTestId('confirm-delete'));

		await waitFor(() => expect(deleteExercise).toHaveBeenCalled());
		expect(vi.mocked(deleteExercise).mock.calls[0][0]).toEqual({ id: 50 });
		expect(ondeleted).toHaveBeenCalledWith(50);
		expect(onclose).toHaveBeenCalled();
	});

	it('[WO-032] keeps a referenced exercise when delete is refused', async () => {
		vi.mocked(deleteExercise).mockRejectedValue(
			new Error('This exercise is referenced by a logged set')
		);
		const ondeleted = vi.fn();
		const onclose = vi.fn();
		render(ExerciseFormModal, {
			props: { mode: 'edit', detail: detail(), onsaved: vi.fn(), ondeleted, onclose }
		});

		await fireEvent.click(screen.getByTestId('delete-exercise'));
		await fireEvent.click(screen.getByTestId('confirm-delete'));

		await waitFor(() => expect(deleteExercise).toHaveBeenCalled());
		// The guard leaves the exercise intact: no removal callback, modal stays open.
		expect(ondeleted).not.toHaveBeenCalled();
		expect(onclose).not.toHaveBeenCalled();
	});
});
