import { render, screen, fireEvent } from '@testing-library/svelte';
import ExercisePicker from './ExercisePicker.svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getExerciseLibrary } from '$lib/api';

// Mock the API
vi.mock('$lib/api', () => ({
	getExerciseLibrary: vi.fn()
}));

const mockLibrary = [
	{
		id: 1,
		name: 'Bench Press',
		category: 'barbell',
		default_rest_seconds: 180,
		muscles: [
			{ muscle: 'chest', role: 'primary' },
			{ muscle: 'triceps', role: 'secondary' },
			{ muscle: 'deltoids', role: 'secondary' }
		]
	},
	{
		id: 2,
		name: 'Back Squat',
		category: 'barbell',
		default_rest_seconds: 240,
		muscles: [
			{ muscle: 'quadriceps', role: 'primary' },
			{ muscle: 'gluteal', role: 'secondary' }
		]
	},
	{
		id: 3,
		name: 'Lat Pulldown',
		category: 'machine',
		default_rest_seconds: 60,
		muscles: [
			{ muscle: 'upper-back', role: 'primary' },
			{ muscle: 'biceps', role: 'secondary' }
		]
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
			screen.getByText((content, element) => {
				return element?.classList.contains('loading-spinner');
			})
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

// Helper to access mocked function
declare module '$lib/api' {
	export const getExerciseLibrary: typeof import('$lib/api').getExerciseLibrary;
}
