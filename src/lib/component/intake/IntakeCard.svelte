<script lang="ts">
	import type { CalorieTracker } from '$lib/api/gen';
	import { longpress } from '$lib/gesture/long-press';
	import CalorieTrackerMask from './CalorieTrackerMask.svelte';
	import { type FlyParams } from 'svelte/transition';

	interface Props {
		entry: CalorieTracker;
		onlongpress: () => void;
		flyParams?: FlyParams;
	}

	let { entry, onlongpress, flyParams = undefined, ...props }: Props = $props();

	const startEditing = () => {
		onlongpress();
	};
</script>

<div class="w-full" use:longpress onlongpress={startEditing} {...props}>
	<CalorieTrackerMask
		{entry}
		onedit={startEditing}
		readonly={true}
		className="fieldset w-xs p-4 rounded-box w-full"
	/>
</div>
