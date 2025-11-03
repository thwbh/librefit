<script lang="ts">
	import type { CalorieTracker } from '$lib/api/gen';
	import { getCategoriesContext } from '$lib/context';
	import { Fire, TagChevron } from 'phosphor-svelte';

	interface Props {
		entry: CalorieTracker;
	}

	let { entry }: Props = $props();

	const categories = getCategoriesContext();

	// Get category details
	let categoryData = $derived(
		categories.find((cat) => cat.shortvalue === entry.category) || {
			shortvalue: entry.category,
			longvalue: entry.category
		}
	);
</script>

<div class="h-full w-full flex flex-col p-6 gap-4">
	<!-- Header: Calories + Category -->
	<div class="flex items-center justify-between">
		<!-- Calorie Amount -->
		<div class="flex items-baseline gap-2">
			<Fire size="1.5rem" weight="fill" class="text-primary" />
			<span class="text-4xl font-bold text-primary">{entry.amount}</span>
			<span class="text-lg font-medium text-base-content/60">kcal</span>
		</div>

		<!-- Category Badge -->
		<div class="badge badge-secondary gap-2 px-3 py-2.5">
			<TagChevron size="1rem" weight="fill" />
			<span class="font-semibold text-sm">{categoryData.longvalue}</span>
		</div>
	</div>

	<!-- Description -->
	{#if entry.description && entry.description.trim().length > 0}
		<div class="bg-base-200/50 rounded-lg p-4">
			<p class="text-base-content/80 text-sm leading-relaxed">{entry.description}</p>
		</div>
	{:else}
		<div class="flex-1 flex items-center justify-center opacity-40">
			<p class="text-sm italic">No description</p>
		</div>
	{/if}
</div>
