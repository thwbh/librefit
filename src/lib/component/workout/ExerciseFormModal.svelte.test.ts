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
import { undoSnackbar } from '$lib/snackbar';

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
vi.mock('$lib/snackbar', () => ({ undoSnackbar: vi.fn() }));

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
		// Category chips render once listExerciseCategories resolves; tap to select.
		await fireEvent.click(await screen.findByRole('button', { name: 'Barbell' }));
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
		await screen.findByRole('button', { name: 'Barbell' });

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
		await fireEvent.click(await screen.findByRole('button', { name: 'Machine' }));
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
		// A post-close Undo snackbar replaces the success toast.
		await waitFor(() => expect(undoSnackbar).toHaveBeenCalled());
		expect(vi.mocked(undoSnackbar).mock.calls[0][0]).toContain('Atlas Press');
	});

	it('[WO-048] [UND-002] Undo on a delete recreates the exercise from its own data', async () => {
		vi.mocked(deleteExercise).mockResolvedValue(undefined);
		const recreated = detail({ id: 99 });
		vi.mocked(createExercise).mockResolvedValue(recreated);
		const onsaved = vi.fn();
		render(ExerciseFormModal, {
			props: { mode: 'edit', detail: detail(), onsaved, ondeleted: vi.fn(), onclose: vi.fn() }
		});

		await fireEvent.click(screen.getByTestId('delete-exercise'));
		await fireEvent.click(screen.getByTestId('confirm-delete'));
		await waitFor(() => expect(undoSnackbar).toHaveBeenCalled());

		// Invoke the snackbar's Undo: it recreates with the deleted exercise's data.
		const onUndo = vi.mocked(undoSnackbar).mock.calls[0][1];
		onUndo();
		await waitFor(() => expect(createExercise).toHaveBeenCalled());
		expect(vi.mocked(createExercise).mock.calls[0][0]).toEqual({
			input: {
				name: 'Atlas Press',
				category: 'barbell',
				defaultRestSeconds: 90,
				muscles: [{ muscle: 'chest', role: 'primary' }]
			}
		});
		expect(onsaved).toHaveBeenCalledWith(recreated);
	});

	it('[WO-046] startInDelete opens straight into the delete-confirm view (swipe-right delete)', async () => {
		render(ExerciseFormModal, {
			props: {
				mode: 'edit',
				detail: detail(),
				startInDelete: true,
				onsaved: vi.fn(),
				onclose: vi.fn()
			}
		});

		// No edit fields — the confirm view is shown immediately with the Delete button.
		expect(await screen.findByTestId('delete-confirm-text')).toBeInTheDocument();
		expect(screen.getByTestId('confirm-delete')).toBeInTheDocument();
		expect(screen.queryByTestId('exercise-name')).not.toBeInTheDocument();
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
