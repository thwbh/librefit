import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { NewWeightTracker } from '$lib/api';
import WeightModal from './WeightModal.svelte';

function makeEntry(overrides: Partial<NewWeightTracker> = {}): NewWeightTracker {
	return { added: '2026-05-27', amount: 70, ...overrides } as NewWeightTracker;
}

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		entry: makeEntry(),
		errorMessage: undefined,
		min: 30,
		max: 330,
		onsave: vi.fn(),
		oncancel: vi.fn(),
		...overrides
	};
}

function openDialog(container: HTMLElement) {
	container.querySelector('dialog')?.showModal();
}

function queryMessage(container: HTMLElement) {
	return container.querySelector('.alert');
}

function queryWtMessage(container: HTMLElement) {
	const alert = container.querySelector('.alert');
	return alert?.textContent?.match(/Weight must be between/) ? alert : null;
}

describe('WeightModal', () => {
	it('[WT-009] typed sub-min value is preserved (no silent clamp)', async () => {
		const props = $state(baseProps());
		const { container } = render(WeightModal, { props });
		openDialog(container);

		const input = container.querySelector('input[type="number"]') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: '25' } });

		expect(props.entry!.amount).toBe(25);
	});

	it('[WT-009] typed over-max value is preserved (no silent clamp)', async () => {
		const props = $state(baseProps());
		const { container } = render(WeightModal, { props });
		openDialog(container);

		const input = container.querySelector('input[type="number"]') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: '500' } });

		expect(props.entry!.amount).toBe(500);
	});

	it('[VAL-012] modal open with an invalid initial value does not surface the validation message', () => {
		// amount=0 is below min=30, but the message must be deferred until the
		// user actually attempts to submit.
		const { container } = render(WeightModal, {
			props: baseProps({ entry: makeEntry({ amount: 0 }) })
		});
		openDialog(container);

		expect(queryWtMessage(container)).toBeNull();
	});

	it('[VAL-012] typing an invalid value before attempting submit does NOT yet surface the message', async () => {
		const props = $state(baseProps({ entry: makeEntry({ amount: 70 }) }));
		const { container } = render(WeightModal, { props });
		openDialog(container);

		const input = container.querySelector('input[type="number"]') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: '25' } });

		expect(queryWtMessage(container)).toBeNull();
	});

	it('[VAL-013] clicking Save while invalid does NOT invoke onsave and reveals the message', async () => {
		const onsave = vi.fn();
		const user = userEvent.setup();
		const props = $state(baseProps({ entry: makeEntry({ amount: 25 }), onsave }));
		const { container } = render(WeightModal, { props });
		openDialog(container);

		await user.click(screen.getByRole('button', { name: /^Save$/ }));

		expect(onsave).not.toHaveBeenCalled();
		expect(queryWtMessage(container)).not.toBeNull();
	});

	it('[VAL-012] after first attempt, the message is live: fixes hide it, regressions show it again', async () => {
		const user = userEvent.setup();
		const props = $state(baseProps({ entry: makeEntry({ amount: 25 }) }));
		const { container } = render(WeightModal, { props });
		openDialog(container);

		// First attempt: message appears.
		await user.click(screen.getByRole('button', { name: /^Save$/ }));
		expect(queryWtMessage(container)).not.toBeNull();

		// User fixes the value (typed): message disappears.
		const input = container.querySelector('input[type="number"]') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: '70' } });
		expect(queryWtMessage(container)).toBeNull();

		// Value goes invalid again: message re-appears live, no second attempt needed.
		await fireEvent.input(input, { target: { value: '500' } });
		expect(queryWtMessage(container)).not.toBeNull();
	});

	it('[VAL-013] Save shakes once per "still invalid" period; subsequent clicks while still invalid do not re-shake', async () => {
		const user = userEvent.setup();
		const props = $state(baseProps({ entry: makeEntry({ amount: 25 }) }));
		const { container } = render(WeightModal, { props });
		openDialog(container);

		// First invalid click → shake class present.
		await user.click(screen.getByRole('button', { name: /^Save$/ }));
		let save = container.querySelector('.save-button') as HTMLButtonElement;
		expect(save.classList.contains('shake')).toBe(true);

		// Second invalid click → same shaken state, no re-trigger.
		// (We can't easily prove "the animation didn't replay" in jsdom; we assert
		// that the shake class identity is stable, i.e. no new shakeKey-driven
		// remount happened.)
		const beforeNode = save;
		await user.click(save);
		save = container.querySelector('.save-button') as HTMLButtonElement;
		expect(save).toBe(beforeNode);
	});

	it('[VAL-013] +/- recovery: fixing the value via direct entry.amount mutation clears the message after attempt', async () => {
		const user = userEvent.setup();
		const props = $state(baseProps({ entry: makeEntry({ amount: 25 }) }));
		const { container } = render(WeightModal, { props });
		openDialog(container);

		// Attempt → message visible.
		await user.click(screen.getByRole('button', { name: /^Save$/ }));
		expect(queryWtMessage(container)).not.toBeNull();

		// Simulate +/- stepping back into range (no input event fired).
		props.entry!.amount = 70;
		await new Promise((r) => setTimeout(r, 0));

		expect(queryWtMessage(container)).toBeNull();
	});

	it('Save click with valid value invokes onsave', async () => {
		const onsave = vi.fn();
		const user = userEvent.setup();
		const { container } = render(WeightModal, {
			props: baseProps({ entry: makeEntry({ amount: 70 }), onsave })
		});
		openDialog(container);

		await user.click(screen.getByRole('button', { name: /^Save$/ }));
		expect(onsave).toHaveBeenCalledTimes(1);
	});

	it('Cancel click invokes oncancel', async () => {
		const oncancel = vi.fn();
		const user = userEvent.setup();
		const { container } = render(WeightModal, { props: baseProps({ oncancel }) });
		openDialog(container);

		await user.click(screen.getByRole('button', { name: /^Cancel$/ }));
		expect(oncancel).toHaveBeenCalledTimes(1);
	});

	it('[VAL-007] backend error message surfaces in the modal alert', () => {
		const { container } = render(WeightModal, {
			props: baseProps({
				entry: makeEntry({ amount: 30 }),
				errorMessage: 'Server rejected the weight'
			})
		});
		openDialog(container);

		const alert = container.querySelector('.alert-error');
		expect(alert?.textContent).toMatch(/Server rejected the weight/);
	});

	it('[MOD-001] errorMessage prop renders as an alert inside the modal', () => {
		const { container } = render(WeightModal, {
			props: baseProps({ errorMessage: 'Update failed' })
		});
		openDialog(container);

		expect(queryMessage(container)?.textContent).toMatch(/Update failed/);
	});

	it('[MOD-004] dialog stays bound — closing/reopening is driven by the route via showModal/close', () => {
		const props = $state(baseProps());
		const { container } = render(WeightModal, { props });

		const dialog = container.querySelector('dialog') as HTMLDialogElement;
		expect(dialog).not.toBeNull();
		expect(dialog.open).toBe(false);

		dialog.showModal();
		expect(dialog.open).toBe(true);

		dialog.close();
		expect(dialog.open).toBe(false);
	});

	it('-/+ buttons clamp at the declared min (NumberStepper internal behavior; typing bypasses it)', async () => {
		const user = userEvent.setup();
		const props = $state(baseProps({ entry: makeEntry({ amount: 30 }) }));
		const { container } = render(WeightModal, { props });
		openDialog(container);

		// Click the decrement button — NumberStepper clamps stepped values at min via Math.max.
		const decBtn = container.querySelectorAll('button.btn')[0] as HTMLButtonElement;
		expect(decBtn).not.toBeNull();
		await user.click(decBtn);

		expect(props.entry!.amount).toBe(30); // not 29
	});
});
