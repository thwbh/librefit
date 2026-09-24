<script lang="ts">
	import type { ExerciseCategory, Muscle } from '$lib/api';

	// Shared category + muscle selection used by the full add/edit modal and the
	// batch tidy-up workspace (WO-029/030, WO-041), so both surfaces are identical:
	// a single-select row of category "chips" and a tap-to-cycle muscle list
	// (off → primary → secondary → off).
	interface Props {
		categories: ExerciseCategory[];
		muscles: Muscle[];
		/** Selected category shortvalue, or '' for none. */
		category: string;
		/** shortvalue -> role for selected muscles; absence = not targeted. */
		roles: Record<string, 'primary' | 'secondary'>;
	}

	let { categories, muscles, category = $bindable(), roles = $bindable() }: Props = $props();

	// The `uncategorized` sentinel parks Ghosts; never a real, selectable category.
	const UNCATEGORIZED = 'uncategorized';
	const selectableCategories = $derived(categories.filter((c) => c.shortvalue !== UNCATEGORIZED));
	const selectedCount = $derived(Object.keys(roles).length);

	// Toggle a category chip: tapping the selected one clears it.
	function toggleCategory(shortvalue: string) {
		category = category === shortvalue ? '' : shortvalue;
	}

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
</script>

{#snippet categoryChips()}
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">Category</span>
		<div class="flex flex-wrap gap-1" data-testid="category-chips">
			{#each selectableCategories as c (c.shortvalue)}
				<button
					type="button"
					class="btn btn-xs {category === c.shortvalue ? 'btn-primary' : 'btn-outline'}"
					aria-pressed={category === c.shortvalue}
					onclick={() => toggleCategory(c.shortvalue)}
					data-testid="category-chip"
				>
					{c.longvalue}
				</button>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet muscleList()}
	<!-- Own bordered, capped scroll box on base-100 so the ghost rows read the same on
	     the white form modal and the base-200 tidy-up tag bar, and so the muscle area
	     can't grow the dialog past the viewport (which scrolls the title/delete off). -->
	<ul
		class="border-base-300 bg-base-100 flex max-h-44 flex-col gap-1 overflow-y-auto rounded-box border p-1"
		data-testid="muscle-list"
	>
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
{/snippet}

<div class="flex flex-col gap-3">
	{@render categoryChips()}

	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">Muscles</span>
		<p class="text-xs opacity-60">
			Tap to cycle off → primary → secondary. Selected: {selectedCount}
		</p>
		{@render muscleList()}
	</div>
</div>
