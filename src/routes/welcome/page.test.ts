import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

const goto = vi.fn();
vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => goto(...args)
}));

vi.stubGlobal('__APP_VERSION__', '0.0.0-test');

import Page from './+page.svelte';

describe('welcome page', () => {
	it('[OB-002] should navigate to /setup when the Get Started button is clicked', async () => {
		const user = userEvent.setup();
		render(Page);

		await user.click(screen.getByRole('button', { name: /Get Started/i }));

		expect(goto).toHaveBeenCalledWith('/setup');
	});
});
