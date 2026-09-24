import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

vi.mock('$lib/api', () => ({
	cancelImport: vi.fn(),
	importDataFile: vi.fn()
}));

vi.mock('@tauri-apps/api/core', () => ({
	Channel: class {
		onmessage: ((m: unknown) => void) | null = null;
	}
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
	open: vi.fn().mockResolvedValue(null)
}));

vi.mock('@tauri-apps/plugin-log', () => ({
	debug: vi.fn(),
	error: vi.fn()
}));

import Page from './+page.svelte';

describe('import page', () => {
	it('[IM-009] should disable the Import button until a file is chosen', () => {
		render(Page);

		const importButton = screen.getByRole('button', { name: /^Import$/ });
		expect(importButton).toBeDisabled();
	});

	it('[IM-011] should warn that importing appends and does not deduplicate', () => {
		render(Page);

		expect(screen.getByText(/no automatic deduplication/i)).toBeInTheDocument();
		expect(screen.getByText(/duplicate entries/i)).toBeInTheDocument();
	});
});
