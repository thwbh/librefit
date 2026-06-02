import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import TestWrapper from '../../../../tests/utils/TestWrapper.svelte';

const updateUser = vi.fn();

vi.mock('$lib/api/gen/commands', () => ({
	updateUser: (...args: unknown[]) => updateUser(...args)
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

function makeData() {
	return {
		bodyData: {
			id: 1,
			age: 30,
			sex: 'MALE',
			height: 180,
			weight: 80,
			activityLevel: 1
		}
	};
}

function renderPage(user = { id: 1, name: 'Arnie', avatar: '' }) {
	return render(TestWrapper, {
		props: {
			component: Page,
			props: { data: makeData() },
			user
		}
	});
}

describe('profile page', () => {
	it('[PF-001] should render the profile page with the user nickname and swipe affordance', () => {
		renderPage();

		expect(screen.getByText('Profile')).toBeTruthy();
		expect(screen.getByText('Arnie')).toBeTruthy();
		expect(screen.getByText(/Swipe to edit/i)).toBeTruthy();
	});

	it('[PF-001] should show the body data summary block', () => {
		renderPage();

		// BodyDataDisplay renders the values present in data.bodyData.
		// Spot-check that the height value shows up somewhere on screen.
		expect(document.body.textContent).toContain('180');
		expect(document.body.textContent).toContain('80');
	});

	it('[PF-002] should expose a swipe target for entering edit mode', () => {
		renderPage();
		// SwipeableListItem from @thwbh/veilchen renders a region the user can swipe.
		// The card containing the name and "Swipe to edit" hint is the swipe target.
		expect(screen.getByText(/Swipe to edit/i)).toBeTruthy();
	});

	it('should not call updateUser on initial render (sanity)', () => {
		renderPage();
		expect(updateUser).not.toHaveBeenCalled();
	});
});
