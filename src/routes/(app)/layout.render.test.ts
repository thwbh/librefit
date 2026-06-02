import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { toast } from '@thwbh/veilchen';

vi.mock('$app/state', () => ({
	page: { url: { pathname: '/' } }
}));

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn()
}));

import Layout from './+layout.svelte';

describe('app layout (render)', () => {
	afterEach(() => {
		toast.clear();
	});

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

	it('[ERR-006] [ERR-007] toasts emitted through the shared store surface in the layout, stacked and dismissible', () => {
		// We own the wiring: the layout mounts veilchen's <ToastContainer>, bound
		// to the same shared `toast` store the app emits through. Seed two toasts
		// (duration 0 so no auto-dismiss timer leaks) and assert both render
		// (stacking — ERR-007), each exposing a Dismiss affordance (ERR-006). The
		// swipe/stack mechanics themselves stay veilchen's.
		toast.warning('first toast', 0);
		toast.error('second toast', 0);

		const children = createRawSnippet(() => ({ render: () => `<p>route</p>` }));
		render(Layout, { props: { children } });

		const alerts = screen.getAllByRole('alert');
		expect(alerts.length).toBe(2);
		expect(screen.getByText('first toast')).toBeTruthy();
		expect(screen.getByText('second toast')).toBeTruthy();
		expect(screen.getAllByRole('button', { name: 'Dismiss' }).length).toBe(2);
	});
});
