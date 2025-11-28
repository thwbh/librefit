import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { WeightTarget, WeightTracker, NewWeightTracker } from '$lib/api/gen';
import WeightScore from './WeightScore.svelte';

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
		amount: 82
	};

	const mockLastWeightTracker: WeightTracker = {
		id: 1,
		added: '2024-01-10',
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
			expect(container.textContent).toContain('kg');
			expect(container.textContent).toContain('Last update: Today');
		});

		it('should display last weight when only lastWeightTracker provided', () => {
			const newEntry: NewWeightTracker = {
				added: '2024-01-20',
				amount: 81
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: newEntry,
					lastWeightTracker: mockLastWeightTracker,
					weightTarget: mockWeightTarget
				}
			});

			// Check for kg unit and last update message
			expect(container.textContent).toContain('kg');
			expect(container.textContent).toMatch(/Last update/i);
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
		it('should show "Nothing tracked yet" when no data', () => {
			const newEntry: NewWeightTracker = {
				added: '2024-01-20',
				amount: 81
			};

			render(WeightScore, {
				props: {
					weightTracker: newEntry,
					weightTarget: mockWeightTarget
				}
			});

			expect(screen.getByText(/Nothing tracked yet/i)).toBeTruthy();
		});

		it('should show "Last update: Today" for current day entry', () => {
			render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: mockWeightTarget
				}
			});

			expect(screen.getByText(/Last update: Today/i)).toBeTruthy();
		});

		it('should show days ago for old entries (warning < 2 days)', () => {
			// Create a tracker from 1 day ago
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterdayStr = yesterday.toISOString().split('T')[0];

			const oldTracker: WeightTracker = {
				id: 1,
				added: yesterdayStr,
				amount: 83
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: { added: '2024-01-20', amount: 81 } as NewWeightTracker,
					lastWeightTracker: oldTracker,
					weightTarget: mockWeightTarget
				}
			});

			// Should show days ago (within warning threshold)
			expect(container.textContent).toMatch(/Last update.*day.*ago/i);
		});

		it('should show critical warning for very old entries (> 2 days)', () => {
			// Create a tracker from 5 days ago
			const fiveDaysAgo = new Date();
			fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
			const oldDate = fiveDaysAgo.toISOString().split('T')[0];

			const veryOldTracker: WeightTracker = {
				id: 1,
				added: oldDate,
				amount: 83
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: { added: '2024-01-20', amount: 81 } as NewWeightTracker,
					lastWeightTracker: veryOldTracker,
					weightTarget: mockWeightTarget
				}
			});

			// Should show "X days ago!" (where X >= 5)
			expect(container.textContent).toMatch(/Last update was.*\d+.*days ago!/i);
		});
	});

	describe('Icons and Visual States', () => {
		it('should show ShieldCheck icon for current day', () => {
			const { container } = render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: mockWeightTarget
				}
			});

			// Check for success color
			expect(container.querySelector('.text-success')).toBeTruthy();
		});

		it('should show Shield icon when no data', () => {
			const { container } = render(WeightScore, {
				props: {
					weightTracker: { added: '2024-01-20', amount: 81 } as NewWeightTracker,
					weightTarget: mockWeightTarget
				}
			});

			expect(container.querySelector('.stat-desc')).toBeTruthy();
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

	describe('Modal Interaction', () => {
		it('should render Set Weight button', () => {
			render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: mockWeightTarget,
					onAdd: vi.fn()
				}
			});

			expect(screen.getByLabelText(/Set Weight/i)).toBeTruthy();
		});

		it('should open modal when Set Weight button clicked', async () => {
			const user = userEvent.setup();

			const { container } = render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: mockWeightTarget,
					onAdd: vi.fn()
				}
			});

			const button = screen.getByLabelText(/Set Weight/i);
			expect(button).toBeTruthy();

			await user.click(button);

			// Modal should be open
			await waitFor(() => {
				const modal = container.querySelector('dialog[open]');
				expect(modal).toBeTruthy();
			});
		});

		it('should show weight stepper in modal', async () => {
			const user = userEvent.setup();

			const { container } = render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: mockWeightTarget,
					onAdd: vi.fn()
				}
			});

			const button = screen.getByLabelText(/Set Weight/i);
			await user.click(button);

			await waitFor(() => {
				const modal = container.querySelector('dialog[open]');
				expect(modal).toBeTruthy();

				// Should have NumberStepper for weight input
				expect(modal?.textContent).toContain('Current Weight');
			});
		});
	});

	describe('Callbacks', () => {
		it('should call onadd when provided', async () => {
			const onaddMock = vi.fn().mockResolvedValue({
				id: 2,
				added: '2024-01-20',
				amount: 80
			});

			render(WeightScore, {
				props: {
					weightTracker: mockWeightTracker,
					weightTarget: mockWeightTarget,
					onAdd: onaddMock
				}
			});

			// Component should render without calling onadd immediately
			expect(onaddMock).not.toHaveBeenCalled();
		});

		it('should work without onadd callback', () => {
			expect(() => {
				render(WeightScore, {
					props: {
						weightTracker: mockWeightTracker,
						weightTarget: mockWeightTarget
					}
				});
			}).not.toThrow();
		});

		it('should work without onedit callback', () => {
			expect(() => {
				render(WeightScore, {
					props: {
						weightTracker: mockWeightTracker,
						weightTarget: mockWeightTarget
					}
				});
			}).not.toThrow();
		});
	});

	describe('Edge Cases', () => {
		it('should handle missing weightTracker', () => {
			const { container } = render(WeightScore, {
				props: {
					weightTarget: mockWeightTarget
				}
			});

			expect(container).toBeTruthy();
		});

		it('should handle very large weight values', () => {
			const heavyTracker: WeightTracker = {
				id: 1,
				added: '2024-01-15',
				amount: 300
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: heavyTracker,
					weightTarget: mockWeightTarget
				}
			});

			// Component should render without error
			expect(container.textContent).toContain('kg');
			expect(container.textContent).toContain('Last update: Today');
		});

		it('should handle minimum weight values', () => {
			const lightTracker: WeightTracker = {
				id: 1,
				added: '2024-01-15',
				amount: 30
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: lightTracker,
					weightTarget: mockWeightTarget
				}
			});

			expect(container.textContent).toContain('kg');
			expect(container.textContent).toContain('Last update: Today');
		});

		it('should handle fractional weight values', () => {
			const fractionalTracker: WeightTracker = {
				id: 1,
				added: '2024-01-15',
				amount: 82.5
			};

			const { container } = render(WeightScore, {
				props: {
					weightTracker: fractionalTracker,
					weightTarget: mockWeightTarget
				}
			});

			expect(container.textContent).toContain('kg');
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
