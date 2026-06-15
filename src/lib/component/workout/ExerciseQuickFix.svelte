<script lang="ts">
	import { AlertBox, AlertType, AlertVariant, ModalDialog, EmptyState } from '@thwbh/veilchen';
	import { Pencil, Plus, Sparkle } from 'phosphor-svelte';
	import ExerciseFormModal from './ExerciseFormModal.svelte';
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

	// Batch-tagging quick-fix workspace (WO-041, WO-042, WO-043). Lists the user's
	// unverified "Ghost" exercises; the user multi-selects, *stages* one category or
	// muscle tag, then commits it to the whole selection with an explicit Apply — so
	// nothing changes under the user's feet (the same deliberate footer-driven flow as
	// the post-workout editor). The result is reversible via an in-modal Undo, and all
	// feedback renders *inside* the modal (a layout toast/snackbar would sit behind the
	// dialog backdrop). Doubles as the library-maintenance surface: a row's full
	// edit/delete opens the add/edit screen (WO-030..032), and a blank exercise can be
	// created here (WO-029). Entered from the dashboard avatar indicator (DH-022).
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

	// Selection + the staged (not-yet-applied) tag.
	let selected = $state<Set<number>>(new Set());
	let muscleValue = $state('');
	let muscleRole = $state<'primary' | 'secondary'>('primary');
	let stagedTag = $state<BatchTag | null>(null);
	let applying = $state(false);

	// Outcome of the last apply, kept for Undo + the in-modal confirmation.
	let lastResult = $state<BatchTagResult | null>(null);
	let feedback = $state<string | null>(null);

	// Single-exercise full edit / create.
	let editing = $state<ExerciseDetail | null>(null);
	let creating = $state(false);

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
	const stagedLabel = $derived.by(() => {
		if (!stagedTag) return null;
		if (stagedTag.kind === 'category')
			return (
				categories.find((c) => c.shortvalue === stagedTag!.value)?.longvalue ?? stagedTag.value
			);
		const m =
			muscles.find((mm) => mm.shortvalue === stagedTag!.value)?.longvalue ?? stagedTag.value;
		return `${m} (${stagedTag.role === 'secondary' ? '2°' : '1°'})`;
	});

	function toggle(id: number) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	// Staging is a local choice; nothing hits the backend until Apply.
	function stageCategory(shortvalue: string) {
		muscleValue = '';
		stagedTag =
			stagedTag?.kind === 'category' && stagedTag.value === shortvalue
				? null
				: { kind: 'category', value: shortvalue };
	}

	function stageMuscle() {
		stagedTag = muscleValue
			? { kind: 'muscle', value: muscleValue, role: muscleRole }
			: stagedTag?.kind === 'muscle'
				? null
				: stagedTag;
	}

	async function applyStaged() {
		if (!stagedTag || applying || selected.size === 0) return;
		const exerciseIds = [...selected];
		const tag = stagedTag;
		error = null;
		applying = true;
		try {
			const result = await batchTagExercises(
				{ input: { exerciseIds, tag } },
				createCommandHooks({ showInvokeErrors: false, showValidationErrors: false })
			);
			lastResult = result;
			feedback = `Tagged ${result.items.length} exercise${result.items.length === 1 ? '' : 's'}.`;
			selected = new Set();
			stagedTag = null;
			muscleValue = '';
			await load();
			onchanged?.();
		} catch (e) {
			error = formatError(e);
		} finally {
			applying = false;
		}
	}

	async function undo() {
		if (!lastResult || applying) return;
		const result = lastResult;
		error = null;
		applying = true;
		try {
			await undoBatchTag(
				{ result },
				createCommandHooks({ showInvokeErrors: false, showValidationErrors: false })
			);
			feedback = null;
			lastResult = null;
			await load();
			onchanged?.();
		} catch (e) {
			error = formatError(e);
		} finally {
			applying = false;
		}
	}

	function onFormSaved() {
		editing = null;
		creating = false;
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
				{#if feedback}
					<AlertBox type={AlertType.Success} variant={AlertVariant.Box}>
						<span class="flex-1">{feedback}</span>
						<button class="btn btn-sm btn-ghost" onclick={undo} data-testid="undo-tag">Undo</button>
					</AlertBox>
				{/if}
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
						Select exercises, choose a category or muscle, then tap Apply.
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
						<!-- Contextual tag bar (WO-041): stage one tag for the whole selection;
						     it's committed only when the footer Apply is tapped. -->
						<div
							class="sticky bottom-0 flex flex-col gap-2 rounded-box bg-base-200 p-3"
							data-testid="tag-bar"
						>
							<span class="text-sm font-medium">
								Tag {selectedCount} selected
								{#if stagedLabel}· <span class="text-primary">{stagedLabel}</span>{/if}
							</span>
							<div class="flex flex-wrap gap-1">
								{#each categories as c (c.shortvalue)}
									{#if c.shortvalue !== UNCATEGORIZED}
										<button
											class="btn btn-xs {stagedTag?.kind === 'category' &&
											stagedTag.value === c.shortvalue
												? 'btn-primary'
												: 'btn-outline'}"
											onclick={() => stageCategory(c.shortvalue)}
											data-testid="tag-category"
										>
											{c.longvalue}
										</button>
									{/if}
								{/each}
							</div>
							<div class="flex items-center gap-2">
								<select
									class="select select-bordered select-sm flex-1"
									bind:value={muscleValue}
									onchange={stageMuscle}
									aria-label="Muscle to add"
								>
									<option value="">Add a muscle…</option>
									{#each muscles as m (m.shortvalue)}
										<option value={m.shortvalue}>{m.longvalue}</option>
									{/each}
								</select>
								<div class="join">
									<button
										class="btn btn-xs join-item {muscleRole === 'primary' ? 'btn-primary' : ''}"
										onclick={() => {
											muscleRole = 'primary';
											stageMuscle();
										}}>1°</button
									>
									<button
										class="btn btn-xs join-item {muscleRole === 'secondary' ? 'btn-primary' : ''}"
										onclick={() => {
											muscleRole = 'secondary';
											stageMuscle();
										}}>2°</button
									>
								</div>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		{/snippet}

		{#snippet footer()}
			<button class="btn btn-ghost" onclick={() => (creating = true)} data-testid="add-exercise">
				<Plus size="1.25rem" /> Add
			</button>
			{#if selectedCount > 0 && stagedTag}
				<button
					class="btn btn-primary"
					disabled={applying}
					onclick={applyStaged}
					data-testid="apply-tag"
				>
					Apply
				</button>
			{:else}
				<button class="btn btn-primary" onclick={onclose}>Done</button>
			{/if}
		{/snippet}
	</ModalDialog>
</div>

{#if creating}
	<ExerciseFormModal mode="create" onsaved={onFormSaved} onclose={() => (creating = false)} />
{/if}
{#if editing}
	<ExerciseFormModal
		mode="edit"
		detail={editing}
		onsaved={onFormSaved}
		ondeleted={onFormDeleted}
		onclose={() => (editing = null)}
	/>
{/if}
