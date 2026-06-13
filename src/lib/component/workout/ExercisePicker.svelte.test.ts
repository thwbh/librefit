import { render, screen, fireEvent } from '@testing-library/svelte';
import ExercisePicker from './ExercisePicker.svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getExerciseLibrary, quickAddExercise, type ExerciseDetail } from '$lib/api';

// Mock the API
vi.mock('$lib/api', () => ({
	getExerciseLibrary: vi.fn(),
	quickAddExercise: vi.fn()
}));

// Shapes match the generated ExerciseDetail (camelCase wire format): muscles
// carry exerciseId, rest is defaultRestSeconds. Seeded rows are seeded+verified.
const m = (exerciseId: number, muscle: string, role: string) => ({ exerciseId, muscle, role });
const mockLibrary: ExerciseDetail[] = [
	{
		id: 1,
		name: 'Bench Press',
		category: 'barbell',
		defaultRestSeconds: 180,
		muscles: [
			m(1, 'chest', 'primary'),
			m(1, 'triceps', 'secondary'),
			m(1, 'deltoids', 'secondary')
		],
		seeded: true,
		verified: true
	},
	{
		id: 2,
		name: 'Back Squat',
		category: 'barbell',
		defaultRestSeconds: 240,
		muscles: [m(2, 'quadriceps', 'primary'), m(2, 'gluteal', 'secondary')],
		seeded: true,
		verified: true
	},
	{
		id: 3,
		name: 'Lat Pulldown',
		category: 'machine',
		defaultRestSeconds: 60,
		muscles: [m(3, 'upper-back', 'primary'), m(3, 'biceps', 'secondary')],
		seeded: true,
		verified: true
	},
	// A user-created, fully-verified exercise.
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

describe('ExercisePicker', () => {
	beforeEach(() => {
		vi.mocked(getExerciseLibrary).mockResolvedValue(mockLibrary);
	});

	it('[WO-025] filters exercises by name, category, and muscle groups', async () => {
		render(ExercisePicker, { props: { onpick: vi.fn() } });

		// Wait for library to load
		await screen.findByPlaceholderText('Search exercises');

		// Test name search
		const input = screen.getByPlaceholderText('Search exercises');
		await fireEvent.input(input, { target: { value: 'press' } });

		expect(screen.getByText('Bench Press')).toBeInTheDocument();
		expect(screen.queryByText('Back Squat')).not.toBeInTheDocument();
		expect(screen.queryByText('Lat Pulldown')).not.toBeInTheDocument();

		// Clear and test category search
		await fireEvent.input(input, { target: { value: '' } });
		await fireEvent.input(input, { target: { value: 'machine' } });

		expect(screen.getByText('Lat Pulldown')).toBeInTheDocument();
		expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
		expect(screen.queryByText('Back Squat')).not.toBeInTheDocument();

		// Clear and test muscle search
		await fireEvent.input(input, { target: { value: '' } });
		await fireEvent.input(input, { target: { value: 'chest' } });

		expect(screen.getByText('Bench Press')).toBeInTheDocument();
		expect(screen.queryByText('Back Squat')).not.toBeInTheDocument();
		expect(screen.queryByText('Lat Pulldown')).not.toBeInTheDocument();
	});

	it('[WO-026] clears search to initial prompt state', async () => {
		render(ExercisePicker, { props: { onpick: vi.fn() } });

		const input = screen.getByPlaceholderText('Search exercises');
		await fireEvent.input(input, { target: { value: 'press' } });

		// Should show results
		expect(screen.getByText('Bench Press')).toBeInTheDocument();

		// Clear search
		await fireEvent.input(input, { target: { value: '' } });

		// Should show initial prompt, not full library
		expect(screen.getByText('Type to search exercises.')).toBeInTheDocument();
		expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
	});

	it('[WO-027] shows empty state when no matches', async () => {
		render(ExercisePicker, { props: { onpick: vi.fn() } });

		const input = screen.getByPlaceholderText('Search exercises');
		await fireEvent.input(input, { target: { value: 'nonexistent' } });

		// Check for specific empty state message format (uses smart quotes)
		const emptyMessage = screen.getByText('No exercises match “nonexistent”.');
		expect(emptyMessage).toBeInTheDocument();
		expect(emptyMessage).toHaveClass('text-sm');
		expect(emptyMessage).toHaveClass('opacity-60');

		// Verify no exercises are shown
		expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
	});

	it('shows loading state initially', async () => {
		vi.mocked(getExerciseLibrary).mockImplementationOnce(
			() => new Promise((resolve) => setTimeout(() => resolve(mockLibrary), 100))
		);

		render(ExercisePicker, { props: { onpick: vi.fn() } });

		// Check for loading spinner by class
		expect(
			screen.getByText(
				(_content, element) => element?.classList.contains('loading-spinner') ?? false
			)
		).toBeInTheDocument();

		await screen.findByPlaceholderText('Search exercises');
	});

	it('shows error state when API fails', async () => {
		vi.mocked(getExerciseLibrary).mockRejectedValue(new Error('API failed'));

		render(ExercisePicker, { props: { onpick: vi.fn() } });

		await screen.findByText('Error: API failed');
	});

	it('calls onpick when exercise is selected', async () => {
		const onpick = vi.fn();
		render(ExercisePicker, { props: { onpick } });

		const input = screen.getByPlaceholderText('Search exercises');
		await fireEvent.input(input, { target: { value: 'press' } });

		const benchPress = screen.getByText('Bench Press');
		await fireEvent.click(benchPress);

		expect(onpick).toHaveBeenCalledWith(mockLibrary[0]);
	});

	it('[WO-033] marks user-created exercises distinctly from seeded ones', async () => {
		render(ExercisePicker, { props: { onpick: vi.fn() } });

		const input = screen.getByPlaceholderText('Search exercises');
		// "press" matches seeded "Bench Press" and user "Atlas Press".
		await fireEvent.input(input, { target: { value: 'press' } });

		const userBtn = screen.getByText('Atlas Press').closest('button');
		const seededBtn = screen.getByText('Bench Press').closest('button');
		expect(userBtn?.querySelector('[data-testid="custom-badge"]')).toBeTruthy();
		expect(seededBtn?.querySelector('[data-testid="custom-badge"]')).toBeFalsy();
	});

	it('[WO-036] quick-add creates a name-only exercise and selects it in place', async () => {
		const created: ExerciseDetail = {
			id: 51,
			name: 'Sandbag Carry',
			category: 'uncategorized',
			defaultRestSeconds: undefined,
			muscles: [],
			seeded: false,
			verified: false
		};
		vi.mocked(quickAddExercise).mockResolvedValue(created);
		const onpick = vi.fn();
		render(ExercisePicker, { props: { onpick } });

		const input = screen.getByPlaceholderText('Search exercises');
		await fireEvent.input(input, { target: { value: 'Sandbag Carry' } });

		// No match -> a quick-add affordance offers to create it.
		const quickAdd = await screen.findByTestId('quick-add');
		await fireEvent.click(quickAdd);

		expect(quickAddExercise).toHaveBeenCalledWith({ name: 'Sandbag Carry' });
		expect(onpick).toHaveBeenCalledWith(created);
	});

	it('displays exercise details including category and muscles', async () => {
		render(ExercisePicker, { props: { onpick: vi.fn() } });

		const input = screen.getByPlaceholderText('Search exercises');
		await fireEvent.input(input, { target: { value: 'press' } });

		const button = screen.getByText('Bench Press').closest('button');
		expect(button).toHaveTextContent('Barbell');
		expect(button).toHaveTextContent('Chest');
		expect(button).toHaveTextContent('Triceps');
		expect(button).toHaveTextContent('Deltoids');
	});
});
