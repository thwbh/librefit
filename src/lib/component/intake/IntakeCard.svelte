<script lang="ts">
	import type { CalorieTracker, FoodCategory } from '$lib/model';
	import { longpress } from '$lib/gesture/long-press';
	import CalorieTrackerMask from './CalorieTrackerMask.svelte';

	interface Props {
		entry: CalorieTracker;
		categories: Array<FoodCategory>;
		onlongpress: () => void;
	}

	let { entry, categories, onlongpress }: Props = $props();

	let categoryLongvalue = $state('');

	const startEditing = () => {
		onlongpress();
	};

	$effect(() => {
		if (entry) {
			if (entry.category === 'b') categoryLongvalue = 'Breakfast';
			else if (entry.category === 'l') categoryLongvalue = 'Lunch';
			else if (entry.category === 'd') categoryLongvalue = 'Dinner';
		}
	});
</script>

<div class="card" use:longpress onlongpress={startEditing}>
	<fieldset class="fieldset w-xs bg-base-200 border border-base-300 p-4 rounded-box">
		<CalorieTrackerMask {entry} {categories} onedit={startEditing} readonly={true} />
	</fieldset>
</div>
