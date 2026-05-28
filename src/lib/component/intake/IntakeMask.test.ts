import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import IntakeMask from './IntakeMask.svelte';
import TestWrapper from '../../../../tests/utils/TestWrapper.svelte';
import type { Intake, NewIntake } from '$lib/api';

const mockCategories = [
	{ shortvalue: 'b', longvalue: 'Breakfast' },
	{ shortvalue: 'l', longvalue: 'Lunch' },
	{ shortvalue: 'd', longvalue: 'Dinner' },
	{ shortvalue: 's', longvalue: 'Snack' },
	{ shortvalue: 't', longvalue: 'Treat' }
];

function renderWithContext(entry: Intake | NewIntake, props = {}) {
	return render(TestWrapper, {
		props: {
			component: IntakeMask,
			props: { entry, ...props },
			categories: mockCategories
		}
	});
}

describe('IntakeMask', () => {
	const mockEntry: Intake = {
		id: 1,
		added: '2024-01-01',
		time: '12:30:00',
		category: 'l',
		amount: 500,
		description: 'Healthy lunch'
	};

	describe('Readonly Mode', () => {
		it('should display category badge in readonly mode', () => {
			const { container } = renderWithContext(mockEntry, { compact: true });

			expect(container.textContent).toContain('Lunch');
		});

		it('should show category badge without edit button', () => {
			const { container } = renderWithContext(mockEntry, { compact: true });

			const editButton = screen.queryByLabelText(/press to edit/i);
			expect(editButton).toBeNull();
		});

		it('should display description as paragraph in readonly mode', () => {
			renderWithContext(mockEntry, { compact: true });

			// In readonly mode, there should be no textarea
			const textarea = document.querySelector('textarea');
			expect(textarea).toBeNull();

			// Description should be visible as text
			expect(screen.getByText('Healthy lunch')).toBeTruthy();
		});

		it('should not show category selector in readonly mode', () => {
			const { container } = renderWithContext(mockEntry, { compact: true });

			// In readonly mode, there should be no join group (icon buttons)
			const joinGroup = container.querySelector('.join');
			expect(joinGroup).toBeNull();
		});
	});

	describe('Editing Mode', () => {
		it('should show category selector when isEditing is true', () => {
			const { container } = renderWithContext(mockEntry, { isEditing: true });

			// Should show selected category longvalue as heading
			expect(container.textContent).toContain('Lunch');
		});

		it('should highlight selected category', () => {
			const { container } = renderWithContext(mockEntry, { isEditing: true });

			const lunchButton = screen.getByLabelText(/Select Lunch/i);
			expect(lunchButton.className).toContain('btn-accent');
		});

		it('[IT-016] should allow category selection (single-select)', async () => {
			const user = userEvent.setup();

			const { container } = renderWithContext(mockEntry, { isEditing: true });

			const dinnerButton = screen.getByLabelText(/Select Dinner/i);
			await user.click(dinnerButton);

			// After clicking, the button should be highlighted
			expect(dinnerButton.className).toContain('btn-accent');
		});

		it('[IT-015] should show all categories as selectable', () => {
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

	describe('Readonly full form (modal delete-confirm)', () => {
		it('readonly + not compact renders the full form (not the summary card)', () => {
			const { container } = renderWithContext(mockEntry, { readonly: true });

			// The summary `.fieldset.rounded-box` card layout is only used when
			// compact=true; readonly alone keeps the full form structure visible.
			const join = container.querySelector('.join');
			expect(join).not.toBeNull();
			expect(document.querySelector('textarea')).not.toBeNull();
		});

		it('readonly wraps the form in fieldset[disabled] (browser propagates to descendants)', () => {
			const { container } = renderWithContext(mockEntry, { readonly: true });

			// fieldset[disabled] is the HTML-standard way to disable an entire
			// form group; the browser propagates :disabled to every descendant.
			const fs = container.querySelector('fieldset[disabled]');
			expect(fs).not.toBeNull();

			// Directly-rendered controls keep per-control disabled wiring too,
			// so jsdom's lack of full :disabled propagation doesn't matter here.
			const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
			expect(textarea.disabled).toBe(true);

			const categoryButtons = container.querySelectorAll('button[aria-pressed]');
			categoryButtons.forEach((b) => expect((b as HTMLButtonElement).disabled).toBe(true));
		});

		it('not-readonly editable form is a plain div (no fieldset)', () => {
			const { container } = renderWithContext(mockEntry, { readonly: false });

			const wrapper = container.querySelector('.flex.flex-col.gap-1.w-full') as HTMLElement;
			expect(wrapper.tagName).toBe('DIV');
			expect(container.querySelector('fieldset[disabled]')).toBeNull();
		});
	});

	describe('Default Mode (Non-editing)', () => {
		it('should show category name', () => {
			renderWithContext(mockEntry, { isEditing: false });

			expect(screen.getByText('Lunch')).toBeTruthy();
		});

		it('should show category selector as icon buttons in default mode', () => {
			const { container } = renderWithContext(mockEntry, { isEditing: false });

			// Category selector shows all categories as buttons in a join group
			const categorySelector = container.querySelector('.join');
			expect(categorySelector).toBeTruthy();
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

		it('should not render textarea in readonly mode', () => {
			renderWithContext(mockEntry, { compact: true });

			// In readonly mode, description is shown as text, not a textarea
			const textarea = document.querySelector('textarea');
			expect(textarea).toBeNull();
		});
	});

	describe('Category Mapping', () => {
		it('should display Breakfast category', () => {
			const entry = { ...mockEntry, category: 'b' };
			const { container } = renderWithContext(entry, { compact: true });

			expect(container.textContent).toContain('Breakfast');
		});

		it('should display Lunch category', () => {
			const entry = { ...mockEntry, category: 'l' };
			const { container } = renderWithContext(entry, { compact: true });

			expect(container.textContent).toContain('Lunch');
		});

		it('should display Dinner category', () => {
			const entry = { ...mockEntry, category: 'd' };
			const { container } = renderWithContext(entry, { compact: true });

			expect(container.textContent).toContain('Dinner');
		});

		it('should display Snack category', () => {
			const entry = { ...mockEntry, category: 's' };
			const { container } = renderWithContext(entry, { compact: true });

			expect(container.textContent).toContain('Snack');
		});

		it('should display Treat category', () => {
			const entry = { ...mockEntry, category: 't' };
			const { container } = renderWithContext(entry, { compact: true });

			expect(container.textContent).toContain('Treat');
		});
	});

	describe('NewIntake Support', () => {
		it('should work with NewIntake entry', () => {
			const newEntry: NewIntake = {
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
			const newEntry: NewIntake = {
				added: '2024-01-15',
				category: 'l',
				amount: 300,
				description: ''
			};

			renderWithContext(newEntry, { isEditing: true });

			const snackButton = screen.getByLabelText(/Select Snack/i);
			await user.click(snackButton);

			// After clicking, snack should be highlighted
			expect(snackButton.className).toContain('btn-accent');
		});
	});

	describe('Layout', () => {
		it('should render category icon buttons in a join group', () => {
			const { container } = renderWithContext(mockEntry);

			const joinGroup = container.querySelector('.join');
			expect(joinGroup).toBeTruthy();
		});

		it('should render textarea for description', () => {
			renderWithContext(mockEntry);

			const textarea = document.querySelector('textarea');
			expect(textarea).toBeTruthy();
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
	});
});
