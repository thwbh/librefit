import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Intake, NewIntake } from '$lib/api';
import IntakeModal from './IntakeModal.svelte';
import TestWrapper from '../../../../tests/utils/TestWrapper.svelte';

const mockCategories = [
	{ shortvalue: 'b', longvalue: 'Breakfast' },
	{ shortvalue: 'l', longvalue: 'Lunch' },
	{ shortvalue: 'd', longvalue: 'Dinner' },
	{ shortvalue: 's', longvalue: 'Snack' },
	{ shortvalue: 't', longvalue: 'Treat' }
];

function makeIntake(overrides: Partial<Intake> = {}): Intake {
	return {
		id: 1,
		added: '2024-01-01',
		time: '12:30:00',
		category: 'l',
		amount: 500,
		description: 'Healthy lunch',
		...overrides
	};
}

function makeNewIntake(overrides: Partial<NewIntake> = {}): NewIntake {
	return {
		added: '2024-01-01',
		category: 'l',
		amount: 0,
		description: '',
		...overrides
	};
}

function renderModal(props: Record<string, unknown>) {
	return render(TestWrapper, {
		props: {
			component: IntakeModal,
			props,
			categories: mockCategories
		}
	});
}

function openDialog(container: HTMLElement) {
	container.querySelector('dialog')?.showModal();
}

describe('IntakeModal', () => {
	it('[MOD-001] edit mode opens with entry data pre-filled', () => {
		const entry = makeIntake({ description: 'Existing meal' });
		const { container } = renderModal({
			entry,
			mode: 'edit',
			onsave: vi.fn(),
			oncancel: vi.fn()
		});
		openDialog(container);

		// Category (Lunch) appears as heading text + selected button.
		expect(container.textContent).toContain('Lunch');

		// Description prefills into the textarea.
		const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
		expect(textarea.value).toBe('Existing meal');
	});

	it('[MOD-001] errorMessage prop renders as an alert inside the modal', () => {
		const { container } = renderModal({
			entry: makeIntake(),
			mode: 'edit',
			errorMessage: 'Save failed',
			onsave: vi.fn(),
			oncancel: vi.fn()
		});
		openDialog(container);

		expect(screen.getByText('Save failed')).toBeTruthy();
	});

	it('[IT-010] [MOD-004] cancel in create mode fires oncancel and not onsave', async () => {
		const user = userEvent.setup();
		const onsave = vi.fn();
		const oncancel = vi.fn();
		const { container } = renderModal({
			entry: makeNewIntake(),
			mode: 'create',
			onsave,
			oncancel
		});
		openDialog(container);

		await user.click(screen.getByRole('button', { name: /^Cancel$/ }));

		expect(oncancel).toHaveBeenCalledTimes(1);
		expect(onsave).not.toHaveBeenCalled();
	});

	it('[IT-012] edit + save propagates mutated entry to parent via bind:entry', async () => {
		const user = userEvent.setup();
		const onsave = vi.fn();

		// $state-wrap props so bind:entry round-trips mutations from IntakeMask.
		const props = $state({
			entry: makeIntake({ description: 'before' }) as Intake | NewIntake | null | undefined,
			mode: 'edit' as const,
			onsave,
			oncancel: vi.fn()
		});
		const { container } = renderModal(props);
		openDialog(container);

		// Pick a new category — exercises bind:entry through IntakeMask's select().
		await user.click(screen.getByLabelText(/Select Dinner/i));

		await user.click(screen.getByRole('button', { name: /^Save$/ }));

		expect(onsave).toHaveBeenCalledTimes(1);
		expect((props.entry as Intake).category).toBe('d');
	});

	it('[IT-013] [MOD-002] trash → enableDelete flips footer; Delete button fires ondelete', async () => {
		const user = userEvent.setup();
		const ondelete = vi.fn();

		// Reactive props so the parent's `enableDelete` flip is observable in the modal.
		const props = $state({
			entry: makeIntake() as Intake | NewIntake | null | undefined,
			mode: 'edit' as const,
			enableDelete: false,
			onsave: vi.fn(),
			oncancel: vi.fn(),
			onrequestdelete: () => {
				props.enableDelete = true;
			},
			ondelete
		});
		const { container } = renderModal(props);
		openDialog(container);

		expect(screen.queryByRole('button', { name: /^Save$/ })).not.toBeNull();
		expect(screen.queryByRole('button', { name: /^Delete$/ })).toBeNull();

		await user.click(screen.getByLabelText(/Delete intake/i));

		// Footer flips: Save gone, Delete shown.
		expect(screen.queryByRole('button', { name: /^Save$/ })).toBeNull();
		const deleteBtn = screen.getByRole('button', { name: /^Delete$/ });

		await user.click(deleteBtn);
		expect(ondelete).toHaveBeenCalledTimes(1);
	});

	it('[IT-014] [MOD-003] cancel during delete-confirm fires oncancel', async () => {
		const user = userEvent.setup();
		const oncancel = vi.fn();
		const ondelete = vi.fn();

		const { container } = renderModal({
			entry: makeIntake(),
			mode: 'edit',
			enableDelete: true,
			onsave: vi.fn(),
			oncancel,
			onrequestdelete: vi.fn(),
			ondelete
		});
		openDialog(container);

		await user.click(screen.getByRole('button', { name: /^Cancel$/ }));

		expect(oncancel).toHaveBeenCalledTimes(1);
		expect(ondelete).not.toHaveBeenCalled();
	});

	it('create mode does not render the trash/delete affordance', () => {
		const { container } = renderModal({
			entry: makeNewIntake(),
			mode: 'create',
			onsave: vi.fn(),
			oncancel: vi.fn()
		});
		openDialog(container);

		// MOD spec: delete option is only available from edit mode, not create.
		expect(screen.queryByLabelText(/Delete intake/i)).toBeNull();
	});
});
