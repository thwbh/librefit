import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import type { WeightTarget, WeightTracker, NewWeightTracker } from '$lib/api/gen';
import WeightScore from './WeightScore.svelte';
import { getDateAsStr } from '$lib/date';
import { subDays } from 'date-fns';

// Mock NumberFlow as a simple component that renders the number
// For Svelte 5, components need $$render method for SSR and proper client-side mounting
vi.mock('@number-flow/svelte', () => {
	const NumberFlowMock = function (anchor: any, props: any) {
		const value = props?.value ?? 0;
		const textNode = document.createTextNode(String(value));

		// Insert the text node
		if (anchor && anchor.parentNode) {
			anchor.parentNode.insertBefore(textNode, anchor);
		}

		return {
			p: (newProps: any) => {
				// update
				if (newProps.value !== undefined) {
					textNode.textContent = String(newProps.value);
				}
			},
			d: () => {
				// destroy
				if (textNode.parentNode) {
					textNode.parentNode.removeChild(textNode);
				}
			}
		};
	};

	return {
		default: NumberFlowMock
	};
});

describe('WeightScore', () => {
	const mockWeightTarget: WeightTarget = {
		id: 1,
		added: '2024-01-01',
		startDate: '2024-01-01',
		endDate: '2024-12-31',
		initialWeight: 85,
		targetWeight: 75
	};

	const mockWeightTracker: WeightTracker = {
		id: 1,
		added: '2024-01-15',
		time: '08:30:00',
		amount: 82
	};

	const mockWeightTrackerToday: WeightTracker = {
		id: 1,
		added: getDateAsStr(new Date()),
		time: '12:00:00',
		amount: 83
	};

	describe('Weight Display', () => {
		it('should display current weight when weightTracker provided', () => {
			const { container } = render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: mockWeightTarget
				}
			});

			// Check for kg unit and Last update message
			expect(container.textContent).toMatch(/82 kg/i);
		});

		it('should show dash when no weight data', () => {
			const newEntry: NewWeightTracker = {
				added: '2024-01-20',
				amount: 81
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: newEntry,
					weightTarget: mockWeightTarget
				}
			});

			expect(container.textContent).toContain('-');
		});
	});

	describe('Status Messages', () => {
		it('should show "Last update: Today" for current day entry', () => {
			render(WeightScore, {
				props: {
					weightTracker: mockWeightTrackerToday,
					weightTarget: mockWeightTarget
				}
			});

			expect(screen.getByText(/Last update: Today/i)).toBeTruthy();
		});

		it('should show days ago for old entries (warning < 2 days)', () => {
			// Create a tracker from 1 day ago
			const oldTracker: WeightTracker = {
				id: 1,
				added: getDateAsStr(subDays(new Date(), 1)),
				time: '08:30:00',
				amount: 83
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: oldTracker,
					weightTarget: mockWeightTarget
				}
			});

			// Should show days ago (within warning threshold)
			expect(container.textContent).toMatch(/Last update.*day.*ago/i);
		});

		it('should show critical warning for very old entries (> 2 days)', () => {
			// Create a tracker from 5 days ago
			const veryOldTracker: WeightTracker = {
				id: 1,
				added: getDateAsStr(subDays(new Date(), 5)),
				time: '08:30:00',
				amount: 83
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: veryOldTracker,
					weightTarget: mockWeightTarget
				}
			});

			// Should show "X days ago!" (where X >= 5)
			expect(container.textContent).toMatch(/Last update was.*\d+.*days ago!/i);
		});
	});

	describe('Icons and Visual States', () => {
		it('should show success state with ShieldCheck for current day', () => {
			render(WeightScore, {
				props: {
					weightTracker: mockWeightTrackerToday,
					weightTarget: mockWeightTarget
				}
			});

			// Check for "Last update: Today" text which appears with ShieldCheck icon
			expect(screen.getByText(/Last update: Today/i)).toBeTruthy();
		});

		it('should show warning state for entries 1-2 days old', () => {
			// Create a tracker from 1 day ago
			const oldTracker: WeightTracker = {
				id: 1,
				added: getDateAsStr(subDays(new Date(), 1)),
				time: '08:30:00',
				amount: 83
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: oldTracker,
					weightTarget: mockWeightTarget
				}
			});

			// ShieldWarning should show with "days ago" (not exclamation mark)
			expect(container.textContent).toMatch(/Last update.*1.*day.*ago\./i);
		});

		it('should show error state for entries older than 2 days', () => {
			// Create a tracker from 5 days ago
			const veryOldTracker: WeightTracker = {
				id: 1,
				added: getDateAsStr(subDays(new Date(), 5)),
				time: '08:30:00',
				amount: 83
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: veryOldTracker,
					weightTarget: mockWeightTarget
				}
			});

			// ShieldWarning (error color) should show with "days ago!" (with exclamation)
			expect(container.textContent).toMatch(/Last update was.*5.*days ago!/i);
		});
	});

	describe('Progress Information', () => {
		it('should show days left in target period', () => {
			// Mock with a target that ends in the future
			const futureTarget: WeightTarget = {
				...mockWeightTarget,
				endDate: '2099-12-31' // Far future
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: futureTarget
				}
			});

			expect(container.textContent).toMatch(/\d+ days left/i);
		});

		it('should show review plan button', () => {
			render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: mockWeightTarget
				}
			});

			expect(screen.getByText(/Review plan/i)).toBeTruthy();
		});

		it('should show progress bar', () => {
			const { container } = render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: mockWeightTarget
				}
			});

			const progressBar = container.querySelector('progress.progress');
			expect(progressBar).toBeTruthy();
		});
	});

	describe('Edge Cases', () => {
		it('should handle very large weight values', () => {
			const heavyTracker: WeightTracker = {
				id: 1,
				added: getDateAsStr(new Date()),
				time: '08:30:00',
				amount: 300
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: heavyTracker,
					weightTarget: mockWeightTarget
				}
			});

			// Component should render without error
			expect(container.textContent).toMatch(/300 kg/i);
			expect(container.textContent).toContain('Last update: Today');
		});

		it('should handle minimum weight values', () => {
			const lightTracker: WeightTracker = {
				id: 1,
				added: getDateAsStr(new Date()),
				time: '08:30:00',
				amount: 30
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: lightTracker,
					weightTarget: mockWeightTarget
				}
			});

			expect(container.textContent).toMatch(/30 kg/i);
			expect(container.textContent).toContain('Last update: Today');
		});

		it('should handle fractional weight values', () => {
			const fractionalTracker: WeightTracker = {
				id: 1,
				added: getDateAsStr(new Date()),
				time: '08:30:00',
				amount: 82.5
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: fractionalTracker,
					weightTarget: mockWeightTarget
				}
			});

			expect(container.textContent).toMatch(/82.5 kg/i);
			expect(container.textContent).toContain('Last update: Today');
		});
	});

	describe('Layout', () => {
		it('should have stat card structure', () => {
			const { container } = render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: mockWeightTarget
				}
			});

			expect(container.querySelector('.stat')).toBeTruthy();
			expect(container.querySelector('.stat-title')).toBeTruthy();
			expect(container.querySelector('.stat-value')).toBeTruthy();
			expect(container.querySelector('.stat-desc')).toBeTruthy();
		});

		it('should have progress container', () => {
			const { container } = render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: mockWeightTarget
				}
			});

			expect(container.querySelector('.progress-container')).toBeTruthy();
		});
	});
});
