import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { LibreUser } from '$lib/api';
import ProfileEditModal from './ProfileEditModal.svelte';

function makeEntry(overrides: Partial<LibreUser> = {}): LibreUser {
	return { id: 1, name: 'Alice', avatar: 'alice-seed', ...overrides } as LibreUser;
}

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		entry: makeEntry(),
		errorMessage: undefined,
		onsave: vi.fn(),
		oncancel: vi.fn(),
		...overrides
	};
}

function openDialog(container: HTMLElement) {
	container.querySelector('dialog')?.showModal();
}

describe('ProfileEditModal', () => {
	it('[PF-003] save propagates the bound entry mutation back to the parent', async () => {
		const user = userEvent.setup();
		const props = $state(baseProps());
		const { container } = render(ProfileEditModal, { props });
		openDialog(container);

		const nickname = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.clear(nickname);
		await user.type(nickname, 'Bob');

		// bind:entry means the parent's prop now reflects the typed value.
		expect(props.entry!.name).toBe('Bob');
	});

	it('[PF-008] nickname at frontend lower bound (2 chars) lets save through', async () => {
		const user = userEvent.setup();
		const onsave = vi.fn();
		const { container } = render(ProfileEditModal, { props: baseProps({ onsave }) });
		openDialog(container);

		const nickname = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.clear(nickname);
		await user.type(nickname, 'Al');

		await user.click(screen.getByRole('button', { name: /^Confirm$/ }));
		expect(onsave).toHaveBeenCalled();
	});

	it('[PF-009] nickname at frontend upper bound (40 chars) lets save through', async () => {
		const user = userEvent.setup();
		const onsave = vi.fn();
		const { container } = render(ProfileEditModal, { props: baseProps({ onsave }) });
		openDialog(container);

		const nickname = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.clear(nickname);
		await user.type(nickname, 'A'.repeat(40));

		await user.click(screen.getByRole('button', { name: /^Confirm$/ }));
		expect(onsave).toHaveBeenCalled();
	});

	it('[VAL-014] client-side validation message matches the generated schema text', async () => {
		const user = userEvent.setup();
		const onsave = vi.fn();
		const { container } = render(ProfileEditModal, { props: baseProps({ onsave }) });
		openDialog(container);

		const nickname = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.clear(nickname);
		await user.type(nickname, 'A');

		await user.click(screen.getByRole('button', { name: /^Confirm$/ }));

		const { LibreUserSchema } = await import('$lib/api/gen/types');
		const expected = LibreUserSchema.shape.name.safeParse('A');
		expect(expected.success).toBe(false);
		const schemaMessage = expected.success ? '' : expected.error.issues[0].message;

		// The AlertBox renders the schema's message verbatim.
		expect(container.querySelector('.alert-error')?.textContent).toContain(schemaMessage);
	});

	it('[PF-010] [VAL-013] Confirm with a 1-char nickname does NOT invoke onsave', async () => {
		const user = userEvent.setup();
		const onsave = vi.fn();
		const { container } = render(ProfileEditModal, { props: baseProps({ onsave }) });
		openDialog(container);

		const nickname = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.clear(nickname);
		await user.type(nickname, 'A');

		await user.click(screen.getByRole('button', { name: /^Confirm$/ }));
		expect(onsave).not.toHaveBeenCalled();
	});

	it('[PF-011] maxlength prevents typing the 41st character; Confirm at 40 chars proceeds', async () => {
		const user = userEvent.setup();
		const onsave = vi.fn();
		const { container } = render(ProfileEditModal, { props: baseProps({ onsave }) });
		openDialog(container);

		const nickname = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.clear(nickname);
		await user.type(nickname, 'A'.repeat(41));

		expect(nickname.maxLength).toBe(40);
		expect(nickname.value.length).toBe(40);

		await user.click(screen.getByRole('button', { name: /^Confirm$/ }));
		expect(onsave).toHaveBeenCalled();
	});

	it('[VAL-012] ValidatedInput renders its constraint message text in the DOM', () => {
		const { container } = render(ProfileEditModal, { props: baseProps() });
		openDialog(container);

		// ValidatedInput renders the children snippet inside its hint span.
		// The visibility of that hint is DaisyUI :invalid-driven CSS — we only
		// assert presence here.
		const hint = container.textContent ?? '';
		expect(hint).toMatch(/Nickname must be between 2 and 40 characters long/);
	});

	it('[MOD-001] errorMessage prop surfaces as an alert inside the modal', () => {
		const { container } = render(ProfileEditModal, {
			props: baseProps({ errorMessage: 'Update failed' })
		});
		openDialog(container);

		expect(screen.getByText('Update failed')).toBeTruthy();
	});

	it('[MOD-004] tapping the avatar opens the picker view', async () => {
		const user = userEvent.setup();
		const { container } = render(ProfileEditModal, { props: baseProps() });
		openDialog(container);

		// Initially the form is active; no Done button (which only exists in picker view).
		expect(screen.queryByRole('button', { name: /Done/i })).toBeNull();
		expect(screen.queryByLabelText(/Nickname/i)).not.toBeNull();

		// veilchen's Avatar renders as <button class="avatar"> when onclick is set.
		const avatarBtn = container.querySelector('button.avatar') as HTMLButtonElement;
		expect(avatarBtn).not.toBeNull();
		await user.click(avatarBtn);

		// Picker view active.
		expect(screen.getByRole('button', { name: /Done/i })).toBeTruthy();
	});
});
