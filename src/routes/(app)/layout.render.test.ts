import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';

vi.mock('$app/state', () => ({
	page: { url: { pathname: '/' } }
}));

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn()
}));

import Layout from './+layout.svelte';

describe('app layout (render)', () => {
	it('[ANI-001] wraps route content in a keyed fade block (cross-route page transition)', () => {
		// {#key page.url.pathname} + in:/out:fade produces the cross-route fade.
		// jsdom can't run the animation; we assert the route content rendered
		// through the fade-wrapped, keyed children block is present.
		const children = createRawSnippet(() => ({
			render: () => `<p data-testid="route-content">route body</p>`
		}));

		const { getByTestId } = render(Layout, { props: { children } });

		expect(getByTestId('route-content')).toBeTruthy();
	});

	it('[AS-001] the bottom dock exposes Home/Progress/History as navigation links to their routes', () => {
		// Tapping a dock item navigates (the click→nav+fade is veilchen +
		// SvelteKit); what we own is the navItems config. Assert the dock
		// renders links pointing at the correct routes. Settings is a button
		// (onclick toggle), not a route link — covered by AS-002.
		const children = createRawSnippet(() => ({ render: () => `<p>route</p>` }));
		render(Layout, { props: { children } });

		expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
		expect(screen.getByRole('link', { name: 'Progress' }).getAttribute('href')).toBe('/progress');
		expect(screen.getByRole('link', { name: 'History' }).getAttribute('href')).toBe('/history');
	});
});
