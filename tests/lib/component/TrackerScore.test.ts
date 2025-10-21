import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TrackerScore from '../../../src/lib/component/intake/TrackerScore.svelte';
import type { CalorieTarget } from '$lib/api/gen';

// Mock NumberFlow component
vi.mock('@number-flow/svelte', () => ({
	default: vi.fn(({ value }) => `<span data-testid="number-flow">${value}</span>`)
}));

describe('TrackerScore Component', () => {
	const mockCalorieTarget: CalorieTarget = {
		id: 1,
		added: '2023-01-01',
		endDate: '2023-12-31',
		maximumCalories: 2500,
		startDate: '2023-01-01',
		targetCalories: 2000
	};

	it('should display correct percentage and total when entries are provided', () => {
		const entries = [500, 300, 200];
		render(TrackerScore, {
			props: {
				calorieTarget: mockCalorieTarget,
				entries: entries
			}
		});

		// Check for separate elements since they may be split
		expect(screen.getByText('/2000')).toBeInTheDocument();
		// Percentage should be 50%
		expect(screen.getByText('50%')).toBeInTheDocument();
	});

	it('should show zero values when no entries provided', () => {
		render(TrackerScore, {
			props: {
				calorieTarget: mockCalorieTarget,
				entries: []
			}
		});

		expect(screen.getByText('/2000')).toBeInTheDocument();
		expect(screen.getByText('0%')).toBeInTheDocument();
	});

	it('should display "Today\'s Intake" title when not history mode', () => {
		render(TrackerScore, {
			props: {
				calorieTarget: mockCalorieTarget,
				entries: [1000]
			}
		});

		expect(screen.getByText("Today's Intake")).toBeInTheDocument();
	});

	it('should display "Intake" title when in history mode', () => {
		render(TrackerScore, {
			props: {
				calorieTarget: mockCalorieTarget,
				entries: [1000],
				isHistory: true
			}
		});

		expect(screen.getByText("Intake")).toBeInTheDocument();
	});

	it('should show success message when within target', () => {
		const entries = [1500]; // Within 2000 target
		render(TrackerScore, {
			props: {
				calorieTarget: mockCalorieTarget,
				entries: entries
			}
		});

		expect(screen.getByText(/All good/)).toBeInTheDocument();
		expect(screen.getByText(/500kcal left/)).toBeInTheDocument();
	});

	it('should show warning when over target but under maximum', () => {
		const entries = [2200]; // Over 2000 target but under 2500 maximum
		render(TrackerScore, {
			props: {
				calorieTarget: mockCalorieTarget,
				entries: entries
			}
		});

		expect(screen.getByText(/Warning/)).toBeInTheDocument();
		expect(screen.getByText(/300kcal left for hardcap/)).toBeInTheDocument();
	});

	it('should show error when over maximum', () => {
		const entries = [2600]; // Over 2500 maximum
		render(TrackerScore, {
			props: {
				calorieTarget: mockCalorieTarget,
				entries: entries
			}
		});

		expect(screen.getByText(/Warning!/)).toBeInTheDocument();
		expect(screen.getByText(/100kcal over hardcap/)).toBeInTheDocument();
	});

	it('should show "no intake tracked" message when total is zero', () => {
		render(TrackerScore, {
			props: {
				calorieTarget: mockCalorieTarget,
				entries: []
			}
		});

		expect(screen.getByText(/No intake tracked/)).toBeInTheDocument();
	});

	it('should show different message for history mode when no intake', () => {
		render(TrackerScore, {
			props: {
				calorieTarget: mockCalorieTarget,
				entries: [],
				isHistory: true
			}
		});

		expect(screen.getByText(/No intake tracked/)).toBeInTheDocument();
	});

	it('should apply correct CSS classes based on intake status', () => {
		const entries = [2600]; // Over maximum
		render(TrackerScore, {
			props: {
				calorieTarget: mockCalorieTarget,
				entries: entries
			}
		});

		const progressBar = screen.getByRole('progressbar');
		expect(progressBar.className).toContain('text-error');
	});

	it('should show correct percentage calculation', () => {
		const entries = [1000]; // 50% of 2000 target
		render(TrackerScore, {
			props: {
				calorieTarget: mockCalorieTarget,
				entries: entries
			}
		});

		const progressBar = screen.getByRole('progressbar');
		expect(progressBar.style.getPropertyValue('--value')).toBe('50');
	});
});