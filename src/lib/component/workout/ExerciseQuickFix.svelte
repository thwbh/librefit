<script lang="ts">
	import { AlertBox, AlertType, AlertVariant, ModalDialog, EmptyState } from '@thwbh/veilchen';
	import { Pencil, Sparkle } from 'phosphor-svelte';
	import ExerciseFormModal from './ExerciseFormModal.svelte';
	import ExerciseTagPicker from './ExerciseTagPicker.svelte';
	import {
		listUnverifiedExercises,
		batchTagExercises,
		undoBatchTag,
		listExerciseCategories,
		listMuscles,
		createCommandHooks,
		type BatchTag,
		type BatchTagResult,
		type ExerciseCategory,
		type ExerciseDetail,
		type Muscle
	} from '$lib/api';
	import { formatError } from '$lib/api/error-formatter';
	import { undoSnackbar } from '$lib/snackbar';

	// Batch-tagging tidy-up workspace (WO-041, WO-042, WO-043). Lists the user's
	// unverified "Ghost" exercises; the user multi-selects, then stages a category
	// and/or several muscle roles via the shared picker. Tapping Done commits the whole
	// staged set to the selection in one call and closes — surfacing a bottom snackbar
	// with Undo (WO-042) once the dialog is gone (a snackbar would otherwise sit behind
	// the backdrop). Edit-only: a row's pencil opens the full edit/delete screen
	// (WO-030..032). Entered from the dashboard avatar indicator (DH-022).
	interface Props {
		onclose: () => void;
		/** Called after any change so the dashboard can refresh its indicator count. */
		onchanged?: () => void;
	}

	let { onclose, onchanged }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

	const UNCATEGORIZED = 'uncategorized';

	let entries = $state<ExerciseDetail[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let categories = $state<ExerciseCategory[]>([]);
	let muscles = $state<Muscle[]>([]);

	// Selection + the staged (not-yet-applied) tags.
	let selected = $state<Set<number>>(new Set());
	let category = $state('');
	let roles = $state<Record<string, 'primary' | 'secondary'>>({});
	let applying = $state(false);

	// Single-exercise full edit (the pencil); no create here — this is tidy-up only.
	let editing = $state<ExerciseDetail | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			entries = await listUnverifiedExercises();
			// Drop any selections that are no longer unverified.
			selected = new Set([...selected].filter((id) => entries.some((e) => e.id === id)));
		} catch (e) {
			error = formatError(e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (categories.length === 0) listExerciseCategories().then((c) => (categories = c));
		if (muscles.length === 0) listMuscles().then((m) => (muscles = m));
	});

	$effect(() => {
		void load();
	});

	const pretty = (s: string) => s.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
	const selectedCount = $derived(selected.size);
	// The staged category + muscle roles flattened into the batch contract.
	const stagedTags = $derived.by<BatchTag[]>(() => {
		const tags: BatchTag[] = [];
		if (category) tags.push({ kind: 'category', value: category });
		for (const [muscle, role] of Object.entries(roles)) {
			tags.push({ kind: 'muscle', value: muscle, role });
		}
		return tags;
	});

	function toggle(id: number) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	const hooks = () => createCommandHooks({ showInvokeErrors: false, showValidationErrors: false });

	// Done applies the staged tags to the selection, then closes and offers an Undo
	// via the post-close snackbar. With nothing staged it just closes.
	async function done() {
		if (applying) return;
		if (selectedCount === 0 || stagedTags.length === 0) {
			onclose();
			return;
		}
		const exerciseIds = [...selected];
		const tags = stagedTags;
		error = null;
		applying = true;
		try {
			const result = await batchTagExercises({ input: { exerciseIds, tags } }, hooks());
			onchanged?.();
			onclose();
			const n = result.items.length;
			undoSnackbar(`Tagged ${n} exercise${n === 1 ? '' : 's'}.`, () => revert(result));
		} catch (e) {
			error = formatError(e);
		} finally {
			applying = false;
		}
	}

	async function revert(result: BatchTagResult) {
		try {
			await undoBatchTag({ result }, hooks());
			onchanged?.();
		} catch {
			// Best-effort undo; the originating modal is already gone (ERR-003).
		}
	}

	function onFormSaved() {
		editing = null;
		load();
		onchanged?.();
	}

	function onFormDeleted() {
		editing = null;
		load();
		onchanged?.();
	}
</script>

<div class="quick-fix-modal">
	<ModalDialog bind:dialog oncancel={onclose}>
		{#snippet title()}
			<span class="border-l-4 border-accent pl-2">Tidy up exercises</span>
		{/snippet}

		{#snippet content()}
			<div class="flex flex-col gap-3">
				{#if error}
					<AlertBox type={AlertType.Error} variant={AlertVariant.Box}>{error}</AlertBox>
				{/if}

				{#if loading}
					<span class="loading loading-spinner self-center"></span>
				{:else if entries.length === 0}
					<!-- Nothing-to-verify empty state (WO-043 / `_conv-empty-states`). -->
					<div data-testid="quick-fix-empty">
						<EmptyState
							title="All caught up"
							description="Every exercise in your library is fully tagged. New ones you add mid-workout will show up here to tidy."
						>
							{#snippet icon()}
								<Sparkle size="2.5rem" weight="duotone" class="text-success" />
							{/snippet}
						</EmptyState>
					</div>
				{:else}
					<p class="text-sm opacity-60">
						Select exercises, choose a category and muscles, then tap Done.
					</p>
					<ul class="flex flex-col gap-1" data-testid="unverified-list">
						{#each entries as entry (entry.id)}
							{@const checked = selected.has(entry.id)}
							<li
								class="flex items-center gap-2 rounded-box border border-base-200 p-2 {checked
									? 'bg-primary/10'
									: ''}"
							>
								<label class="flex flex-1 cursor-pointer items-center gap-3">
									<input
										type="checkbox"
										class="checkbox checkbox-sm"
										{checked}
										onchange={() => toggle(entry.id)}
										aria-label={`Select ${entry.name}`}
									/>
									<span class="flex flex-col items-start">
										<span class="font-medium">{entry.name}</span>
										<span class="text-xs opacity-60">
											{entry.category === UNCATEGORIZED ? 'Uncategorized' : pretty(entry.category)}
											{#if entry.muscles.length > 0}
												· {entry.muscles.map((m) => pretty(m.muscle)).join(', ')}
											{/if}
										</span>
									</span>
								</label>
								<button
									class="btn btn-ghost btn-xs"
									aria-label={`Edit ${entry.name}`}
									onclick={() => (editing = entry)}
								>
									<Pencil size="1rem" />
								</button>
							</li>
						{/each}
					</ul>

					{#if selectedCount > 0}
						<!-- Contextual tag bar (WO-041): stage a category and/or muscles for the
						     whole selection; committed only when the footer Done is tapped. -->
						<div
							class="sticky bottom-0 flex flex-col gap-2 rounded-box bg-base-200 p-3"
							data-testid="tag-bar"
						>
							<span class="text-sm font-medium">Tag {selectedCount} selected</span>
							<ExerciseTagPicker {categories} {muscles} bind:category bind:roles />
						</div>
					{/if}
				{/if}
			</div>
		{/snippet}

		{#snippet footer()}
			<button class="btn btn-ghost" onclick={onclose} data-testid="quick-fix-cancel">Cancel</button>
			<button
				class="btn btn-primary"
				disabled={applying}
				onclick={done}
				data-testid="quick-fix-done"
			>
				Done
			</button>
		{/snippet}
	</ModalDialog>
</div>

{#if editing}
	<ExerciseFormModal
		mode="edit"
		detail={editing}
		onsaved={onFormSaved}
		ondeleted={onFormDeleted}
		onclose={() => (editing = null)}
	/>
{/if}
