<script lang="ts">
	import { onMount } from 'svelte';
	import { MagnifyingGlass } from 'phosphor-svelte';
	import { getExerciseLibrary, type ExerciseDetail } from '$lib/api';

	// Search-driven exercise picker (WO-012, WO-013). The seeded library is
	// fetched once and filtered client-side as the user types — matching name,
	// category, or muscle — so finding an exercise stays fast as the library
	// grows. (DaisyUI "search input with icon"; veilchen has no search component
	// yet — see thwbh/veilchen#6.)
	interface Props {
		onpick: (exercise: ExerciseDetail) => void | Promise<void>;
	}

	let { onpick }: Props = $props();

	let entries = $state<ExerciseDetail[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let query = $state('');

	onMount(async () => {
		try {
			entries = await getExerciseLibrary();
		} catch (e) {
			error = String(e);
		} finally {
			loading = false;
		}
	});

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
	{:else}
		<ul class="flex min-h-0 flex-col gap-1 overflow-y-auto">
			{#each filtered as entry (entry.id)}
				<li>
					<button
						class="btn btn-ghost btn-block h-auto justify-start py-2"
						onclick={() => onpick(entry)}
					>
						<span class="flex flex-col items-start">
							<span class="font-medium">{entry.name}</span>
							<span class="text-xs opacity-60">
								{pretty(entry.category)} · {entry.muscles.map((m) => pretty(m.muscle)).join(', ')}
							</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
