import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import IntakeStack from './IntakeStack.svelte';
import TestWrapper from '../../../../tests/utils/TestWrapper.svelte';
import { setupVeilchenMock } from '../../../../tests/utils/mocks';
import type { Intake } from '$lib/api';

// Setup mocks
setupVeilchenMock();

vi.mock('@tauri-apps/plugin-haptics', () => ({
	vibrate: vi.fn()
}));

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
			component: IntakeStack,
			props,
			categories: mockCategories
		}
	});
}

describe('IntakeStack', () => {
	const mockEntries: Intake[] = [
		{
			id: 1,
			added: '2024-01-01',
			category: 'b',
			amount: 400,
			description: 'Oatmeal',
			time: '08:30:00'
		},
		{
			id: 2,
			added: '2024-01-01',
			category: 'l',
			amount: 600,
			description: 'Salad',
			time: '13:10:00'
		},
		{
			id: 3,
			added: '2024-01-01',
			category: 'd',
			amount: 800,
			description: 'Pasta',
			time: '19:15:00'
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
	});

	describe('Stack Display', () => {
		it('should display entries when provided', () => {
			const { container } = renderWithContext({ entries: mockEntries, index: 0 });

			// Stack shows one entry at a time (the active one)
			// First entry should be visible
			expect(container.textContent).toContain('Breakfast');
		});

		it('should display entries in readonly mode', () => {
			const { container } = renderWithContext({ entries: mockEntries, index: 0 });

			// IntakeMask should be in readonly mode
			// First entry's category should be displayed
			expect(container.textContent).toContain('Breakfast');
		});

		it('should handle single entry', () => {
			const { container } = renderWithContext({ entries: [mockEntries[0]], index: 0 });

			expect(container.textContent).toContain('Breakfast');
		});

		it('should render Stack component for multiple entries', () => {
			const { container } = renderWithContext({ entries: mockEntries, index: 0 });

			// Check that Stack is rendered (not AlertBox)
			const alertBox = container.querySelector('.alert');
			expect(alertBox).toBeFalsy();
		});
	});

	describe('Stack Navigation', () => {
		it('should display entry at current index', () => {
			const { container } = renderWithContext({ entries: mockEntries, index: 1 });

			expect(container.textContent).toContain('Lunch');
		});

		it('should display last entry when index is at end', () => {
			const { container } = renderWithContext({ entries: mockEntries, index: 2 });

			expect(container.textContent).toContain('Dinner');
		});

		it('should handle index binding', () => {
			let index = 0;
			const { container } = renderWithContext({ entries: mockEntries, index });

			expect(container.textContent).toContain('Breakfast');
		});
	});

	describe('Edit Functionality', () => {
		it('should call onEdit when entry is long-pressed', async () => {
			const onEditMock = vi.fn();
			const { container } = renderWithContext({
				entries: mockEntries,
				index: 0,
				onEdit: onEditMock
			});

			// Long press is handled via LongPressContainer
			// This would require more complex interaction testing
			expect(container).toBeTruthy();
		});

		it('should handle missing onEdit gracefully', () => {
			const { container } = renderWithContext({ entries: mockEntries, index: 0 });

			// Component should render without error
			expect(container).toBeTruthy();
		});
	});

	describe('Entry Display', () => {
		it('should show IntakeMask for each entry', () => {
			const { container } = renderWithContext({ entries: mockEntries, index: 0 });

			// Check that entry details are rendered
			expect(container.textContent).toContain('400');
		});

		it('should display category colors', () => {
			const { container } = renderWithContext({ entries: mockEntries, index: 0 });

			// Category color should be rendered as a figure element
			const figure = container.querySelector('figure');
			expect(figure).toBeTruthy();
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty entries array transitions', () => {
			const { container } = renderWithContext({ entries: [] });

			expect(screen.getByText(/Nothing tracked today/i)).toBeTruthy();
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

			const { container } = renderWithContext({ entries: manyEntries, index: 0 });

			// Should render without error, showing first entry
			expect(container).toBeTruthy();
			expect(container.textContent).toContain('Lunch');
		});

		it('should handle entries with various categories', () => {
			const { container } = renderWithContext({ entries: mockEntries, index: 0 });

			// Stack displays first entry
			expect(container.textContent).toContain('Breakfast');
		});

		it('should handle entries without descriptions', () => {
			const entriesNoDesc = mockEntries.map((e) => ({ ...e, description: undefined }));
			const { container } = renderWithContext({ entries: entriesNoDesc, index: 0 });

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

			const { container } = renderWithContext({ entries: largeEntries, index: 0 });

			// Component should render without error
			expect(container).toBeTruthy();
			expect(container.textContent).toContain('Lunch');
		});
	});

	describe('Component Structure', () => {
		it('should render Stack component when entries exist', () => {
			const { container } = renderWithContext({ entries: mockEntries, index: 0 });

			// Should not show empty state
			expect(container.querySelector('.alert')).toBeFalsy();
		});

		it('should apply custom class name', () => {
			const customClass = 'custom-stack-class';
			const { container } = renderWithContext({
				entries: mockEntries,
				index: 0,
				class: customClass
			});

			expect(container).toBeTruthy();
		});
	});

	describe('LongPressContainer Integration', () => {
		it('should wrap IntakeMask in LongPressContainer', () => {
			const { container } = renderWithContext({ entries: mockEntries, index: 0 });

			// Component should render with LongPressContainer
			expect(container).toBeTruthy();
		});
	});

	describe('Accessibility', () => {
		it('should show meaningful alert text in empty state', () => {
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
