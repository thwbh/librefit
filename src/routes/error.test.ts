import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

const goto = vi.fn();
vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => goto(...args)
}));

vi.mock('$app/state', () => ({
	page: {
		status: 500,
		error: { message: 'Internal Server Error' }
	}
}));

import ErrorPage from './+error.svelte';

describe('+error.svelte', () => {
	it('[AS-006] should render the error status and message', () => {
		render(ErrorPage);

		expect(screen.getByText(/500: Internal Server Error/)).toBeTruthy();
		expect(screen.getByText(/took a wrong turn/i)).toBeTruthy();
	});

	it('[AS-006] should navigate back to home when the Back button is clicked', async () => {
		const user = userEvent.setup();
		render(ErrorPage);

		await user.click(screen.getByRole('button', { name: /back/i }));

		expect(goto).toHaveBeenCalledWith('/');
	});
});
