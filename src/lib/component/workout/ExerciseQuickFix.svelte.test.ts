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

// Batch-tagging quick-fix workspace (WO-041, WO-042, WO-043). Real ModalDialog /
// EmptyState / AlertBox are kept (feedback renders in-modal, not via a layout
// snackbar). API commands are stubbed.
vi.mock('$lib/api', () => ({
	listUnverifiedExercises: vi.fn(),
	batchTagExercises: vi.fn(),
	undoBatchTag: vi.fn(),
	listExerciseCategories: vi.fn(),
	listMuscles: vi.fn(),
	createCommandHooks: vi.fn(() => ({}))
}));

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
	createdAt: '2026-06-13T08:00:00.000Z'
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
	});

	it('[WO-041] stages a tag and applies it to several selected exercises on Apply', async () => {
		vi.mocked(listUnverifiedExercises).mockResolvedValue([
			ghost(1, 'Sandbag Carry'),
			ghost(2, 'Tire Flip')
		]);
		const result: BatchTagResult = {
			items: [
				{ exerciseId: 1, prevCategory: 'uncategorized', prevVerified: false },
				{ exerciseId: 2, prevCategory: 'uncategorized', prevVerified: false }
			]
		};
		vi.mocked(batchTagExercises).mockResolvedValue(result);
		render(ExerciseQuickFix, { props: { onclose: vi.fn() } });

		await fireEvent.click(await screen.findByLabelText('Select Sandbag Carry'));
		await fireEvent.click(screen.getByLabelText('Select Tire Flip'));

		// Staging a category does NOT fire the command — Apply does.
		await fireEvent.click(await screen.findByTestId('tag-category'));
		expect(batchTagExercises).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByTestId('apply-tag'));

		await waitFor(() => expect(batchTagExercises).toHaveBeenCalled());
		expect(vi.mocked(batchTagExercises).mock.calls[0][0]).toEqual({
			input: { exerciseIds: [1, 2], tag: { kind: 'category', value: 'barbell' } }
		});
	});

	it('[WO-042] offers in-modal Undo after applying and reverts the application', async () => {
		vi.mocked(listUnverifiedExercises).mockResolvedValue([ghost(1, 'Sandbag Carry')]);
		const result: BatchTagResult = {
			items: [{ exerciseId: 1, prevCategory: 'uncategorized', prevVerified: false }]
		};
		vi.mocked(batchTagExercises).mockResolvedValue(result);
		vi.mocked(undoBatchTag).mockResolvedValue(undefined);
		render(ExerciseQuickFix, { props: { onclose: vi.fn() } });

		await fireEvent.click(await screen.findByLabelText('Select Sandbag Carry'));
		await fireEvent.click(await screen.findByTestId('tag-category'));
		await fireEvent.click(screen.getByTestId('apply-tag'));

		// The Undo affordance is shown inside the modal (not a layout snackbar).
		const undoBtn = await screen.findByTestId('undo-tag');
		await fireEvent.click(undoBtn);

		await waitFor(() => expect(undoBatchTag).toHaveBeenCalled());
		expect(vi.mocked(undoBatchTag).mock.calls[0][0]).toEqual({ result });
	});
});
