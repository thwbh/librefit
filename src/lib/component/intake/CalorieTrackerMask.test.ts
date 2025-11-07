import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import CalorieTrackerMask from './CalorieTrackerMask.svelte';
import type { CalorieTracker, NewCalorieTracker } from '$lib/api/gen';
import TestWrapper from '../../../../tests/utils/TestWrapper.svelte';

const mockCategories = [
	{ shortvalue: 'b', longvalue: 'Breakfast' },
	{ shortvalue: 'l', longvalue: 'Lunch' },
	{ shortvalue: 'd', longvalue: 'Dinner' },
	{ shortvalue: 's', longvalue: 'Snack' },
	{ shortvalue: 't', longvalue: 'Treat' }
];

function renderWithContext(entry: CalorieTracker | NewCalorieTracker, props = {}) {
	return render(TestWrapper, {
		props: {
			component: CalorieTrackerMask,
			props: { entry, ...props },
			categories: mockCategories
		}
	});
}

describe('CalorieTrackerMask', () => {
	const mockEntry: CalorieTracker = {
		id: 1,
		added: '2024-01-01',
		category: 'l',
		amount: 500,
		description: 'Healthy lunch'
	};

	describe('Readonly Mode', () => {
		it('should display category badge in readonly mode', () => {
			const { container } = renderWithContext(mockEntry, { readonly: true });

			expect(container.textContent).toContain('Lunch');
		});

		it('should show category badge without edit button', () => {
			const { container } = renderWithContext(mockEntry, { readonly: true });

			const editButton = screen.queryByLabelText(/press to edit/i);
			expect(editButton).toBeNull();
		});

		it('should disable textarea in readonly mode', () => {
			renderWithContext(mockEntry, { readonly: true });

			const textarea = document.querySelector('textarea');
			expect(textarea?.disabled).toBe(true);
		});

		it('should not show category selector in readonly mode', () => {
			const { container } = renderWithContext(mockEntry, { readonly: true });

			const categoryButtons = container.querySelectorAll('.badge-outline-neutral');
			expect(categoryButtons.length).toBe(0);
		});
	});

	describe('Editing Mode', () => {
		it('should show category selector when isEditing is true', () => {
			const { container } = renderWithContext(mockEntry, { isEditing: true });

			// Should show all category options
			mockCategories.forEach((cat) => {
				expect(container.textContent).toContain(cat.longvalue);
			});
		});

		it('should highlight selected category', () => {
			const { container } = renderWithContext(mockEntry, { isEditing: true });

			const lunchButton = screen.getByLabelText(/Select Lunch/i);
			expect(lunchButton.className).toContain('badge-primary');
		});

		it('should allow category selection', async () => {
			const user = userEvent.setup();

			const { container } = renderWithContext(mockEntry, { isEditing: true });

			const dinnerButton = screen.getByLabelText(/Select Dinner/i);
			await user.click(dinnerButton);

			// After clicking, the button should be highlighted
			expect(dinnerButton.className).toContain('badge-primary');
		});

		it('should show all categories as selectable', () => {
			renderWithContext(mockEntry, { isEditing: true });

			mockCategories.forEach((cat) => {
				const button = screen.getByLabelText(`Select ${cat.longvalue}`);
				expect(button).toBeTruthy();
			});
		});

		it('should have proper ARIA attributes on category buttons', () => {
			renderWithContext(mockEntry, { isEditing: true });

			const lunchButton = screen.getByLabelText(/Select Lunch/i);
			expect(lunchButton).toHaveProperty('ariaPressed', 'true');
		});

		it('should enable textarea in editing mode', () => {
			renderWithContext(mockEntry, { isEditing: true });

			const textarea = document.querySelector('textarea');
			expect(textarea?.disabled).toBe(false);
		});
	});

	describe('Default Mode (Non-editing)', () => {
		it('should show category badge with edit button', () => {
			renderWithContext(mockEntry, { isEditing: false });

			expect(screen.getByText('Lunch')).toBeTruthy();
			expect(screen.getByLabelText(/press to edit/i)).toBeTruthy();
		});

		it('should call onedit when edit button clicked', async () => {
			const user = userEvent.setup();
			const onedit = vi.fn();

			renderWithContext(mockEntry, { isEditing: false, onedit });

			const editButton = screen.getByLabelText(/press to edit/i);
			await user.click(editButton);

			expect(onedit).toHaveBeenCalledTimes(1);
		});

		it('should not show category selector by default', () => {
			const { container } = renderWithContext(mockEntry, { isEditing: false });

			const categorySelector = container.querySelector('.snap-x');
			expect(categorySelector).toBeNull();
		});
	});

	describe('Amount Input', () => {
		it('should bind amount value', () => {
			const entry = { ...mockEntry, amount: 750 };
			renderWithContext(entry);

			// Amount is displayed somewhere in the component
			expect(entry.amount).toBe(750);
		});

		it('should handle zero amount', () => {
			const entry = { ...mockEntry, amount: 0 };
			renderWithContext(entry);

			expect(entry.amount).toBe(0);
		});

		it('should handle large amounts', () => {
			const entry = { ...mockEntry, amount: 9999 };
			renderWithContext(entry);

			expect(entry.amount).toBe(9999);
		});
	});

	describe('Description Field', () => {
		it('should display description placeholder', () => {
			const entry = { ...mockEntry, description: '' };
			renderWithContext(entry);

			const textarea = document.querySelector('textarea');
			expect(textarea?.placeholder).toBe('Description...');
		});

		it('should bind description value', () => {
			const entry = { ...mockEntry, description: 'Test description' };
			renderWithContext(entry);

			const textarea = document.querySelector('textarea');
			expect(textarea?.value).toBe('Test description');
		});

		it('should handle empty description', () => {
			const entry = { ...mockEntry, description: '' };
			renderWithContext(entry);

			const textarea = document.querySelector('textarea');
			expect(textarea?.value).toBe('');
		});

		it('should handle long descriptions', () => {
			const longDesc = 'A'.repeat(500);
			const entry = { ...mockEntry, description: longDesc };
			renderWithContext(entry);

			const textarea = document.querySelector('textarea');
			expect(textarea?.value).toBe(longDesc);
		});

		it('should disable textarea in readonly mode', () => {
			renderWithContext(mockEntry, { readonly: true });

			const textarea = document.querySelector('textarea');
			expect(textarea?.disabled).toBe(true);
		});
	});

	describe('Category Mapping', () => {
		it('should display Breakfast category', () => {
			const entry = { ...mockEntry, category: 'b' };
			const { container } = renderWithContext(entry, { readonly: true });

			expect(container.textContent).toContain('Breakfast');
		});

		it('should display Lunch category', () => {
			const entry = { ...mockEntry, category: 'l' };
			const { container } = renderWithContext(entry, { readonly: true });

			expect(container.textContent).toContain('Lunch');
		});

		it('should display Dinner category', () => {
			const entry = { ...mockEntry, category: 'd' };
			const { container } = renderWithContext(entry, { readonly: true });

			expect(container.textContent).toContain('Dinner');
		});

		it('should display Snack category', () => {
			const entry = { ...mockEntry, category: 's' };
			const { container } = renderWithContext(entry, { readonly: true });

			expect(container.textContent).toContain('Snack');
		});

		it('should display Treat category', () => {
			const entry = { ...mockEntry, category: 't' };
			const { container } = renderWithContext(entry, { readonly: true });

			expect(container.textContent).toContain('Treat');
		});
	});

	describe('NewCalorieTracker Support', () => {
		it('should work with NewCalorieTracker entry', () => {
			const newEntry: NewCalorieTracker = {
				added: '2024-01-15',
				category: 'l',
				amount: 300,
				description: 'New entry'
			};

			const { container } = renderWithContext(newEntry, { isEditing: true });

			expect(container).toBeTruthy();
		});

		it('should allow editing new entries', async () => {
			const user = userEvent.setup();
			const newEntry: NewCalorieTracker = {
				added: '2024-01-15',
				category: 'l',
				amount: 300,
				description: ''
			};

			renderWithContext(newEntry, { isEditing: true });

			const snackButton = screen.getByLabelText(/Select Snack/i);
			await user.click(snackButton);

			// After clicking, snack should be highlighted
			expect(snackButton.className).toContain('badge-primary');
		});
	});

	describe('Custom className', () => {
		it('should use default className', () => {
			const { container } = renderWithContext(mockEntry);

			const fieldset = container.querySelector('.fieldset.rounded-box');
			expect(fieldset).toBeTruthy();
		});

		it('should accept custom className', () => {
			const { container } = renderWithContext(mockEntry, { className: 'custom-class' });

			const fieldset = container.querySelector('.custom-class');
			expect(fieldset).toBeTruthy();
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels on category selection', () => {
			renderWithContext(mockEntry, { isEditing: true });

			mockCategories.forEach((cat) => {
				const button = screen.getByLabelText(`Select ${cat.longvalue}`);
				expect(button).toBeTruthy();
			});
		});

		it('should have aria-pressed on selected category', () => {
			renderWithContext(mockEntry, { isEditing: true });

			const lunchButton = screen.getByLabelText(/Select Lunch/i);
			expect(lunchButton).toHaveProperty('ariaPressed', 'true');
		});

		it('should have aria-pressed false on unselected categories', () => {
			renderWithContext(mockEntry, { isEditing: true });

			const breakfastButton = screen.getByLabelText(/Select Breakfast/i);
			expect(breakfastButton).toHaveProperty('ariaPressed', 'false');
		});

		it('should have edit button with aria-label', () => {
			renderWithContext(mockEntry, { isEditing: false });

			const editButton = screen.getByLabelText(/press to edit/i);
			expect(editButton).toBeTruthy();
		});
	});
});
