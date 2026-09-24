import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ExerciseQuickFix from './ExerciseQuickFix.svelte';
import {
	listUnverifiedExercises,
	batchTagExercises,
	undoBatchTag,
	listExerciseCategories,
	listMuscles,
	type BatchTagResult,
	type ExerciseDetail
} from '$lib/api';
import { undoSnackbar } from '$lib/snackbar';

// Batch-tagging tidy-up workspace (WO-041, WO-042, WO-043). Real ModalDialog /
// EmptyState / AlertBox / shared ExerciseTagPicker are kept. API commands and the
// post-close Undo snackbar are stubbed.
vi.mock('$lib/api', () => ({
	listUnverifiedExercises: vi.fn(),
	batchTagExercises: vi.fn(),
	undoBatchTag: vi.fn(),
	listExerciseCategories: vi.fn(),
	listMuscles: vi.fn(),
	createCommandHooks: vi.fn(() => ({}))
}));
vi.mock('$lib/snackbar', () => ({ undoSnackbar: vi.fn() }));

const categories = [
	{ longvalue: 'Barbell', shortvalue: 'barbell' },
	{ longvalue: 'Uncategorized', shortvalue: 'uncategorized' }
];
const muscles = [{ longvalue: 'Chest', shortvalue: 'chest' }];

const ghost = (id: number, name: string): ExerciseDetail => ({
	id,
	name,
	category: 'uncategorized',
	defaultRestSeconds: undefined,
	muscles: [],
	seeded: false,
	verified: false,
	added: '2026-06-13',
	time: '08:00:00'
});

const undoItem = (exerciseId: number) => ({
	exerciseId,
	prevCategory: 'uncategorized',
	prevVerified: false,
	musclesAdded: []
});

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(listExerciseCategories).mockResolvedValue(categories);
	vi.mocked(listMuscles).mockResolvedValue(muscles);
});

describe('ExerciseQuickFix', () => {
	it('[WO-043] shows the nothing-to-verify empty state when no unverified exercises remain', async () => {
		vi.mocked(listUnverifiedExercises).mockResolvedValue([]);
		render(ExerciseQuickFix, { props: { onclose: vi.fn() } });

		expect(await screen.findByTestId('quick-fix-empty')).toBeInTheDocument();
		expect(screen.queryByTestId('unverified-list')).not.toBeInTheDocument();
		// Tidy-up is edit-only now — no create affordance here.
		expect(screen.queryByTestId('add-exercise')).not.toBeInTheDocument();
	});

	it('[WO-041] applies the staged category and muscles to the selection on Done', async () => {
		vi.mocked(listUnverifiedExercises).mockResolvedValue([
			ghost(1, 'Sandbag Carry'),
			ghost(2, 'Tire Flip')
		]);
		const result: BatchTagResult = { items: [undoItem(1), undoItem(2)] };
		vi.mocked(batchTagExercises).mockResolvedValue(result);
		const onclose = vi.fn();
		render(ExerciseQuickFix, { props: { onclose } });

		await fireEvent.click(await screen.findByLabelText('Select Sandbag Carry'));
		await fireEvent.click(screen.getByLabelText('Select Tire Flip'));

		// Staging a category + a muscle does NOT fire the command — Done does.
		await fireEvent.click(await screen.findByTestId('category-chip'));
		await fireEvent.click(screen.getByRole('button', { name: /Chest/ }));
		expect(batchTagExercises).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByTestId('quick-fix-done'));

		await waitFor(() => expect(batchTagExercises).toHaveBeenCalled());
		expect(vi.mocked(batchTagExercises).mock.calls[0][0]).toEqual({
			input: {
				exerciseIds: [1, 2],
				tags: [
					{ kind: 'category', value: 'barbell' },
					{ kind: 'muscle', value: 'chest', role: 'primary' }
				]
			}
		});
		// Done closes the modal; feedback is the post-close snackbar.
		expect(onclose).toHaveBeenCalled();
	});

	it('[WO-042] surfaces a post-close Undo snackbar that reverts the apply', async () => {
		vi.mocked(listUnverifiedExercises).mockResolvedValue([ghost(1, 'Sandbag Carry')]);
		const result: BatchTagResult = { items: [undoItem(1)] };
		vi.mocked(batchTagExercises).mockResolvedValue(result);
		vi.mocked(undoBatchTag).mockResolvedValue(undefined);
		render(ExerciseQuickFix, { props: { onclose: vi.fn() } });

		await fireEvent.click(await screen.findByLabelText('Select Sandbag Carry'));
		await fireEvent.click(await screen.findByTestId('category-chip'));
		await fireEvent.click(screen.getByTestId('quick-fix-done'));

		await waitFor(() => expect(undoSnackbar).toHaveBeenCalled());
		const [message, onUndo] = vi.mocked(undoSnackbar).mock.calls[0];
		expect(message).toContain('1 exercise');

		// Invoking the snackbar's Undo reverts via the backend.
		(onUndo as () => void)();
		await waitFor(() => expect(undoBatchTag).toHaveBeenCalled());
		expect(vi.mocked(undoBatchTag).mock.calls[0][0]).toEqual({ result });
	});

	it('[WO-041] Done just closes when nothing is staged', async () => {
		vi.mocked(listUnverifiedExercises).mockResolvedValue([ghost(1, 'Sandbag Carry')]);
		const onclose = vi.fn();
		render(ExerciseQuickFix, { props: { onclose } });

		await fireEvent.click(screen.getByTestId('quick-fix-done'));
		expect(batchTagExercises).not.toHaveBeenCalled();
		expect(onclose).toHaveBeenCalled();
	});
});
