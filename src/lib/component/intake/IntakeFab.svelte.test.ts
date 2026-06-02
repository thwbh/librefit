import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import IntakeFab from './IntakeFab.svelte';

describe('IntakeFab', () => {
	it('[IT-005] click invokes onclick (parent opens create modal)', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();

		render(IntakeFab, { props: { onclick } });

		// Portal moves the button to document.body — query by role/name still finds it.
		const fab = screen.getByRole('button', { name: /Add intake/i });
		await user.click(fab);

		expect(onclick).toHaveBeenCalledTimes(1);
	});
});
