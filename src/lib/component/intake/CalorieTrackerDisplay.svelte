<script lang="ts">
	import type { CalorieTracker } from '$lib/api/gen';
	import { getCategoriesContext } from '$lib/context';
	import { convertDateStrToDisplayTimeStr } from '$lib/date';
	import { Fire, Calendar, TagChevron, Timer } from 'phosphor-svelte';

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

	// Format date display
	let dateDisplay = $derived(convertDateStrToDisplayTimeStr(entry.added));
</script>

<div class="h-full w-full">
	<!-- Calorie Display - Hero Section -->
	<div class="flex flex-col items-center justify-center py-8 px-6 bg-primary/5 flex-shrink-0">
		<div class="flex items-baseline gap-2 mb-2">
			<span class="text-6xl font-extrabold text-primary tracking-tight">{entry.amount}</span>
			<span class="text-xl font-medium text-primary/70">kcal</span>
		</div>
		<Fire size="2rem" weight="fill" class="text-primary/40" />
	</div>

	<!-- Content Section -->
	<div class="flex-1 flex flex-col justify-between px-6 py-4 space-y-4">
		<!-- Category Badge -->
		<div class="flex items-center justify-center">
			<div class="badge badge-secondary badge-lg gap-2 px-4 py-3">
				<TagChevron size="1.2rem" weight="fill" />
				<span class="font-semibold">{categoryData.longvalue}</span>
			</div>
		</div>

		<!-- Description -->
		{#if entry.description && entry.description.trim().length > 0}
			<div class="bg-base-300/30 rounded-xl p-4 border-l-4 border-secondary">
				<p class="text-base-content/90 leading-relaxed">{entry.description}</p>
			</div>
		{/if}

		<!-- Date Footer -->
		<div class="flex items-center justify-center gap-2 pt-2">
			<Timer size="1rem" class="opacity-50" />
			<span class="text-xs font-medium opacity-60 uppercase tracking-wide">{dateDisplay}</span>
		</div>
	</div>
</div>
