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

	it('[PF-008] nickname at frontend lower bound (2 chars) enables Save', async () => {
		const user = userEvent.setup();
		const { container } = render(ProfileEditModal, { props: baseProps() });
		openDialog(container);

		const nickname = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.clear(nickname);
		await user.type(nickname, 'Al');

		const confirm = screen.getByRole('button', { name: /^Confirm$/ }) as HTMLButtonElement;
		expect(nickname.value).toBe('Al');
		expect(confirm.disabled).toBe(false);
	});

	it('[PF-009] nickname at frontend upper bound (40 chars) enables Save', async () => {
		const user = userEvent.setup();
		const { container } = render(ProfileEditModal, { props: baseProps() });
		openDialog(container);

		const nickname = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		const fortyChars = 'A'.repeat(40);
		await user.clear(nickname);
		await user.type(nickname, fortyChars);

		const confirm = screen.getByRole('button', { name: /^Confirm$/ }) as HTMLButtonElement;
		expect(nickname.value).toBe(fortyChars);
		expect(confirm.disabled).toBe(false);
	});

	it('[PF-010] nickname below frontend lower bound (1 char) disables Save', async () => {
		const user = userEvent.setup();
		const onsave = vi.fn();
		const { container } = render(ProfileEditModal, { props: baseProps({ onsave }) });
		openDialog(container);

		const nickname = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.clear(nickname);
		await user.type(nickname, 'A');

		const confirm = screen.getByRole('button', { name: /^Confirm$/ }) as HTMLButtonElement;
		expect(confirm.disabled).toBe(true);

		// Defense-in-depth: even if the button somehow gets clicked, onsave must not fire.
		await user.click(confirm);
		expect(onsave).not.toHaveBeenCalled();
	});

	it('[PF-011] maxlength prevents typing the 41st character; Save stays enabled at 40', async () => {
		const user = userEvent.setup();
		const { container } = render(ProfileEditModal, { props: baseProps() });
		openDialog(container);

		const nickname = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.clear(nickname);
		await user.type(nickname, 'A'.repeat(41));

		// The native input respects maxlength=40 and refuses the 41st character —
		// so a 41-char nickname can never actually exist in the UI.
		expect(nickname.maxLength).toBe(40);
		expect(nickname.value.length).toBe(40);

		const confirm = screen.getByRole('button', { name: /^Confirm$/ }) as HTMLButtonElement;
		expect(confirm.disabled).toBe(false);
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
