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
	it('[MOD-001] edit mode opens with entry data pre-filled', async () => {
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

	it('[VAL-013] [VAL-014] Save click with an invalid amount does NOT invoke onsave and reveals the schema message', async () => {
		const user = userEvent.setup();
		const onsave = vi.fn();

		// amount=0 is below the NewIntake bound (must be 1-10,000).
		const props = $state({
			entry: makeNewIntake({ amount: 0 }) as Intake | NewIntake | null | undefined,
			mode: 'create' as const,
			onsave,
			oncancel: vi.fn()
		});
		const { container } = renderModal(props);
		openDialog(container);

		await user.click(screen.getByRole('button', { name: /^Save$/ }));

		expect(onsave).not.toHaveBeenCalled();

		const { NewIntakeSchema } = await import('$lib/api/gen/types');
		const expected = NewIntakeSchema.safeParse({ ...makeNewIntake({ amount: 0 }) });
		expect(expected.success).toBe(false);
		const schemaMessage = expected.success ? '' : expected.error.issues[0].message;

		expect(container.querySelector('.alert-error')?.textContent).toContain(schemaMessage);
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

	it('trash toggles delete-confirm: a second click fires oncanceldelete and returns to edit', async () => {
		const user = userEvent.setup();
		const oncanceldelete = vi.fn();

		const props = $state({
			entry: makeIntake() as Intake | NewIntake | null | undefined,
			mode: 'edit' as const,
			enableDelete: true, // already in delete-confirm view
			onsave: vi.fn(),
			oncancel: vi.fn(),
			onrequestdelete: vi.fn(),
			oncanceldelete,
			ondelete: vi.fn()
		});
		const { container } = renderModal(props);
		openDialog(container);

		// Title reflects the view, not the mode.
		expect(container.textContent).toContain('Delete Intake');

		// Trash button stays in the title bar so the user can back out.
		const trash = screen.getByLabelText(/Delete intake/i);
		expect(trash.getAttribute('aria-pressed')).toBe('true');

		await user.click(trash);
		expect(oncanceldelete).toHaveBeenCalledTimes(1);
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

	it('[VAL-012] saving a valid entry does NOT flash the AlertBox during the modal-close transition', async () => {
		// Regression: useEntryModal nulls `currentEntry` after a successful
		// save. The $effect on source then ran validate(undefined) → invalid,
		// which flashed the AlertBox for one frame before the dialog closed.
		// useFieldValidity now treats null/undefined source as "nothing to
		// validate" — the visible alert state stays clean across the
		// defined → undefined transition.
		const user = userEvent.setup();
		const props = $state({
			entry: makeNewIntake({ amount: 500 }) as Intake | NewIntake | null | undefined,
			mode: 'create' as const,
			onsave: vi.fn(),
			oncancel: vi.fn()
		});
		const { container } = renderModal(props);
		openDialog(container);

		// Click Save with a valid entry. attempt() flips hasAttempted=true.
		await user.click(screen.getByRole('button', { name: /^Save$/ }));

		// Route's useEntryModal would now null the entry on successful save.
		props.entry = undefined;
		await new Promise((r) => setTimeout(r, 0));

		// No alert should be visible while entry is null (modal closing).
		expect(container.querySelector('.alert-error')).toBeNull();
	});

	it('[VAL-012] reopening the modal with a fresh invalid entry does NOT surface a sticky alert from the previous session', async () => {
		// Reproduces the regression observed in smoke testing: user adds an
		// intake (Save with valid value → flips hasAttempted=true → modal
		// closes), reopens via Add Intake, and the AlertBox flashed up with
		// the "amount must be between 1 and 10,000" message before the user
		// touched anything. Fix: IntakeModal calls validity.reset() on the
		// entry absent→present transition.
		const props = $state({
			entry: undefined as Intake | NewIntake | null | undefined,
			mode: 'create' as const,
			onsave: vi.fn(),
			oncancel: vi.fn()
		});
		const { container } = renderModal(props);

		// First open with an invalid blank entry.
		props.entry = makeNewIntake({ amount: 0 });
		openDialog(container);

		// User clicks Save → attempt() flips hasAttempted=true; save is gated.
		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: /^Save$/ }));
		expect(container.querySelector('.alert-error')).not.toBeNull();

		// User fixes the value and successfully saves (simulated by the
		// route's useEntryModal: currentEntry → undefined after save).
		props.entry = undefined;
		await new Promise((r) => setTimeout(r, 0));

		// Modal reopens with a fresh blank entry (amount=0 again — invalid).
		props.entry = makeNewIntake({ amount: 0 });
		await new Promise((r) => setTimeout(r, 0));
		openDialog(container);

		// AlertBox should NOT be visible — the user hasn't attempted in this
		// new session yet.
		expect(container.querySelector('.alert-error')).toBeNull();
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
