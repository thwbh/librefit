<script lang="ts">
	import type { CalorieTracker, FoodCategory } from '$lib/model';
	import { longpress } from '$lib/gesture/long-press';
	import CalorieTrackerMask from './CalorieTrackerMask.svelte';
	import { fly, type FlyParams } from 'svelte/transition';

	interface Props {
		entry: CalorieTracker;
		categories: Array<FoodCategory>;
		onlongpress: () => void;
		flyParams?: FlyParams;
	}

	let { entry, categories, onlongpress, flyParams = undefined, ...props }: Props = $props();

	const startEditing = () => {
		onlongpress();
	};
</script>

<div class="card w-full" use:longpress onlongpress={startEditing} {...props}>
	<CalorieTrackerMask
		{entry}
		{categories}
		onedit={startEditing}
		readonly={true}
		className="fieldset w-xs bg-base-200 border border-base-300 p-4 rounded-box w-full"
	/>
</div>
