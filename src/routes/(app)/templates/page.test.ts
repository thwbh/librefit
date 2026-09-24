import { render, screen, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import TemplatesPage from './+page.svelte';
import {
	listWorkoutTemplates,
	cloneWorkoutTemplate,
	getExerciseLibrary,
	type TemplateDetail
} from '$lib/api';

// Template management screen (WO-037/038). Persistence commands stubbed; the builder
// opened after a clone pulls the exercise library through the picker.
vi.mock('$lib/api', () => ({
	listWorkoutTemplates: vi.fn(),
	deleteWorkoutTemplate: vi.fn(),
	cloneWorkoutTemplate: vi.fn(),
	createWorkoutTemplate: vi.fn(),
	updateWorkoutTemplate: vi.fn(),
	getExerciseLibrary: vi.fn(),
	quickAddExercise: vi.fn(),
	createCommandHooks: vi.fn(() => ({}))
}));

const predefined: TemplateDetail = {
	template: { id: 1, name: 'Push Day', isPredefined: true, createdAt: 'x' },
	exercises: [{ id: 1, exerciseId: 1, name: 'Bench Press', sequence: 0 }]
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(listWorkoutTemplates).mockResolvedValue([predefined]);
	vi.mocked(getExerciseLibrary).mockResolvedValue([]);
});

afterEach(() => {
	document.querySelectorAll('[data-testid="add-template"]').forEach((n) => n.remove());
});

describe('Templates management page', () => {
	it('[WO-037] lists templates with their exercise summary', async () => {
		render(TemplatesPage);
		expect(await screen.findByText('Push Day')).toBeInTheDocument();
		expect(screen.getByTestId('predefined-template-row')).toHaveTextContent('Bench Press');
	});

	it('[WO-038] cloning a predefined template creates a copy and opens it for editing', async () => {
		const copy: TemplateDetail = {
			template: { id: 50, name: 'Push Day (copy)', isPredefined: false, createdAt: 'y' },
			exercises: [{ id: 90, exerciseId: 1, name: 'Bench Press', sequence: 0 }]
		};
		vi.mocked(cloneWorkoutTemplate).mockResolvedValue(copy);
		render(TemplatesPage);

		await fireEvent.click(await screen.findByTestId('clone-template'));

		expect(vi.mocked(cloneWorkoutTemplate).mock.calls[0][0]).toEqual({ id: 1 });
		// The editable copy opens straight in the builder.
		expect(await screen.findByText('Edit Template')).toBeInTheDocument();
		expect(screen.getByTestId('template-name')).toHaveValue('Push Day (copy)');
	});
});
