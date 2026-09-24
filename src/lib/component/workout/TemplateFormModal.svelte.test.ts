import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TemplateFormModal from './TemplateFormModal.svelte';
import {
	createWorkoutTemplate,
	updateWorkoutTemplate,
	getExerciseLibrary,
	type ExerciseDetail,
	type TemplateDetail
} from '$lib/api';

// Template builder (WO-037) + bottom-sheet exercise swap (WO-039). The nested
// ExercisePicker fetches the library; persistence commands are stubbed.
vi.mock('$lib/api', () => ({
	createWorkoutTemplate: vi.fn(),
	updateWorkoutTemplate: vi.fn(),
	getExerciseLibrary: vi.fn(),
	quickAddExercise: vi.fn(),
	createCommandHooks: vi.fn(() => ({}))
}));

const ex = (id: number, name: string): ExerciseDetail => ({
	id,
	name,
	category: 'barbell',
	defaultRestSeconds: 90,
	muscles: [],
	seeded: true,
	verified: true
});

const library = [ex(1, 'Bench Press'), ex(2, 'Back Squat')];

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getExerciseLibrary).mockResolvedValue(library);
});

describe('TemplateFormModal', () => {
	it('[WO-037] builds a template from scratch with an added exercise', async () => {
		const created = {} as TemplateDetail;
		vi.mocked(createWorkoutTemplate).mockResolvedValue(created);
		const onsaved = vi.fn();
		render(TemplateFormModal, { props: { mode: 'create', onsaved, onclose: vi.fn() } });

		await fireEvent.input(screen.getByTestId('template-name'), {
			target: { value: 'Upper A' }
		});

		// Add an exercise through the bottom-sheet picker — it must actually open
		// (ModalDialog doesn't self-open; a closed <dialog> is display:none).
		await fireEvent.click(screen.getByTestId('add-template-exercise'));
		const sheet = document.querySelector('.template-picker-sheet dialog') as HTMLDialogElement;
		expect(sheet?.open).toBe(true);
		await fireEvent.input(await screen.findByLabelText('Search exercises'), {
			target: { value: 'bench' }
		});
		await fireEvent.click(await screen.findByText('Bench Press'));

		expect(screen.getByTestId('template-exercise-row')).toBeInTheDocument();

		// Fill the per-row targets so buildInput's parsing is exercised.
		await fireEvent.input(screen.getByLabelText('Target reps for Bench Press'), {
			target: { value: '8-12' }
		});
		await fireEvent.input(screen.getByLabelText('Target weight for Bench Press'), {
			target: { value: '60' }
		});

		await fireEvent.click(screen.getByTestId('save-template'));

		await waitFor(() => expect(createWorkoutTemplate).toHaveBeenCalled());
		const arg = vi.mocked(createWorkoutTemplate).mock.calls[0][0];
		expect(arg).toEqual({
			input: {
				name: 'Upper A',
				description: undefined,
				exercises: [{ exerciseId: 1, targetReps: '8-12', targetWeightKg: 60, notes: undefined }]
			}
		});
		expect(onsaved).toHaveBeenCalledWith(created);
	});

	it('[WO-039] swaps a template exercise in place, preserving its position', async () => {
		const detail: TemplateDetail = {
			template: { id: 7, name: 'Legs', isPredefined: false, createdAt: 'x' },
			exercises: [
				{ id: 70, exerciseId: 1, name: 'Bench Press', sequence: 0 },
				{ id: 71, exerciseId: 5, name: 'Barbell Row', sequence: 1 }
			]
		};
		vi.mocked(updateWorkoutTemplate).mockResolvedValue(detail);
		render(TemplateFormModal, {
			props: { mode: 'edit', detail, onsaved: vi.fn(), onclose: vi.fn() }
		});

		// Swap the FIRST row (Bench Press) for Back Squat.
		const swapButtons = screen.getAllByTestId('swap-exercise');
		await fireEvent.click(swapButtons[0]);
		await fireEvent.input(await screen.findByLabelText('Search exercises'), {
			target: { value: 'squat' }
		});
		await fireEvent.click(await screen.findByText('Back Squat'));

		await fireEvent.click(screen.getByTestId('save-template'));

		await waitFor(() => expect(updateWorkoutTemplate).toHaveBeenCalled());
		const arg = vi.mocked(updateWorkoutTemplate).mock.calls[0][0];
		// Replacement takes the first position; the second entry is untouched.
		expect(arg.input.exercises.map((e) => e.exerciseId)).toEqual([2, 5]);
		expect(arg.id).toBe(7);
	});
});
