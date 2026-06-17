<script lang="ts">
	import { onMount } from 'svelte';
	import { EmptyState, SearchBar, SwipeableListItem } from '@thwbh/veilchen';
	import { Barbell, Pencil, Plus, Trash } from 'phosphor-svelte';
	import { getExerciseLibrary, type ExerciseDetail } from '$lib/api';
	import ExerciseFormModal from '$lib/component/workout/ExerciseFormModal.svelte';
	import { longpress } from '$lib/gesture/long-press';

	// Dedicated exercise-library management screen, laid out like the workout picker:
	// a search bar filters the list, and a floating action button (the dashboard FAB
	// pattern) opens the add screen. The picker and quick-fix cover selection and
	// unverified clean-up; this is the one place to browse, edit, and delete *all*
	// user-created exercises (verified or not) — seeded rows are read-only and
	// intentionally excluded (WO-028, WO-030, WO-031). Reached from Settings.
	let library = $state<ExerciseDetail[]>([]);
	let loading = $state(true);
	let query = $state('');

	let editing = $state<ExerciseDetail | null>(null);
	// When set with `editing`, the edit modal opens straight into its delete-confirm
	// view (swipe-right), mirroring the intake/workout delete gesture.
	let editingDelete = $state(false);
	let creating = $state(false);

	function editExercise(entry: ExerciseDetail) {
		editingDelete = false;
		editing = entry;
	}
	function deleteExerciseRow(entry: ExerciseDetail) {
		editingDelete = true;
		editing = entry;
	}

	const userExercises = $derived(library.filter((e) => !e.seeded));
	const pretty = (s: string) => s.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

	// Filter by name / category / muscle as the user types (same fields the picker
	// searches); empty query shows the whole list.
	const q = $derived(query.trim().toLowerCase());
	const filtered = $derived(
		q
			? userExercises.filter(
					(e) =>
						e.name.toLowerCase().includes(q) ||
						e.category.toLowerCase().includes(q) ||
						e.muscles.some((m) => m.muscle.toLowerCase().includes(q))
				)
			: userExercises
	);

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
		editingDelete = false;
		creating = false;
		load();
	}

	function onDeleted() {
		editing = null;
		editingDelete = false;
		load();
	}

	onMount(load);

	// Float the FAB above the bottom dock, outside the route transition wrapper, so it
	// neither clips nor animates with page navigation (mirrors IntakeFab).
	const cubicOut = 'cubic-bezier(0.33, 1, 0.68, 1)';
	const portal = (node: HTMLElement) => {
		document.body.appendChild(node);
		node.style.opacity = '0';
		node.style.transition = `opacity 150ms ${cubicOut}`;
		setTimeout(() => (node.style.opacity = '1'), 100);
		return {
			destroy() {
				node.style.transition = `opacity 100ms ${cubicOut}`;
				node.style.opacity = '0';
				setTimeout(() => node.remove(), 100);
			}
		};
	};
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
		<SearchBar
			bind:value={query}
			placeholder="Search exercises"
			label="Search exercises"
			clearable
		/>

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
		{:else if filtered.length === 0}
			<p class="p-2 text-sm opacity-60" data-testid="exercise-no-match">
				No exercises match “{query}”.
			</p>
		{:else}
			<!-- Swipe-left / long-press → edit, swipe-right → delete (`_conv-gestures`),
			     matching the intake rows and dashboard workout cards. -->
			<ul class="flex flex-col gap-1" data-testid="exercise-list">
				{#each filtered as entry (entry.id)}
					<li class="overflow-hidden rounded-box border border-base-200">
						<SwipeableListItem
							onleft={() => editExercise(entry)}
							onright={() => deleteExerciseRow(entry)}
						>
							{#snippet leftAction()}
								<span><Pencil size="1.75rem" color={'var(--color-primary)'} /></span>
							{/snippet}
							{#snippet rightAction()}
								<span><Trash size="1.75rem" color={'var(--color-error)'} /></span>
							{/snippet}
							<div
								class="bg-base-100 flex items-center gap-2 p-3"
								data-testid="exercise-row"
								use:longpress
								onlongpress={() => editExercise(entry)}
							>
								<span class="flex flex-1 flex-col items-start">
									<span class="flex items-center gap-2 font-medium">
										{entry.name}
										{#if !entry.verified}
											<span class="badge badge-ghost badge-sm" data-testid="unverified-badge">
												New
											</span>
										{/if}
									</span>
									<span class="text-xs opacity-60">
										{entry.category === 'uncategorized' ? 'Uncategorized' : pretty(entry.category)}
										{#if entry.muscles.length > 0}
											· {entry.muscles.map((m) => pretty(m.muscle)).join(', ')}
										{/if}
									</span>
								</span>
							</div>
						</SwipeableListItem>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<button
	use:portal
	class="fixed bottom-20 right-4 z-[39] btn btn-xl btn-circle btn-primary shadow-lg"
	aria-label="Add exercise"
	data-testid="add-exercise"
	onclick={() => (creating = true)}
>
	<Plus size="1.5em" />
</button>

{#if creating}
	<ExerciseFormModal mode="create" onsaved={onSaved} onclose={() => (creating = false)} />
{/if}
{#if editing}
	<ExerciseFormModal
		mode="edit"
		detail={editing}
		startInDelete={editingDelete}
		onsaved={onSaved}
		ondeleted={onDeleted}
		onclose={() => {
			editing = null;
			editingDelete = false;
		}}
	/>
{/if}
