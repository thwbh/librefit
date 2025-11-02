/**
 * Reusable composition for managing CRUD modals (Create, Edit, Delete)
 *
 * This hook encapsulates the common pattern of managing entry modals with
 * create, edit, and delete operations. It handles all the state management,
 * validation errors, and provides clean callbacks for the actual API operations.
 *
 * When validation errors occur, the error message is displayed and event propagation
 * is stopped to prevent the modal from closing.
 *
 * @example
 * ```typescript
 * import { createCalorieTrackerEntry, updateCalorieTrackerEntry, deleteCalorieTrackerEntry } from '$lib/api/gen/commands';
 *
 * const modal = useEntryModal<CalorieTracker, NewCalorieTracker>({
 *   onCreate: (entry, hooks) => createCalorieTrackerEntry({ newEntry: entry }, hooks),
 *   onUpdate: (id, entry, hooks) => updateCalorieTrackerEntry({ trackerId: id, updatedEntry: entry }, hooks),
 *   onDelete: (id, hooks) => deleteCalorieTrackerEntry({ trackerId: id }, hooks),
 *   getBlankEntry: () => ({ added: '2024-01-01', amount: 0, category: 'l', description: '' })
 * });
 *
 * // In template:
 * <button onclick={modal.openCreate}>Add Entry</button>
 * <ModalDialog
 *   bind:dialog={modal.createDialog}
 *   onconfirm={modal.save}
 *   oncancel={modal.cancel}
 * >
 *   <CalorieTrackerMask bind:entry={modal.currentEntry} isEditing={true} />
 * </ModalDialog>
 * ```
 */

import type { CommandHooks } from '$lib/api/gen/commands';
import { type ZodError } from 'zod';
import { formatZodError, formatInvokeError, formatError } from '$lib/api/error-formatter';

export interface UseEntryModalOptions<T extends { id?: number }, N = T> {
  /** Called when creating a new entry - receives optional hooks for error/success handling */
  onCreate: (entry: N, hooks?: CommandHooks<T>) => Promise<T>;
  /** Called when updating an existing entry - receives optional hooks for error/success handling */
  onUpdate: (id: number, entry: T, hooks?: CommandHooks<T>) => Promise<T>;
  /** Called when deleting an entry - receives optional hooks for error/success handling */
  onDelete: (id: number, hooks?: CommandHooks<number>) => Promise<number>;
  /** Returns a blank entry for the create form */
  getBlankEntry: () => N;
  /** Optional callback after successful create */
  onCreateSuccess?: (entry: T) => void;
  /** Optional callback after successful update */
  onUpdateSuccess?: (entry: T) => void;
  /** Optional callback after successful delete */
  onDeleteSuccess?: (id: number) => void;
}

export function useEntryModal<T extends { id?: number }, N = T>(
  options: UseEntryModalOptions<T, N>
) {
  const { onCreate, onUpdate, onDelete, getBlankEntry, onCreateSuccess, onUpdateSuccess, onDeleteSuccess } = options;

  // Modal dialog references
  let createDialog = $state<HTMLDialogElement>();
  let editDialog = $state<HTMLDialogElement>();
  let deleteDialog = $state<HTMLDialogElement>();

  // Entry being created or edited
  let currentEntry = $state<T | N>();

  // Entry being edited (for edit mode)
  let editingEntry = $state<T>();

  // State flags
  let mode = $state<'create' | 'edit' | 'delete'>('create');
  let enableDelete = $state(false);
  let isProcessing = $state(false);

  // Error handling
  let errorMessage = $state<string | undefined>();
  let validationError = $state<ZodError | undefined>();

  /**
   * Open create modal with a blank entry
   */
  const openCreate = () => {
    mode = 'create';
    currentEntry = getBlankEntry();
    enableDelete = false;
    errorMessage = undefined;
    validationError = undefined;
    createDialog?.showModal();
  };

  /**
   * Open edit modal with an existing entry
   */
  const openEdit = (entry: T) => {
    mode = 'edit';
    editingEntry = entry;
    currentEntry = { ...entry }; // Copy to avoid mutating original
    enableDelete = false;
    errorMessage = undefined;
    validationError = undefined;
    editDialog?.showModal();
  };


  /**
   * Open delete modal with an existing entry
   */
  const openDelete = (entry: T) => {
    mode = 'delete';
    editingEntry = entry;
    currentEntry = { ...entry };
    enableDelete = true;
    errorMessage = undefined;
    validationError = undefined;
    deleteDialog?.showModal();
  }

  /**
   * Save the current entry (create or update)
   * Returns true if successful, false if validation error occurred
   */
  const save = async (event?: Event): Promise<boolean> => {
    if (isProcessing) return false;

    // Clear previous errors
    errorMessage = undefined;
    validationError = undefined;
    isProcessing = true;

    try {
      if (mode === 'create') {
        let success = false;

        try {
          const data = await onCreate(currentEntry as N);

          success = true;

          onCreateSuccess?.(data);
          createDialog?.close();

          currentEntry = undefined;
          editingEntry = undefined;
          enableDelete = false;
        } catch (error: unknown) {
          event?.preventDefault();
          event?.stopPropagation();

          errorMessage = formatError(error);
          success = false;
        }

        return success;

      } else if (mode === 'edit' && editingEntry?.id !== undefined) {
        let success = false;

        try {
          const data = await onUpdate(editingEntry.id!, editingEntry);

          success = true;

          onUpdateSuccess?.(data);
          editDialog?.close();

          currentEntry = undefined;
          editingEntry = undefined;
          enableDelete = false;
        } catch (error: unknown) {
          event?.preventDefault();
          event?.stopPropagation();
          errorMessage = formatError(error);

          success = false;
        }

        return success;

      } else if (mode === 'delete' && editingEntry?.id !== undefined) {
        let success = false;

        try {
          const id = await onDelete(editingEntry.id);

          success = true;

          onDeleteSuccess?.(id);
          deleteDialog?.close();


          currentEntry = undefined;
          editingEntry = undefined;

          enableDelete = false;
        } catch (error: unknown) {
          event?.preventDefault();
          event?.stopPropagation();
          errorMessage = formatError(error);

          success = false;
        }

        return success;
      }

      return false;
    } finally {
      isProcessing = false;
    }
  };

  /**
   * Cancel and close the modal
   */
  const cancel = () => {
    createDialog?.close();
    editDialog?.close();
    deleteDialog?.close();

    currentEntry = undefined;
    editingEntry = undefined;
    enableDelete = false;
    errorMessage = undefined;
    validationError = undefined;
  };

  /**
   * Delete the current entry
   */
  const deleteEntry = async (event?: Event): Promise<boolean> => {
    if (isProcessing || !editingEntry?.id) return false;

    // Clear previous errors
    errorMessage = undefined;
    validationError = undefined;
    isProcessing = true;

    try {
      let success = false;

      const result = await onDelete(editingEntry.id, {
        onValidationError: (error) => {
          // Stop event propagation to prevent modal from closing
          event?.preventDefault();
          event?.stopPropagation();
          errorMessage = formatZodError(error);
          validationError = error;
        },
        onInvokeError: (error) => {
          // Stop event propagation to prevent modal from closing
          event?.preventDefault();
          event?.stopPropagation();
          errorMessage = formatInvokeError(error);
        },
        onSuccess: (id) => {
          success = true;
          onDeleteSuccess?.(id);
          editDialog?.close();
          deleteDialog?.close();

          // Reset state on success
          currentEntry = undefined;
          editingEntry = undefined;
          enableDelete = false;
        }
      });

      return success;
    } finally {
      isProcessing = false;
    }
  };

  /**
   * Enable delete mode (show delete confirmation)
   */
  const requestDelete = () => {
    enableDelete = true;
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    errorMessage = undefined;
    validationError = undefined;
  };

  return {
    // Dialog refs (bind these in your template)
    createDialog: {
      get value() { return createDialog; },
      set value(v: HTMLDialogElement | undefined) { createDialog = v; }
    },
    editDialog: {
      get value() { return editDialog; },
      set value(v: HTMLDialogElement | undefined) { editDialog = v; }
    },
    deleteDialog: {
      get value() { return deleteDialog; },
      set value(v: HTMLDialogElement | undefined) { deleteDialog = v }
    },

    // Current state
    get currentEntry() { return currentEntry; },
    set currentEntry(entry: T | N | undefined) { currentEntry = entry; },
    get mode() { return mode; },
    get enableDelete() { return enableDelete; },
    get isProcessing() { return isProcessing; },
    get isEditing() { return mode === 'edit'; },

    // Error state
    get errorMessage() { return errorMessage; },
    get validationError() { return validationError; },
    get hasError() { return errorMessage !== undefined; },

    // Actions
    openCreate,
    openEdit,
    openDelete,
    save,
    cancel,
    deleteEntry,
    requestDelete,
    clearError
  };
}
