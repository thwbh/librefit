<script lang="ts">
	import { onMount } from 'svelte';
	import { MagnifyingGlass, Plus } from 'phosphor-svelte';
	import { getExerciseLibrary, quickAddExercise, type ExerciseDetail } from '$lib/api';

	// Search-driven exercise picker (WO-012, WO-013, WO-033). The library (seeded
	// + user-created) is fetched once and filtered client-side as the user types —
	// matching name, category, or muscle — so finding an exercise stays fast as it
	// grows. (DaisyUI "search input with icon"; veilchen has no search component
	// yet — see thwbh/veilchen#6.)
	interface Props {
		onpick: (exercise: ExerciseDetail) => void | Promise<void>;
		// Mid-workout quick-add: a name-only "Ghost" creatable in place (WO-036).
		// Off for management contexts that shouldn't create from the picker.
		allowQuickAdd?: boolean;
	}

	let { onpick, allowQuickAdd = true }: Props = $props();

	let entries = $state<ExerciseDetail[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let query = $state('');
	let adding = $state(false);

	onMount(async () => {
		try {
			entries = await getExerciseLibrary();
		} catch (e) {
			error = String(e);
		} finally {
			loading = false;
		}
	});

	// Create a name-only unverified exercise and select it without leaving the
	// session — no metadata form mid-workout (WO-034, WO-036).
	async function quickAdd() {
		const name = query.trim();
		if (!name || adding) return;
		adding = true;
		try {
			const created = await quickAddExercise({ name });
			entries = [...entries, created];
			await onpick(created);
		} catch (e) {
			error = String(e);
		} finally {
			adding = false;
		}
	}

	// Offer quick-add only when the query doesn't already name an existing exercise.
	const exactMatch = $derived(entries.some((e) => e.name.trim().toLowerCase() === q));

	const q = $derived(query.trim().toLowerCase());
	// Until the user types, show a prompt rather than dumping the whole library.
	const filtered = $derived(
		q
			? entries.filter(
					(e) =>
						e.name.toLowerCase().includes(q) ||
						e.category.toLowerCase().includes(q) ||
						e.muscles.some((m) => m.muscle.toLowerCase().includes(q))
				)
			: []
	);

	// Muscle/category values are slugs (e.g. "upper-back"); show them human-readable.
	const pretty = (s: string) => s.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
</script>

<div class="exercise-picker flex min-h-0 flex-col gap-2">
	<label class="input input-bordered flex items-center gap-2">
		<MagnifyingGlass size="1em" class="opacity-50" />
		<input
			type="search"
			class="grow"
			placeholder="Search exercises"
			aria-label="Search exercises"
			bind:value={query}
		/>
	</label>

	{#if loading}
		<span class="loading loading-spinner"></span>
	{:else if error}
		<p class="text-error" role="alert">{error}</p>
	{:else if !q}
		<p class="p-2 text-sm opacity-60">Type to search exercises.</p>
	{:else if filtered.length === 0}
		<p class="p-2 text-sm opacity-60">No exercises match “{query}”.</p>
		{#if allowQuickAdd && !exactMatch}
			<!-- Name-only quick-add for an exotic lift, in place (WO-036). -->
			<button
				class="btn btn-outline btn-sm mt-1 justify-start gap-2"
				disabled={adding}
				onclick={quickAdd}
				data-testid="quick-add"
			>
				<Plus size="1em" />
				{adding ? 'Adding…' : `Add “${query.trim()}”`}
			</button>
		{/if}
	{:else}
		<ul class="flex min-h-0 flex-col gap-1 overflow-y-auto">
			{#each filtered as entry (entry.id)}
				<li>
					<button
						class="btn btn-ghost btn-block h-auto justify-start py-2"
						onclick={() => onpick(entry)}
					>
						<span class="flex flex-col items-start">
							<span class="flex items-center gap-2 font-medium">
								{entry.name}
								{#if !entry.seeded}
									<!-- User-created vs seeded marker (WO-033); unverified Ghosts read "Custom · New". -->
									<span class="badge badge-ghost badge-sm" data-testid="custom-badge">
										{entry.verified ? 'Custom' : 'Custom · New'}
									</span>
								{/if}
							</span>
							<span class="text-xs opacity-60">
								{#if entry.category === 'uncategorized'}
									Uncategorized
								{:else}
									{pretty(entry.category)} · {entry.muscles.map((m) => pretty(m.muscle)).join(', ')}
								{/if}
							</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
		{#if allowQuickAdd && !exactMatch}
			<button
				class="btn btn-outline btn-sm mt-1 justify-start gap-2"
				disabled={adding}
				onclick={quickAdd}
				data-testid="quick-add"
			>
				<Plus size="1em" />
				{adding ? 'Adding…' : `Add “${query.trim()}”`}
			</button>
		{/if}
	{/if}
</div>
