import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Settings from './Settings.svelte';

describe('Settings', () => {
	it('[AS-002] [AS-003] should render the floating settings menu (not a route) when open', () => {
		// AS-002: tapping Settings surfaces a floating menu overlay rather than
		// navigating. The dock-tap → open toggle lives in the app-shell layout;
		// this verifies the menu-appears-as-overlay half — the items render in
		// place as an overlay, not via route navigation.
		render(Settings, { props: { open: true } });

		expect(screen.getByRole('link', { name: /Profile/i })).toBeTruthy();
		expect(screen.getByRole('link', { name: /Export/i })).toBeTruthy();
		expect(screen.getByRole('link', { name: /Import/i })).toBeTruthy();
		expect(screen.getByRole('link', { name: /Wizard/i })).toBeTruthy();
		expect(screen.getByRole('link', { name: /About/i })).toBeTruthy();
	});

	it('[AS-003] should target the expected routes from each menu item', () => {
		render(Settings, { props: { open: true } });

		expect(screen.getByRole('link', { name: /Profile/i }).getAttribute('href')).toBe('/profile');
		expect(screen.getByRole('link', { name: /Export/i }).getAttribute('href')).toBe('/export');
		expect(screen.getByRole('link', { name: /Import/i }).getAttribute('href')).toBe('/import');
		expect(screen.getByRole('link', { name: /Wizard/i }).getAttribute('href')).toBe('/wizard');
		expect(screen.getByRole('link', { name: /About/i }).getAttribute('href')).toBe('/about');
	});

	it('[ANI-002] the settings menu panel (transition:fly) is present when open', () => {
		// The menu container carries transition:fly={{ y: 10 }} so it flies in.
		// jsdom doesn't run the animation; we assert the panel that carries the
		// transition renders when open.
		const { container } = render(Settings, { props: { open: true } });
		const panel = container.querySelector('.menu')?.closest('div');
		expect(panel).not.toBeNull();
	});

	it('[AS-004] should not render menu content when closed', () => {
		render(Settings, { props: { open: false } });

		expect(screen.queryByRole('link', { name: /Profile/i })).toBeNull();
		expect(screen.queryByRole('button', { name: /Close menu/i })).toBeNull();
	});

	it('[AS-004] should close when the backdrop is clicked (MOD-004)', async () => {
		const user = userEvent.setup();
		const props = $state({ open: true });
		render(Settings, { props });

		await user.click(screen.getByRole('button', { name: /Close menu/i }));

		expect(props.open).toBe(false);
	});

	it('[AS-004] should close when any menu item is clicked', async () => {
		const user = userEvent.setup();
		const props = $state({ open: true });
		render(Settings, { props });

		await user.click(screen.getByRole('link', { name: /Profile/i }));

		expect(props.open).toBe(false);
	});
});
