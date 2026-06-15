<script lang="ts">
	import { onMount } from 'svelte';
	import { EmptyState } from '@thwbh/veilchen';
	import { Barbell, Pencil, Plus } from 'phosphor-svelte';
	import { getExerciseLibrary, type ExerciseDetail } from '$lib/api';
	import ExerciseFormModal from '$lib/component/workout/ExerciseFormModal.svelte';

	// Dedicated exercise-library management screen. The picker and quick-fix cover
	// selection and unverified clean-up; this is the one place to browse, edit, and
	// delete *all* user-created exercises (verified or not) — seeded rows are read-only
	// and intentionally excluded (WO-028, WO-030, WO-031). Reached from Settings.
	let library = $state<ExerciseDetail[]>([]);
	let loading = $state(true);

	let editing = $state<ExerciseDetail | null>(null);
	let creating = $state(false);

	const userExercises = $derived(library.filter((e) => !e.seeded));
	const pretty = (s: string) => s.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

	async function load() {
		loading = true;
		try {
			library = await getExerciseLibrary();
		} catch {
			// Background fetch — keep the last-known state (ERR-003).
		} finally {
			loading = false;
		}
	}

	function onSaved() {
		editing = null;
		creating = false;
		load();
	}

	function onDeleted() {
		editing = null;
		load();
	}

	onMount(load);
</script>

<svelte:head>
	<title>Exercises</title>
</svelte:head>

<div class="flex flex-col overflow-x-hidden">
	<h1 class="sr-only">Manage exercises</h1>

	<!-- Branded header, matching the other settings sub-screens. -->
	<div class="bg-primary text-primary-content px-6 pb-14 safe-top">
		<div class="flex items-center gap-3">
			<Barbell size="1.75rem" weight="bold" />
			<div class="flex flex-col gap-1">
				<span class="text-3xl font-bold">Exercises</span>
				<span class="text-sm opacity-70">Your custom exercises</span>
			</div>
		</div>
	</div>

	<div class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 flex flex-col gap-4 p-4 pt-6">
		<button class="btn btn-primary" onclick={() => (creating = true)} data-testid="add-exercise">
			<Plus size="1.25rem" /> Add exercise
		</button>

		{#if loading}
			<span class="loading loading-spinner self-center"></span>
		{:else if userExercises.length === 0}
			<EmptyState
				title="No custom exercises yet"
				description="Exercises you add — here or mid-workout — show up in this list to edit or remove. Seeded exercises are built in and can't be changed."
			>
				{#snippet icon()}
					<Barbell size="2.5rem" weight="duotone" class="text-primary" />
				{/snippet}
			</EmptyState>
		{:else}
			<ul class="flex flex-col gap-1" data-testid="exercise-list">
				{#each userExercises as entry (entry.id)}
					<li class="flex items-center gap-2 rounded-box border border-base-200 p-3">
						<span class="flex flex-1 flex-col items-start">
							<span class="flex items-center gap-2 font-medium">
								{entry.name}
								{#if !entry.verified}
									<span class="badge badge-ghost badge-sm" data-testid="unverified-badge">New</span>
								{/if}
							</span>
							<span class="text-xs opacity-60">
								{entry.category === 'uncategorized' ? 'Uncategorized' : pretty(entry.category)}
								{#if entry.muscles.length > 0}
									· {entry.muscles.map((m) => pretty(m.muscle)).join(', ')}
								{/if}
							</span>
						</span>
						<button
							class="btn btn-ghost btn-sm"
							aria-label={`Edit ${entry.name}`}
							onclick={() => (editing = entry)}
						>
							<Pencil size="1.125rem" />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

{#if creating}
	<ExerciseFormModal mode="create" onsaved={onSaved} onclose={() => (creating = false)} />
{/if}
{#if editing}
	<ExerciseFormModal
		mode="edit"
		detail={editing}
		onsaved={onSaved}
		ondeleted={onDeleted}
		onclose={() => (editing = null)}
	/>
{/if}
