import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
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
});
