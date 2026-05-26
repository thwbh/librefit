import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TestWrapper from '../../../../tests/utils/TestWrapper.svelte';

vi.mock('$lib/api/gen/commands', () => ({
	updateUser: vi.fn(),
	updateBodyData: vi.fn(),
	wizardCreateTargets: vi.fn(),
	wizardCalculateTdee: vi.fn(),
	wizardCalculateForTargetWeight: vi.fn()
}));

vi.mock('@tauri-apps/plugin-log', () => ({
	debug: vi.fn(),
	error: vi.fn()
}));

vi.mock('$lib/avatar', () => ({
	getAvatar: (seed: string | undefined) => `data:image/svg+xml;avatar=${seed ?? ''}`,
	getAvatarFromUser: (name: string, avatar: string | undefined) =>
		`data:image/svg+xml;avatar=${avatar || name}`
}));

import Page from './+page.svelte';

function renderWizard(
	bodyData: Record<string, unknown>,
	user = { id: 1, name: 'Arnie', avatar: '' }
) {
	return render(TestWrapper, {
		props: {
			component: Page,
			props: { data: { bodyData } },
			user
		}
	});
}

describe('wizard re-run page', () => {
	it('[PF-014] should pre-populate body data on the first wizard step from the loader', () => {
		renderWizard({
			id: 1,
			age: 42,
			sex: 'FEMALE',
			height: 165,
			weight: 62,
			activityLevel: 1.5
		});

		// Step 1 (Body) renders range inputs bound to age/height/weight.
		const ranges = Array.from(
			document.querySelectorAll<HTMLInputElement>('input[type="range"]')
		).map((el) => el.value);

		expect(ranges).toContain('42');
		expect(ranges).toContain('165');
		expect(ranges).toContain('62');
	});

	it('[PF-014] should display the wizard header with the first-step title', () => {
		renderWizard({
			id: 1,
			age: 30,
			sex: 'MALE',
			height: 180,
			weight: 80,
			activityLevel: 1
		});

		expect(screen.getByText(/Step 1 of 5/)).toBeTruthy();
		expect(screen.getByText(/Body Parameters/)).toBeTruthy();
	});
});
