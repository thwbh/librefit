<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, AlertType, AlertVariant, ModalDialog } from '@thwbh/veilchen';
	import { Trash } from 'phosphor-svelte';
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

	// Full add/edit screen for a user exercise (WO-029, WO-030, WO-035) per
	// `_conv-modals` / `_conv-validation`. The path that supplies complete metadata:
	// supplying a real category + at least one muscle promotes an unverified Ghost to
	// verified (the backend recomputes `verified`). Seeded exercises never reach here
	// — the picker disables their edit/delete (WO-028). Delete (WO-031/WO-032) lives
	// in edit mode and surfaces the referenced-exercise guard per `_conv-user-errors`.
	interface Props {
		mode: 'create' | 'edit';
		/** edit: the user exercise being edited (may be an unverified Ghost). */
		detail?: ExerciseDetail | null;
		onsaved: (detail: ExerciseDetail) => void;
		ondeleted?: (id: number) => void;
		onclose: () => void;
	}

	let { mode, detail = null, onsaved, ondeleted, onclose }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

	// The `uncategorized` sentinel parks Ghosts; it's never a real, selectable
	// category, so it's filtered out of the picker (a full save must verify).
	const UNCATEGORIZED = 'uncategorized';

	let categories = $state<ExerciseCategory[]>([]);
	let muscles = $state<Muscle[]>([]);

	// Pre-fill once from the prop (MOD-001); the modal is remounted per exercise by the
	// parent, so capturing the initial value (not tracking the prop) is intentional.
	let name = $state(untrack(() => detail?.name ?? ''));
	let category = $state(
		untrack(() => (detail && detail.category !== UNCATEGORIZED ? detail.category : ''))
	);
	let restSeconds = $state<number | null>(untrack(() => detail?.defaultRestSeconds ?? null));
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
	let confirmingDelete = $state(false);

	$effect(() => {
		if (categories.length === 0) listExerciseCategories().then((c) => (categories = c));
		if (muscles.length === 0) listMuscles().then((m) => (muscles = m));
	});

	const heading = $derived(mode === 'create' ? 'Add Exercise' : 'Edit Exercise');
	const selectedCount = $derived(Object.keys(roles).length);
	const pretty = (s: string) => s.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

	// Cycle a muscle Off → Primary → Secondary → Off.
	function cycleMuscle(shortvalue: string) {
		const cur = roles[shortvalue];
		if (cur === undefined) roles = { ...roles, [shortvalue]: 'primary' };
		else if (cur === 'primary') roles = { ...roles, [shortvalue]: 'secondary' };
		else {
			const { [shortvalue]: _removed, ...rest } = roles;
			roles = rest;
		}
	}

	function buildInput(): ExerciseInput {
		return {
			name: name.trim(),
			category,
			defaultRestSeconds: restSeconds ?? undefined,
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

	async function confirmDelete() {
		if (busy || !detail) return;
		error = null;
		busy = true;
		try {
			await deleteExercise({ id: detail.id }, okHooks('Exercise deleted'));
			ondeleted?.(detail.id);
			onclose();
		} catch (e) {
			// The backend refuses when a logged set references it (WO-032); surface that
			// in-modal per `_conv-user-errors`, leaving the exercise and its refs intact.
			error = formatError(e);
			confirmingDelete = false;
		} finally {
			busy = false;
		}
	}
</script>

<div class="exercise-form-modal">
	<ModalDialog bind:dialog oncancel={onclose}>
		{#snippet title()}
			<span class="border-l-4 border-accent pl-2">{heading}</span>
		{/snippet}

		{#snippet content()}
			<div class="flex flex-col gap-4">
				<label class="floating-label">
					<span>Name</span>
					<input
						class="input input-bordered w-full"
						placeholder="e.g. Bulgarian Split Squat"
						maxlength="80"
						bind:value={name}
						data-testid="exercise-name"
					/>
				</label>

				<label class="floating-label">
					<span>Category</span>
					<select
						class="select select-bordered w-full"
						bind:value={category}
						data-testid="exercise-category"
					>
						<option value="" disabled>Select a category</option>
						{#each categories as c (c.shortvalue)}
							{#if c.shortvalue !== UNCATEGORIZED}
								<option value={c.shortvalue}>{c.longvalue}</option>
							{/if}
						{/each}
					</select>
				</label>

				<div class="flex flex-col gap-1">
					<span class="text-sm font-medium">Muscles</span>
					<p class="text-xs opacity-60">
						Tap to cycle off → primary → secondary. Selected: {selectedCount}
					</p>
					<ul class="flex max-h-56 flex-col gap-1 overflow-y-auto" data-testid="muscle-list">
						{#each muscles as muscle (muscle.shortvalue)}
							{@const role = roles[muscle.shortvalue]}
							<li>
								<button
									type="button"
									class="btn btn-sm btn-block justify-between {role ? 'btn-primary' : 'btn-ghost'}"
									aria-pressed={role !== undefined}
									onclick={() => cycleMuscle(muscle.shortvalue)}
								>
									<span>{muscle.longvalue}</span>
									{#if role}
										<span class="badge badge-sm" data-testid="muscle-role">
											{role === 'primary' ? '1° Primary' : '2° Secondary'}
										</span>
									{/if}
								</button>
							</li>
						{/each}
					</ul>
				</div>

				<label class="floating-label">
					<span>Default rest (seconds, optional)</span>
					<input
						type="number"
						min="0"
						class="input input-bordered w-full"
						placeholder="e.g. 90"
						bind:value={restSeconds}
						data-testid="exercise-rest"
					/>
				</label>

				{#if error}
					<AlertBox type={AlertType.Error} variant={AlertVariant.Box}>{error}</AlertBox>
				{/if}

				{#if mode === 'edit'}
					{#if confirmingDelete}
						<div class="rounded-box border border-error/40 bg-error/10 p-3">
							<p class="mb-2 text-sm">Delete “{detail?.name}”? This can't be undone.</p>
							<div class="flex justify-end gap-2">
								<button
									class="btn btn-ghost btn-sm"
									disabled={busy}
									onclick={() => (confirmingDelete = false)}
								>
									Keep
								</button>
								<button
									class="btn btn-error btn-sm"
									disabled={busy}
									onclick={confirmDelete}
									data-testid="confirm-delete"
								>
									Delete
								</button>
							</div>
						</div>
					{:else}
						<button
							class="btn btn-ghost btn-sm self-start text-error"
							disabled={busy}
							onclick={() => (confirmingDelete = true)}
							data-testid="delete-exercise"
						>
							<Trash size="1rem" /> Delete exercise
						</button>
					{/if}
				{/if}
			</div>
		{/snippet}

		{#snippet footer()}
			<button class="btn btn-ghost" disabled={busy} onclick={onclose}>Cancel</button>
			<button class="btn btn-primary" disabled={busy} onclick={save} data-testid="save-exercise">
				{mode === 'create' ? 'Create' : 'Save'}
			</button>
		{/snippet}
	</ModalDialog>
</div>
