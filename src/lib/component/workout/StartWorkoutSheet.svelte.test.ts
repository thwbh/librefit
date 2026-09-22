import { render, screen, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import StartWorkoutSheet from './StartWorkoutSheet.svelte';
import { listWorkoutTemplates, type TemplateDetail } from '$lib/api';

// Start Workout chooser (WO-040): empty session or start from a template.
vi.mock('$lib/api', () => ({ listWorkoutTemplates: vi.fn() }));

const detail: TemplateDetail = {
	template: { id: 3, name: 'Leg Day', isPredefined: true, createdAt: 'x' },
	exercises: [
		{ id: 1, exerciseId: 2, name: 'Back Squat', sequence: 0 },
		{ id: 2, exerciseId: 11, name: 'Romanian Deadlift', sequence: 1 }
	]
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(listWorkoutTemplates).mockResolvedValue([detail]);
});

describe('StartWorkoutSheet', () => {
	it('[WO-040] starting from a template invokes ontemplate with its id', async () => {
		const ontemplate = vi.fn();
		render(StartWorkoutSheet, {
			props: { onempty: vi.fn(), ontemplate, onclose: vi.fn() }
		});

		await fireEvent.click(await screen.findByText('Leg Day'));
		expect(ontemplate).toHaveBeenCalledWith(3);
	});

	it('[WO-040] the empty option invokes onempty', async () => {
		const onempty = vi.fn();
		render(StartWorkoutSheet, {
			props: { onempty, ontemplate: vi.fn(), onclose: vi.fn() }
		});

		await fireEvent.click(screen.getByTestId('start-empty'));
		expect(onempty).toHaveBeenCalled();
	});
});
