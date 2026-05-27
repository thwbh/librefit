import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// Mock Tauri commands so the test never reaches the backend boundary.
vi.mock('$lib/api/gen/commands', () => ({
	updateUser: vi.fn(),
	updateBodyData: vi.fn(),
	wizardCreateTargets: vi.fn(),
	wizardCalculateTdee: vi.fn().mockResolvedValue(null),
	wizardCalculateForTargetWeight: vi.fn().mockResolvedValue(null)
}));

vi.mock('@tauri-apps/plugin-log', () => ({
	debug: vi.fn(),
	error: vi.fn(),
	info: vi.fn()
}));

vi.mock('$lib/avatar', () => ({
	getAvatar: (seed: string | undefined) => `data:image/svg+xml;avatar=${seed ?? ''}`,
	getAvatarFromUser: (name: string, avatar: string | undefined) =>
		`data:image/svg+xml;avatar=${avatar || name}`
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));

import Setup from './Setup.svelte';

function renderFirstTime() {
	// No props → first-time fallback: name='', sex=undefined.
	return render(Setup);
}

async function clickNext(user: ReturnType<typeof userEvent.setup>) {
	const next = screen.getByRole('button', { name: /Next/i });
	await user.click(next);
}

// Step 2 (ActivityLevel) renders the activityLevels list — "Mostly Sedentary" is
// the first label and is a reliable marker that we've reached Step 2.
// (Asserting Step 1 absence is unreliable because Svelte's `fly` transition keeps
// Step 1 mounted during the out-animation in jsdom.)
const step2Marker = () => screen.queryByText(/Mostly Sedentary/);

describe('Setup wizard (Step 1 gating)', () => {
	it('[OB-006] sex unset → click Next does not advance; pick Male → Next advances', async () => {
		const user = userEvent.setup();
		renderFirstTime();

		// Give a valid nickname so sex is the only failing field.
		const nicknameInput = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.type(nicknameInput, 'Alice');

		// Click Next without picking sex → step1Valid is false → rollback to Step 1.
		await clickNext(user);
		expect(step2Marker()).toBeNull();

		// Pick Male, click Next → all valid → advance to Step 2.
		await user.click(screen.getByRole('button', { name: /^Male$/ }));
		await clickNext(user);
		expect(step2Marker()).not.toBeNull();
	});

	it('[OB-018] nickname shorter than 2 chars → click Next does not advance', async () => {
		const user = userEvent.setup();
		renderFirstTime();

		// Pick sex so the only failing field is nickname length.
		await user.click(screen.getByRole('button', { name: /^Male$/ }));

		// One char — below the validator's min(2).
		const nicknameInput = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.type(nicknameInput, 'A');

		await clickNext(user);
		expect(step2Marker()).toBeNull();
	});

	it('[OB-019] nickname within bounds + other fields valid → click Next advances', async () => {
		const user = userEvent.setup();
		renderFirstTime();

		await user.click(screen.getByRole('button', { name: /^Male$/ }));

		const nicknameInput = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.type(nicknameInput, 'Al'); // length 2 — at the lower bound

		await clickNext(user);
		expect(step2Marker()).not.toBeNull();
	});

	it('[OB-020] errors deferred until attempted advance; one per invalid field; clears as user fixes them', async () => {
		const user = userEvent.setup();
		const { container } = renderFirstTime();

		// On initial render: no error messages anywhere — even though name='' and sex=undefined.
		expect(container.querySelectorAll('.text-error').length).toBe(0);

		// Click Next with both fields invalid → both errors render.
		await clickNext(user);
		const errorsAfterAttempt = container.querySelectorAll('.text-error');
		expect(errorsAfterAttempt.length).toBe(2);

		// The sex error uses the curated UI-side message, not the default Zod enum text.
		const errorTexts = Array.from(errorsAfterAttempt, (n) => n.textContent ?? '');
		expect(errorTexts.some((t) => /Please choose Male or Female/.test(t))).toBe(true);
		// And the nickname error uses the message owned by the Rust validator annotation.
		expect(errorTexts.some((t) => /Nickname must be between 2 and 40 characters/.test(t))).toBe(
			true
		);

		// Fix the nickname — nickname error disappears, sex error stays.
		const nicknameInput = screen.getByLabelText(/Nickname/i) as HTMLInputElement;
		await user.type(nicknameInput, 'Alice');
		const errorsAfterNicknameFix = container.querySelectorAll('.text-error');
		expect(errorsAfterNicknameFix.length).toBe(1);

		// Fix the sex — all errors clear.
		await user.click(screen.getByRole('button', { name: /^Male$/ }));
		expect(container.querySelectorAll('.text-error').length).toBe(0);
	});
});
