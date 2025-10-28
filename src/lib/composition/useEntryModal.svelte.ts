/**
 * Reusable composition for managing CRUD modals (Create, Edit, Delete)
 *
 * This hook encapsulates the common pattern of managing entry modals with
 * create, edit, and delete operations. It handles all the state management
 * and provides clean callbacks for the actual API operations.
 *
 * @example
 * ```typescript
 * const modal = useEntryModal<CalorieTracker, NewCalorieTracker>({
 *   onCreate: async (entry) => await createCalorieTrackerEntry({ newEntry: entry }),
 *   onUpdate: async (id, entry) => await updateCalorieTrackerEntry({ trackerId: id, updatedEntry: entry }),
 *   onDelete: async (id) => { await deleteCalorieTrackerEntry({ trackerId: id }); },
 *   getBlankEntry: () => ({ added: '2024-01-01', amount: 0, category: 'l', description: '' })
 * });
 *
 * // In template:
 * <button onclick={modal.openCreate}>Add Entry</button>
 * <ModalDialog bind:dialog={modal.createDialog} onconfirm={modal.save} oncancel={modal.cancel}>
 *   <CalorieTrackerMask bind:entry={modal.currentEntry} isEditing={true} />
 * </ModalDialog>
 * ```
 */

export interface UseEntryModalOptions<T extends { id?: number }, N = T> {
  /** Called when creating a new entry */
  onCreate: (entry: N) => Promise<T>;
  /** Called when updating an existing entry */
  onUpdate: (id: number, entry: T) => Promise<T>;
  /** Called when deleting an entry */
  onDelete: (id: number) => Promise<number>;
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

  /**
   * Open create modal with a blank entry
   */
  const openCreate = () => {
    mode = 'create';
    currentEntry = getBlankEntry();
    enableDelete = false;
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
    deleteDialog?.showModal();
  }

  /**
   * Save the current entry (create or update)
   */
  const save = async () => {
    if (isProcessing) return;

    isProcessing = true;

    try {
      if (mode === 'create') {
        const created = await onCreate(currentEntry as N);
        onCreateSuccess?.(created);
        createDialog?.close();
      } else if (mode === 'edit' && editingEntry?.id !== undefined) {
        const updated = await onUpdate(editingEntry.id, currentEntry as T);
        onUpdateSuccess?.(updated);
        editDialog?.close();
      } else if (mode === 'delete' && editingEntry?.id !== undefined) {
        const deleted = await onDelete(editingEntry.id);
        onDeleteSuccess?.(deleted);
        deleteDialog?.close();
      }

      // Reset state
      currentEntry = undefined;
      editingEntry = undefined;
      enableDelete = false;
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
  };

  /**
   * Delete the current entry
   */
  const deleteEntry = async () => {
    if (isProcessing || !editingEntry?.id) return;

    isProcessing = true;

    try {
      await onDelete(editingEntry.id);
      onDeleteSuccess?.(editingEntry.id);
      editDialog?.close();
      deleteDialog?.close();

      currentEntry = undefined;
      editingEntry = undefined;
      enableDelete = false;
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

    // Actions
    openCreate,
    openEdit,
    openDelete,
    save,
    cancel,
    deleteEntry,
    requestDelete
  };
}
