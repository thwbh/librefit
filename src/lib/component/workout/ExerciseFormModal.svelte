<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, AlertType, AlertVariant, ModalDialog, ValidatedInput } from '@thwbh/veilchen';
	import { Trash } from 'phosphor-svelte';
	import ExerciseTagPicker from './ExerciseTagPicker.svelte';
	import {
		createExercise,
		updateExercise,
		deleteExercise,
		listExerciseCategories,
		listMuscles,
		createCommandHooks,
		type ExerciseCategory,
		type ExerciseDetail,
		type ExerciseInput,
		type Muscle
	} from '$lib/api';
	import { formatError } from '$lib/api/error-formatter';
	import { undoSnackbar } from '$lib/snackbar';

	// Full add/edit screen for a user exercise (WO-029, WO-030, WO-035) per
	// `_conv-modals` / `_conv-validation`. The path that supplies complete metadata:
	// supplying a real category + at least one muscle promotes an unverified Ghost to
	// verified (the backend recomputes `verified`). Seeded exercises never reach here
	// — the picker disables their edit/delete (WO-028). Delete (WO-031/WO-032) follows
	// the cross-app trash-toggle pattern: a header trash flips the footer Save into a
	// red Delete (mirrors IntakeModal), and the referenced-exercise guard surfaces
	// in-modal per `_conv-user-errors`.
	interface Props {
		mode: 'create' | 'edit';
		/** edit: the user exercise being edited (may be an unverified Ghost). */
		detail?: ExerciseDetail | null;
		/** Open straight into the delete-confirm view (edit mode), e.g. a swipe-right. */
		startInDelete?: boolean;
		onsaved: (detail: ExerciseDetail) => void;
		ondeleted?: (id: number) => void;
		onclose: () => void;
	}

	let { mode, detail = null, startInDelete = false, onsaved, ondeleted, onclose }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

	// The `uncategorized` sentinel parks Ghosts; it's never a real, selectable
	// category, so a full save must pick a real one to verify.
	const UNCATEGORIZED = 'uncategorized';

	let categories = $state<ExerciseCategory[]>([]);
	let muscles = $state<Muscle[]>([]);

	// Pre-fill once from the prop (MOD-001); the modal is remounted per exercise by the
	// parent, so capturing the initial value (not tracking the prop) is intentional.
	let name = $state(untrack(() => detail?.name ?? ''));
	let category = $state(
		untrack(() => (detail && detail.category !== UNCATEGORIZED ? detail.category : ''))
	);
	// `ValidatedInput` binds `string | number`; '' represents "no rest set".
	let restInput = $state<string | number>(untrack(() => detail?.defaultRestSeconds ?? ''));
	// shortvalue -> role for selected muscles; absence = not targeted.
	let roles = $state<Record<string, 'primary' | 'secondary'>>(
		untrack(() =>
			Object.fromEntries(
				(detail?.muscles ?? []).map((m) => [
					m.muscle,
					m.role === 'secondary' ? 'secondary' : 'primary'
				])
			)
		)
	);

	let error = $state<string | null>(null);
	let busy = $state(false);
	let confirmingDelete = $state(untrack(() => mode === 'edit' && startInDelete));

	$effect(() => {
		if (categories.length === 0) listExerciseCategories().then((c) => (categories = c));
		if (muscles.length === 0) listMuscles().then((m) => (muscles = m));
	});

	// The modal renders as a delete-confirm view once the header trash is toggled on;
	// the title and the footer's primary button follow that view (like IntakeModal).
	const isDeleteView = $derived(mode === 'edit' && confirmingDelete);
	const heading = $derived(
		isDeleteView ? 'Delete Exercise' : mode === 'create' ? 'Add Exercise' : 'Edit Exercise'
	);
	const selectedCount = $derived(Object.keys(roles).length);

	function buildInput(): ExerciseInput {
		const rest = restInput === '' ? undefined : Number(restInput);
		return {
			name: name.trim(),
			category,
			defaultRestSeconds: Number.isFinite(rest) ? rest : undefined,
			muscles: Object.entries(roles).map(([muscle, role]) => ({ muscle, role }))
		};
	}

	// A failing operation keeps the modal open, so its message must render *inside* the
	// modal: a layout-level toast would sit behind the dialog backdrop. Success closes
	// the modal, so the success toast (visible afterwards) stays on the hooks.
	const okHooks = (successMessage: string) =>
		createCommandHooks({ successMessage, showInvokeErrors: false, showValidationErrors: false });

	async function save() {
		if (busy) return;
		// Inline guard mirroring `_conv-validation` (the backend still enforces these);
		// gives immediate feedback before the round-trip.
		if (!name.trim()) return (error = 'A name is required.');
		if (!category) return (error = 'Pick a category.');
		if (selectedCount === 0) return (error = 'Select at least one muscle.');
		error = null;
		busy = true;
		try {
			const input = buildInput();
			const result =
				mode === 'create'
					? await createExercise({ input }, okHooks('Exercise created successfully'))
					: await updateExercise(
							{ id: detail!.id, input },
							okHooks('Exercise updated successfully')
						);
			onsaved(result);
			onclose();
		} catch (e) {
			error = formatError(e);
		} finally {
			busy = false;
		}
	}

	// Acts as a toggle: enter delete-confirm if editing, exit back if already in it.
	function toggleDelete() {
		error = null;
		confirmingDelete = !confirmingDelete;
	}

	// The exercise's own data, so an undo can recreate it faithfully (a ghost stays a
	// ghost). Only unreferenced exercises are deletable (WO-032), so the recreated row
	// carries no orphaned set references — just a new id.
	function detailToInput(d: ExerciseDetail): ExerciseInput {
		return {
			name: d.name,
			category: d.category,
			defaultRestSeconds: d.defaultRestSeconds ?? undefined,
			muscles: d.muscles.map((m) => ({ muscle: m.muscle, role: m.role }))
		};
	}

	async function confirmDelete() {
		if (busy || !detail) return;
		error = null;
		busy = true;
		const removed = detail;
		try {
			// Silent hooks: the post-close Undo snackbar replaces the success toast.
			await deleteExercise(
				{ id: removed.id },
				createCommandHooks({ showInvokeErrors: false, showValidationErrors: false })
			);
			ondeleted?.(removed.id);
			onclose();
			undoSnackbar(`Deleted “${removed.name}”.`, () => restoreDeleted(removed));
		} catch (e) {
			// The backend refuses when a logged set references it (WO-032); surface that
			// in-modal per `_conv-user-errors`, leaving the exercise and its refs intact.
			error = formatError(e);
			confirmingDelete = false;
		} finally {
			busy = false;
		}
	}

	async function restoreDeleted(removed: ExerciseDetail) {
		try {
			const recreated = await createExercise(
				{ input: detailToInput(removed) },
				createCommandHooks({ showInvokeErrors: false, showValidationErrors: false })
			);
			// Reuse the saved path so the parent list/indicator picks the exercise back up.
			onsaved(recreated);
		} catch {
			// Best-effort restore; the originating modal is already gone (ERR-003).
		}
	}
</script>

<div class="exercise-form-modal">
	<ModalDialog bind:dialog oncancel={onclose}>
		{#snippet title()}
			<span class="modal-header border-l-4 border-accent pl-2">{heading}</span>
			{#if mode === 'edit'}
				<button
					class="btn btn-xs btn-error"
					aria-label="Delete exercise"
					aria-pressed={isDeleteView}
					disabled={busy}
					onclick={toggleDelete}
					data-testid="delete-exercise"
				>
					<Trash size="1rem" />
				</button>
			{/if}
		{/snippet}

		{#snippet content()}
			<div class="flex flex-col gap-3">
				{#if isDeleteView}
					<p class="text-sm" data-testid="delete-confirm-text">
						Delete “{detail?.name}”? This can't be undone.
					</p>
				{:else}
					<ValidatedInput
						label="Name"
						type="text"
						placeholder="e.g. Bulgarian Split Squat"
						maxlength={80}
						required
						bind:value={name}
						data-testid="exercise-name"
					>
						A name is required (up to 80 characters).
					</ValidatedInput>

					<ExerciseTagPicker {categories} {muscles} bind:category bind:roles />

					<ValidatedInput
						label="Default rest (seconds, optional)"
						type="number"
						min={0}
						placeholder="e.g. 90"
						bind:value={restInput}
						data-testid="exercise-rest"
					/>
				{/if}

				{#if error}
					<AlertBox type={AlertType.Error} variant={AlertVariant.Box}>{error}</AlertBox>
				{/if}
			</div>
		{/snippet}

		{#snippet footer()}
			<button class="btn btn-ghost" disabled={busy} onclick={onclose}>Cancel</button>
			{#if isDeleteView}
				<button
					class="btn btn-error"
					disabled={busy}
					onclick={confirmDelete}
					data-testid="confirm-delete"
				>
					Delete
				</button>
			{:else}
				<button class="btn btn-primary" disabled={busy} onclick={save} data-testid="save-exercise">
					{mode === 'create' ? 'Create' : 'Save'}
				</button>
			{/if}
		{/snippet}
	</ModalDialog>
</div>
