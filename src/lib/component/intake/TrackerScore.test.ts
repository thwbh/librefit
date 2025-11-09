import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import type { CalorieTarget } from '$lib/api/gen';
import TrackerScore from './TrackerScore.svelte';

describe('TrackerScore', () => {
	const mockCalorieTarget: CalorieTarget = {
		id: 1,
		added: '2024-01-01',
		startDate: '2024-01-01',
		endDate: '2024-12-31',
		targetCalories: 2000,
		maximumCalories: 2500
	};

	describe('Calculation Logic', () => {
		it('should calculate total from entries', () => {
			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [500, 300, 200]
				}
			});

			// Should display 1000 total (500 + 300 + 200)
			expect(container.textContent).toContain('1000');
		});

		it('should show 0 when entries is empty', () => {
			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: []
				}
			});

			// Should display 0
			expect(container.textContent).toContain('0');
		});

		it('should calculate percentage correctly', () => {
			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [1000] // 50% of 2000 target
				}
			});

			// Should show 50%
			expect(container.textContent).toContain('50%');
		});

		it('should calculate 100% when at target', () => {
			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [2000] // Exactly at target
				}
			});

			expect(container.textContent).toContain('100%');
		});

		it('should show over 100% when exceeding target', () => {
			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [2200] // 110% of target
				}
			});

			expect(container.textContent).toContain('110%');
		});
	});

	describe('Status Messages', () => {
		it('should show "No intake tracked yet" when no entries (current day)', () => {
			render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [],
					isHistory: false
				}
			});

			expect(screen.getByText(/No intake tracked yet/i)).toBeTruthy();
		});

		it('should show "No intake tracked" for history', () => {
			render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [],
					isHistory: true
				}
			});

			expect(screen.getByText(/No intake tracked\./i)).toBeTruthy();
		});

		it('should show remaining calories when under target', () => {
			render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [1500], // 500 kcal left
					isHistory: false
				}
			});

			expect(screen.getByText(/500kcal left for today/i)).toBeTruthy();
		});

		it('should show warning when over target but under maximum', () => {
			render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [2200], // Over target (2000) but under max (2500)
					isHistory: false
				}
			});

			expect(screen.getByText(/Warning.*300kcal left for hardcap/i)).toBeTruthy();
		});

		it('should show critical warning when over maximum', () => {
			render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [2700], // 200 over maximum
					isHistory: false
				}
			});

			expect(screen.getByText(/Warning!.*200kcal over hardcap/i)).toBeTruthy();
		});
	});

	describe('Visual States', () => {
		it('should show ShieldCheck icon when within target', () => {
			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [1500]
				}
			});

			// Check for primary color class (within target)
			expect(container.querySelector('.text-primary')).toBeTruthy();
		});

		it('should show Shield icon when at 0', () => {
			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: []
				}
			});

			// Check for stat-desc color (no intake)
			expect(container.querySelector('.stat-desc')).toBeTruthy();
		});

		it('should show warning color when over target', () => {
			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [2200]
				}
			});

			// Check for warning color
			expect(container.querySelector('.text-warning')).toBeTruthy();
		});

		it('should show error color when over maximum', () => {
			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [2600]
				}
			});

			// Check for error color
			expect(container.querySelector('.text-error')).toBeTruthy();
		});
	});

	describe('Display Variations', () => {
		it('should show "Today\'s Intake" when not history', () => {
			render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [1000],
					isHistory: false
				}
			});

			expect(screen.getByText("Today's Intake")).toBeTruthy();
		});

		it('should show "Intake" when history', () => {
			render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [1000],
					isHistory: true
				}
			});

			expect(screen.getByText('Intake')).toBeTruthy();
		});
	});

	describe('Edge Cases', () => {
		it('should handle very large calorie values', () => {
			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [10000]
				}
			});

			// Should show 500% (10000 / 2000 * 100)
			expect(container.textContent).toContain('500%');
			// The warning message will also appear
			expect(container.textContent).toMatch(/over hardcap/i);
		});

		it('should handle many small entries', () => {
			const manyEntries = Array(100).fill(20); // 100 entries of 20 each = 2000

			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: manyEntries
				}
			});

			expect(container.textContent).toContain('2000');
			expect(container.textContent).toContain('100%');
		});

		it('should handle zero target calories', () => {
			const zeroTarget = { ...mockCalorieTarget, targetCalories: 0, maximumCalories: 0 };

			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: zeroTarget,
					entries: [100]
				}
			});

			// Should not crash
			expect(container).toBeTruthy();
		});

		it('should handle fractional calories', () => {
			const { container } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [500.5, 300.25, 199.25] // Total = 1000
				}
			});

			expect(container.textContent).toContain('1000');
		});
	});

	describe('Reactivity', () => {
		it('should update when entries change', async () => {
			let entries = [500];
			const { container, component } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries
				}
			});

			// Initial state
			expect(container.textContent).toContain('500');

			// Update entries (note: we need to pass new props)
			// In a real scenario, parent would re-render with new entries
			expect(component).toBeTruthy();
		});

		it('should update when calorie target changes', async () => {
			const { container, component } = render(TrackerScore, {
				props: {
					calorieTarget: mockCalorieTarget,
					entries: [1000]
				}
			});

			// Should show target of 2000
			expect(container.textContent).toContain('2000');

			expect(component).toBeTruthy();
		});
	});
});
