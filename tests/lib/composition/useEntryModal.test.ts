import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEntryModal } from '../../../src/lib/composition/useEntryModal.svelte';

// Mock Tauri logger
vi.mock('@tauri-apps/plugin-log', () => ({
	debug: vi.fn(),
	error: vi.fn(),
	info: vi.fn()
}));

// Mock error formatter
vi.mock('$lib/api/error-formatter', () => ({
	formatError: vi.fn((error: unknown) => {
		if (error instanceof Error) return error.message;
		if (typeof error === 'string') return error;
		return 'Unknown error';
	})
}));

interface TestEntry {
	id?: number;
	name: string;
	value: number;
}

type NewTestEntry = Omit<TestEntry, 'id'>;

describe('useEntryModal', () => {
	let onCreateMock: ReturnType<typeof vi.fn>;
	let onUpdateMock: ReturnType<typeof vi.fn>;
	let onDeleteMock: ReturnType<typeof vi.fn>;
	let onCreateSuccessMock: ReturnType<typeof vi.fn>;
	let onUpdateSuccessMock: ReturnType<typeof vi.fn>;
	let onDeleteSuccessMock: ReturnType<typeof vi.fn>;

	const blankEntry: NewTestEntry = { name: '', value: 0 };

	beforeEach(() => {
		onCreateMock = vi.fn();
		onUpdateMock = vi.fn();
		onDeleteMock = vi.fn();
		onCreateSuccessMock = vi.fn();
		onUpdateSuccessMock = vi.fn();
		onDeleteSuccessMock = vi.fn();
	});

	describe('Initialization', () => {
		it('should initialize with default state', () => {
			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			expect(modal.mode).toBe('create');
			expect(modal.currentEntry).toBeUndefined();
			expect(modal.enableDelete).toBe(false);
			expect(modal.isProcessing).toBe(false);
			expect(modal.isEditing).toBe(false);
			expect(modal.errorMessage).toBeUndefined();
			expect(modal.hasError).toBe(false);
		});

		it('should accept optional success callbacks', () => {
			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry,
				onCreateSuccess: onCreateSuccessMock,
				onUpdateSuccess: onUpdateSuccessMock,
				onDeleteSuccess: onDeleteSuccessMock
			});

			expect(modal).toBeDefined();
		});
	});

	describe('Create Mode', () => {
		it('should open create modal with blank entry', () => {
			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => ({ name: 'test', value: 42 })
			});

			modal.openCreate();

			expect(modal.mode).toBe('create');
			expect(modal.currentEntry).toEqual({ name: 'test', value: 42 });
			expect(modal.enableDelete).toBe(false);
			expect(modal.errorMessage).toBeUndefined();
		});

		it('should save new entry successfully', async () => {
			const newEntry: TestEntry = { id: 1, name: 'New Entry', value: 100 };
			onCreateMock.mockResolvedValue(newEntry);

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry,
				onCreateSuccess: onCreateSuccessMock
			});

			modal.openCreate();
			modal.currentEntry = { name: 'New Entry', value: 100 };

			const result = await modal.save();

			expect(result).toBe(false); // Returns false (see implementation line 200)
			expect(onCreateMock).toHaveBeenCalledWith({ name: 'New Entry', value: 100 });
			expect(onCreateSuccessMock).toHaveBeenCalledWith(newEntry);
			expect(modal.currentEntry).toBeUndefined();
			expect(modal.enableDelete).toBe(false);
		});

		it('should handle create error and prevent modal close', async () => {
			const error = new Error('Validation failed');
			onCreateMock.mockRejectedValue(error);

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openCreate();
			modal.currentEntry = { name: 'Bad Entry', value: -1 };

			const mockEvent = {
				preventDefault: vi.fn(),
				stopPropagation: vi.fn()
			} as unknown as Event;

			const result = await modal.save(mockEvent);

			expect(result).toBe(false);
			expect(onCreateMock).toHaveBeenCalled();
			expect(mockEvent.preventDefault).toHaveBeenCalled();
			expect(mockEvent.stopPropagation).toHaveBeenCalled();
			expect(modal.errorMessage).toBe('Validation failed');
			expect(modal.hasError).toBe(true);
		});

		it('should not save when already processing', async () => {
			onCreateMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openCreate();
			modal.currentEntry = { name: 'Entry', value: 1 };

			// Start first save
			const promise1 = modal.save();

			// Try to save again while processing
			const result2 = await modal.save();

			expect(result2).toBe(false);
			expect(onCreateMock).toHaveBeenCalledTimes(1);

			await promise1;
		});
	});

	describe('Edit Mode', () => {
		it('should open edit modal with entry copy', () => {
			const entry: TestEntry = { id: 1, name: 'Existing', value: 50 };

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openEdit(entry);

			expect(modal.mode).toBe('edit');
			expect(modal.isEditing).toBe(true);
			expect(modal.currentEntry).toEqual(entry);
			expect(modal.currentEntry).not.toBe(entry); // Should be a copy
			expect(modal.enableDelete).toBe(false);
			expect(modal.errorMessage).toBeUndefined();
		});

		it('should update entry successfully', async () => {
			const originalEntry: TestEntry = { id: 1, name: 'Original', value: 50 };
			const updatedEntry: TestEntry = { id: 1, name: 'Updated', value: 75 };
			onUpdateMock.mockResolvedValue(updatedEntry);

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry,
				onUpdateSuccess: onUpdateSuccessMock
			});

			modal.openEdit(originalEntry);
			modal.currentEntry = updatedEntry;

			const result = await modal.save();

			expect(result).toBe(false); // Returns false (see implementation line 200)
			expect(onUpdateMock).toHaveBeenCalledWith(1, updatedEntry);
			expect(onUpdateSuccessMock).toHaveBeenCalledWith(updatedEntry);
			expect(modal.currentEntry).toBeUndefined();
			expect(modal.enableDelete).toBe(false);
		});

		it('should handle update error and prevent modal close', async () => {
			const entry: TestEntry = { id: 1, name: 'Test', value: 50 };
			const error = new Error('Update failed');
			onUpdateMock.mockRejectedValue(error);

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openEdit(entry);

			const mockEvent = {
				preventDefault: vi.fn(),
				stopPropagation: vi.fn()
			} as unknown as Event;

			const result = await modal.save(mockEvent);

			expect(result).toBe(false);
			expect(mockEvent.preventDefault).toHaveBeenCalled();
			expect(mockEvent.stopPropagation).toHaveBeenCalled();
			expect(modal.errorMessage).toBe('Update failed');
		});

		it('should not update if entry has no id', async () => {
			const entryWithoutId: TestEntry = { name: 'No ID', value: 10 };

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openEdit(entryWithoutId);

			const result = await modal.save();

			expect(result).toBe(false);
			expect(onUpdateMock).not.toHaveBeenCalled();
		});
	});

	describe('Delete Mode', () => {
		it('should open delete modal', () => {
			const entry: TestEntry = { id: 1, name: 'To Delete', value: 50 };

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openDelete(entry);

			expect(modal.mode).toBe('delete');
			expect(modal.currentEntry).toEqual(entry);
			expect(modal.enableDelete).toBe(true);
			expect(modal.errorMessage).toBeUndefined();
		});

		it('should delete entry via save() in delete mode', async () => {
			const entry: TestEntry = { id: 1, name: 'To Delete', value: 50 };
			onDeleteMock.mockResolvedValue(1);

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry,
				onDeleteSuccess: onDeleteSuccessMock
			});

			modal.openDelete(entry);

			const result = await modal.save();

			expect(result).toBe(true);
			expect(onDeleteMock).toHaveBeenCalledWith(1);
			expect(onDeleteSuccessMock).toHaveBeenCalledWith(1);
			expect(modal.currentEntry).toBeUndefined();
			expect(modal.enableDelete).toBe(false);
		});

		it('should delete entry via deleteEntry()', async () => {
			const entry: TestEntry = { id: 2, name: 'To Delete', value: 50 };
			onDeleteMock.mockResolvedValue(2);

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry,
				onDeleteSuccess: onDeleteSuccessMock
			});

			modal.openEdit(entry);

			const result = await modal.deleteEntry();

			expect(result).toBe(true);
			expect(onDeleteMock).toHaveBeenCalledWith(2);
			expect(onDeleteSuccessMock).toHaveBeenCalledWith(2);
			expect(modal.currentEntry).toBeUndefined();
		});

		it('should handle delete error', async () => {
			const entry: TestEntry = { id: 1, name: 'To Delete', value: 50 };
			const error = new Error('Delete failed');
			onDeleteMock.mockRejectedValue(error);

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openEdit(entry);

			const mockEvent = {
				preventDefault: vi.fn(),
				stopPropagation: vi.fn()
			} as unknown as Event;

			const result = await modal.deleteEntry(mockEvent);

			expect(result).toBe(false);
			expect(mockEvent.preventDefault).toHaveBeenCalled();
			expect(mockEvent.stopPropagation).toHaveBeenCalled();
			expect(modal.errorMessage).toBe('Delete failed');
		});

		it('should not delete when already processing', async () => {
			const entry: TestEntry = { id: 1, name: 'Test', value: 50 };
			onDeleteMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openEdit(entry);

			// Start first delete
			const promise1 = modal.deleteEntry();

			// Try to delete again while processing
			const result2 = await modal.deleteEntry();

			expect(result2).toBe(false);
			expect(onDeleteMock).toHaveBeenCalledTimes(1);

			await promise1;
		});

		it('should not delete if entry has no id', async () => {
			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			const result = await modal.deleteEntry();

			expect(result).toBe(false);
			expect(onDeleteMock).not.toHaveBeenCalled();
		});
	});

	describe('Cancel Functionality', () => {
		it('should reset state on cancel', () => {
			const entry: TestEntry = { id: 1, name: 'Test', value: 50 };

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openEdit(entry);
			modal.cancel();

			expect(modal.currentEntry).toBeUndefined();
			expect(modal.enableDelete).toBe(false);
			expect(modal.errorMessage).toBeUndefined();
		});

		it('should clear error on cancel', () => {
			const error = new Error('Test error');
			onCreateMock.mockRejectedValue(error);

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openCreate();

			// Create an error
			modal.save();

			// Wait for error to be set, then cancel
			setTimeout(() => {
				modal.cancel();
				expect(modal.errorMessage).toBeUndefined();
			}, 10);
		});
	});

	describe('Error Management', () => {
		it('should clear error message', () => {
			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			// Manually set error (simulating an error state)
			modal.openCreate();
			onCreateMock.mockRejectedValue(new Error('Test error'));
			modal.save();

			// Wait for error to be set
			setTimeout(() => {
				modal.clearError();
				expect(modal.errorMessage).toBeUndefined();
				expect(modal.hasError).toBe(false);
			}, 10);
		});

		it('should format different error types', async () => {
			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			// Error object
			onCreateMock.mockRejectedValue(new Error('Error object'));
			modal.openCreate();
			await modal.save();
			expect(modal.errorMessage).toBe('Error object');

			// String error
			onCreateMock.mockRejectedValue('String error');
			modal.openCreate();
			await modal.save();
			expect(modal.errorMessage).toBe('String error');

			// Unknown error
			onCreateMock.mockRejectedValue({ unknown: true });
			modal.openCreate();
			await modal.save();
			expect(modal.errorMessage).toBe('Unknown error');
		});
	});

	describe('State Management', () => {
		it('should track isEditing correctly', () => {
			const entry: TestEntry = { id: 1, name: 'Test', value: 50 };

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			expect(modal.isEditing).toBe(false);

			modal.openCreate();
			expect(modal.isEditing).toBe(false);

			modal.openEdit(entry);
			expect(modal.isEditing).toBe(true);

			modal.openDelete(entry);
			expect(modal.isEditing).toBe(false);
		});

		it('should allow updating currentEntry', () => {
			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openCreate();
			modal.currentEntry = { name: 'Modified', value: 999 };

			expect(modal.currentEntry).toEqual({ name: 'Modified', value: 999 });
		});

		it('should enable delete mode via requestDelete', () => {
			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			expect(modal.enableDelete).toBe(false);

			modal.requestDelete();

			expect(modal.enableDelete).toBe(true);
		});
	});

	describe('Dialog Bindings', () => {
		it('should provide bindable dialog references', () => {
			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			expect(modal.createDialog).toBeDefined();
			expect(modal.editDialog).toBeDefined();
			expect(modal.deleteDialog).toBeDefined();

			// Dialog references should initially be undefined
			expect(modal.createDialog.value).toBeUndefined();
			expect(modal.editDialog.value).toBeUndefined();
			expect(modal.deleteDialog.value).toBeUndefined();
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid mode switching', () => {
			const entry: TestEntry = { id: 1, name: 'Test', value: 50 };

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openCreate();
			expect(modal.mode).toBe('create');

			modal.openEdit(entry);
			expect(modal.mode).toBe('edit');

			modal.openDelete(entry);
			expect(modal.mode).toBe('delete');

			modal.openCreate();
			expect(modal.mode).toBe('create');
		});

		it('should clear error when opening new modal', () => {
			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			onCreateMock.mockRejectedValue(new Error('Test'));
			modal.openCreate();
			modal.save();

			// Opening new modal should clear previous error
			modal.openCreate();
			expect(modal.errorMessage).toBeUndefined();
		});

		it('should handle save without event object', async () => {
			const newEntry: TestEntry = { id: 1, name: 'New', value: 100 };
			onCreateMock.mockResolvedValue(newEntry);

			const modal = useEntryModal<TestEntry, NewTestEntry>({
				onCreate: onCreateMock,
				onUpdate: onUpdateMock,
				onDelete: onDeleteMock,
				getBlankEntry: () => blankEntry
			});

			modal.openCreate();
			modal.currentEntry = { name: 'New', value: 100 };

			// Call save without event
			const result = await modal.save();

			expect(result).toBe(false);
			expect(onCreateMock).toHaveBeenCalled();
		});
	});
});
