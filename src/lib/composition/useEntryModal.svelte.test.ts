import { describe, it, expect, vi } from 'vitest';

// The composable logs via tauri-plugin-log (fire-and-forget); stub it so the
// plugin's `invoke` doesn't reject in jsdom.
vi.mock('@tauri-apps/plugin-log', () => ({
	debug: vi.fn(),
	error: vi.fn(),
	info: vi.fn(),
	warn: vi.fn()
}));

import { useEntryModal } from './useEntryModal.svelte';

// Confirm-first wiring for AI meal-photo capture (FR). A captured candidate
// pre-fills the create modal via `openCreateWith`; nothing is saved until the user
// confirms through the same path as manual entry, and cancel discards it.

interface Entry {
	id?: number;
	added: string;
	amount: number;
	category: string;
	description?: string;
}

const candidate: Entry = { added: '2026-01-01', amount: 420, category: 'l', description: 'Pizza' };

function makeModal(onCreate = vi.fn(async (e: Entry) => ({ ...e, id: 1 }))) {
	const modal = useEntryModal<Entry, Entry>({
		onCreate,
		onUpdate: vi.fn(async (_id, e) => e),
		onDelete: vi.fn(async (id) => id),
		getBlankEntry: () => ({ added: '2026-01-01', amount: 0, category: 'b', description: '' })
	});
	return { modal, onCreate };
}

describe('useEntryModal.openCreateWith', () => {
	it('[IT-034] pre-fills the create modal with the supplied candidate', () => {
		const { modal } = makeModal();
		modal.openCreateWith({ ...candidate });
		expect(modal.mode).toBe('create');
		expect(modal.currentEntry).toEqual(candidate);
	});

	it('[FR-025] the pre-filled candidate is the entry under review', () => {
		const { modal } = makeModal();
		modal.openCreateWith({ ...candidate });
		expect(modal.currentEntry).toMatchObject({ amount: 420, description: 'Pizza' });
	});

	it('[FR-026] confirming saves through the normal create path', async () => {
		const { modal, onCreate } = makeModal();
		modal.openCreateWith({ ...candidate });
		await modal.save();
		expect(onCreate).toHaveBeenCalledOnce();
		expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ amount: 420 }));
	});

	it('[FR-027] cancelling discards the candidate without creating anything', () => {
		const { modal, onCreate } = makeModal();
		modal.openCreateWith({ ...candidate });
		modal.cancel();
		expect(modal.currentEntry).toBeUndefined();
		expect(onCreate).not.toHaveBeenCalled();
	});
});
