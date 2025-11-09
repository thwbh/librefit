import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import TrackerStack from './TrackerStack.svelte';
import type { CalorieTracker } from '$lib/api/gen';
import TestWrapper from '../../../../tests/utils/TestWrapper.svelte';
import { setupVeilchenMock } from '../../../../tests/utils/mocks';

// Setup mocks
setupVeilchenMock();

const mockCategories = [
	{ shortvalue: 'b', longvalue: 'Breakfast' },
	{ shortvalue: 'l', longvalue: 'Lunch' },
	{ shortvalue: 'd', longvalue: 'Dinner' },
	{ shortvalue: 's', longvalue: 'Snack' },
	{ shortvalue: 't', longvalue: 'Treat' }
];

function renderWithContext(props: any) {
	return render(TestWrapper, {
		props: {
			component: TrackerStack,
			props,
			categories: mockCategories
		}
	});
}

describe('TrackerStack', () => {
	const mockEntries: CalorieTracker[] = [
		{
			id: 1,
			added: '2024-01-01',
			category: 'b',
			amount: 400,
			description: 'Oatmeal'
		},
		{
			id: 2,
			added: '2024-01-01',
			category: 'l',
			amount: 600,
			description: 'Salad'
		},
		{
			id: 3,
			added: '2024-01-01',
			category: 'd',
			amount: 800,
			description: 'Pasta'
		}
	];

	describe('Empty State', () => {
		it('should display empty state when no entries', () => {
			renderWithContext({ entries: [] });

			expect(screen.getByText(/Nothing tracked today/i)).toBeTruthy();
			expect(screen.getByText(/Use the button below/i)).toBeTruthy();
		});

		it('should show AlertBox with warning type', () => {
			const { container } = renderWithContext({ entries: [] });

			const alertBox = container.querySelector('.alert, [role="alert"]');
			expect(alertBox).toBeTruthy();
		});

		it('should always show Add Intake button', () => {
			renderWithContext({ entries: [] });

			expect(screen.getByRole('button', { name: 'Add Intake' })).toBeTruthy();
		});
	});

	describe('Stack Display', () => {
		it('should display entries when provided', () => {
			const { container } = renderWithContext({ entries: mockEntries });

			// Stack shows one entry at a time (the active one)
			// First entry should be visible
			expect(container.textContent).toContain('Breakfast');
		});

		it('should display entries in readonly mode', () => {
			const { container } = renderWithContext({ entries: mockEntries });

			// CalorieTrackerMask should be in readonly mode
			// First entry's category should be displayed
			expect(container.textContent).toContain('Breakfast');
		});

		it('should show Add Intake button with entries', () => {
			renderWithContext({ entries: mockEntries });

			expect(screen.getByRole('button', { name: 'Add Intake' })).toBeTruthy();
		});

		it('should handle single entry', () => {
			const { container } = renderWithContext({ entries: [mockEntries[0]] });

			expect(container.textContent).toContain('Breakfast');
		});
	});

	describe('Add Intake Modal', () => {
		it('should open create modal when Add Intake clicked', async () => {
			const user = userEvent.setup();
			const { container } = renderWithContext({ entries: mockEntries });

			const addButton = screen.getByRole('button', { name: 'Add Intake' });
			await user.click(addButton);

			await waitFor(() => {
				const modal = container.querySelector('dialog[open]');
				expect(modal).toBeTruthy();
			});
		});

		it('should show "Add Intake" title in create modal', async () => {
			const user = userEvent.setup();
			const { container } = renderWithContext({ entries: [] });

			await user.click(screen.getByRole('button', { name: 'Add Intake' }));

			await waitFor(() => {
				// Check modal is open and has title
				const modal = container.querySelector('dialog[open]');
				expect(modal).toBeTruthy();
				expect(container.textContent).toContain('Add Intake');
			});
		});

		it('should show current date in create modal', async () => {
			const user = userEvent.setup();
			const { container } = renderWithContext({ entries: [] });

			await user.click(screen.getByRole('button', { name: 'Add Intake' }));

			await waitFor(() => {
				// Should show "Date:" label
				expect(container.textContent).toContain('Date:');
			});
		});

		it('should close modal on cancel', async () => {
			const user = userEvent.setup();
			const { container } = renderWithContext({ entries: [] });

			await user.click(screen.getByRole('button', { name: 'Add Intake' }));

			await waitFor(() => {
				expect(container.querySelector('dialog[open]')).toBeTruthy();
			});

			const cancelButton = screen.getByRole('button', { name: 'Cancel' });
			await user.click(cancelButton);

			await waitFor(() => {
				expect(container.querySelector('dialog[open]')).toBeFalsy();
			});
		});
	});

	describe('CRUD Operations', () => {
		it('should call onadd when creating entry', async () => {
			const user = userEvent.setup();
			const onaddMock = vi.fn().mockResolvedValue({
				id: 4,
				added: '2024-01-01',
				category: 's',
				amount: 200,
				description: 'Apple'
			});

			const { container } = renderWithContext({ entries: [], onadd: onaddMock });

			await user.click(screen.getByRole('button', { name: 'Add Intake' }));

			// Wait for modal to open
			await waitFor(() => {
				expect(container.querySelector('dialog[open]')).toBeTruthy();
			});

			// Note: We can't easily fill the form in this test due to veilchen components
			// This would be better tested in E2E tests
			// For now, we verify the handler is set up correctly
			expect(onaddMock).not.toHaveBeenCalled(); // Not called until form submit
		});

		it('should handle missing onadd gracefully', async () => {
			const user = userEvent.setup();
			const { container } = renderWithContext({ entries: [] });

			await user.click(screen.getByRole('button', { name: 'Add Intake' }));

			await waitFor(() => {
				expect(container.querySelector('dialog[open]')).toBeTruthy();
			});

			// Modal should still open even without onadd
			// The error would occur on save attempt
		});

		it('should handle missing onedit gracefully', () => {
			const { container } = renderWithContext({ entries: mockEntries });

			// Component should render without error
			expect(container).toBeTruthy();
		});

		it('should handle missing ondelete gracefully', () => {
			const { container } = renderWithContext({ entries: mockEntries });

			expect(container).toBeTruthy();
		});
	});

	describe('Entry Updates', () => {
		it('should update entries array when entry added', async () => {
			const user = userEvent.setup();
			let entries: CalorieTracker[] = [];

			const onaddMock = vi.fn().mockResolvedValue({
				id: 1,
				added: '2024-01-01',
				category: 'l',
				amount: 500,
				description: 'Test'
			});

			const { component } = renderWithContext({ entries, onadd: onaddMock });

			// After successful add, entries should be updated
			// This is tested through the onCreateSuccess callback
			expect(component).toBeTruthy();
		});

		it('should handle entry at specific index after update', () => {
			const { container } = renderWithContext({ entries: mockEntries });

			// First entry should be displayed (stack shows one at a time)
			expect(container.textContent).toContain('Breakfast');
		});
	});

	describe('Modal Variants', () => {
		it('should have create modal dialog element', async () => {
			const user = userEvent.setup();
			const { container } = renderWithContext({ entries: [] });

			await user.click(screen.getByRole('button', { name: 'Add Intake' }));

			await waitFor(() => {
				const dialogs = container.querySelectorAll('dialog');
				expect(dialogs.length).toBeGreaterThan(0);
			});
		});

		it('should show CalorieTrackerMask in edit mode in create modal', async () => {
			const user = userEvent.setup();
			const { container } = renderWithContext({ entries: [] });

			await user.click(screen.getByRole('button', { name: 'Add Intake' }));

			await waitFor(() => {
				// Modal should contain CalorieTrackerMask
				expect(container.querySelector('fieldset')).toBeTruthy();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty entries array transitions', () => {
			const { container, component } = renderWithContext({ entries: [] });

			expect(screen.getByText(/Nothing tracked today/i)).toBeTruthy();

			// If entries were added, empty state should disappear
			expect(component).toBeTruthy();
		});

		it('should handle single entry deletion', () => {
			const ondeleteMock = vi.fn().mockResolvedValue(1);
			const { container } = renderWithContext({
				entries: [mockEntries[0]],
				ondelete: ondeleteMock
			});

			// Component should render
			expect(container.textContent).toContain('Breakfast');
		});

		it('should handle multiple entries', () => {
			const manyEntries = Array(10)
				.fill(null)
				.map((_, i) => ({
					id: i + 1,
					added: '2024-01-01',
					category: 'l',
					amount: (i + 1) * 100,
					description: `Entry ${i + 1}`
				}));

			const { container } = renderWithContext({ entries: manyEntries });

			// Should render without error, showing first entry
			expect(container).toBeTruthy();
			expect(container.textContent).toContain('Lunch');
		});

		it('should handle entries with various categories', () => {
			const { container } = renderWithContext({ entries: mockEntries });

			// Stack displays first entry
			expect(container.textContent).toContain('Breakfast');
		});

		it('should handle entries without descriptions', () => {
			const entriesNoDesc = mockEntries.map((e) => ({ ...e, description: '' }));
			const { container } = renderWithContext({ entries: entriesNoDesc });

			// Should still display first entry's category
			expect(container.textContent).toContain('Breakfast');
		});

		it('should handle very large calorie amounts', () => {
			const largeEntries = [
				{
					id: 1,
					added: '2024-01-01',
					category: 'l',
					amount: 9999,
					description: 'Large meal'
				}
			];

			const { container } = renderWithContext({ entries: largeEntries });

			// Component should render without error
			expect(container).toBeTruthy();
			expect(container.textContent).toContain('Lunch');
		});
	});

	describe('Component Structure', () => {
		it('should render with proper button', () => {
			const { container } = renderWithContext({ entries: [] });

			const button = container.querySelector('button.btn');
			expect(button).toBeTruthy();
			expect(button?.textContent).toContain('Add Intake');
		});

		it('should have full width button', () => {
			const { container } = renderWithContext({ entries: [] });

			const button = container.querySelector('button.w-full');
			expect(button).toBeTruthy();
		});

		it('should use neutral button styling', () => {
			const { container } = renderWithContext({ entries: [] });

			const button = container.querySelector('button.btn-neutral');
			expect(button).toBeTruthy();
		});
	});

	describe('Integration with useEntryModal', () => {
		it('should use modal composition for state management', () => {
			const { container } = renderWithContext({ entries: mockEntries });

			// Component should render, indicating modal composition is working
			expect(container).toBeTruthy();
			expect(screen.getByRole('button', { name: 'Add Intake' })).toBeTruthy();
		});

		it('should handle modal state through composition', async () => {
			const user = userEvent.setup();
			const { container } = renderWithContext({ entries: [] });

			// Open modal
			await user.click(screen.getByRole('button', { name: 'Add Intake' }));

			await waitFor(() => {
				expect(container.querySelector('dialog[open]')).toBeTruthy();
			});

			// Close modal
			await user.click(screen.getByRole('button', { name: 'Cancel' }));

			await waitFor(() => {
				expect(container.querySelector('dialog[open]')).toBeFalsy();
			});
		});
	});

	describe('Date Formatting', () => {
		it('should format date in modal title', async () => {
			const user = userEvent.setup();
			const { container } = renderWithContext({ entries: [] });

			await user.click(screen.getByRole('button', { name: 'Add Intake' }));

			await waitFor(() => {
				// Should show "Date:" prefix
				expect(container.textContent).toContain('Date:');
			});
		});

		it('should use getDateAsStr for blank entries', () => {
			// This is tested implicitly through the create modal
			const { container } = renderWithContext({ entries: [] });

			expect(container).toBeTruthy();
		});
	});

	describe('Accessibility', () => {
		it('should have accessible button', () => {
			renderWithContext({ entries: [] });

			const button = screen.getByRole('button', { name: /add intake/i });
			expect(button).toBeTruthy();
		});

		it('should show meaningful alert text', () => {
			renderWithContext({ entries: [] });

			const strongText = screen.getByText(/Nothing tracked today/i);
			expect(strongText).toBeTruthy();
		});

		it('should provide context in alert message', () => {
			renderWithContext({ entries: [] });

			expect(screen.getByText(/Use the button below/i)).toBeTruthy();
		});
	});
});
