<script lang="ts">
	import Scale from '$lib/assets/icons/scale-outline.svg?component';
	import { convertDateStrToDisplayDateStr, getDateAsStr } from '$lib/date';
	import TrackerInput from '$lib/components/TrackerInput.svelte';
	import type { NewWeightTracker, WeightTarget, WeightTracker } from '$lib/model';
	import type { TrackerInputEvent } from '$lib/event';
	import type { WeightTrackerCallback } from '$lib/api/tracker';

	interface Props {
		weightTarget: WeightTarget;
		weightList: Array<WeightTracker>;
		onAddWeight?: WeightTrackerCallback;
		onUpdateWeight?: WeightTrackerCallback;
		onDeleteWeight?: WeightTrackerCallback;
	}

	let { weightTarget, weightList, onAddWeight }: Props = $props();

	let weightQuickAdd: number = $state(undefined);

	const addWeightQuickly = (event: TrackerInputEvent<NewWeightTracker>) => {
		const newWeight: NewWeightTracker = event.details;

		onAddWeight(newWeight, event.buttonEvent.callback);
	};
</script>

<div class="flex flex-col grow gap-4 text-center items-center self-center w-full">
	{#if weightList && weightList.length > 0}
		<p>
			Current weight: {weightList[0].amount}kg ({convertDateStrToDisplayDateStr(
				weightList[0].added
			)})
		</p>
	{:else}
		<p>Nothing tracked for today. Now would be a good moment!</p>
	{/if}

	<div class="flex flex-row gap-1 items-center">
		{#if weightTarget}
			<p>
				Target: {weightTarget.targetWeight}kg @ ({convertDateStrToDisplayDateStr(
					weightTarget.endDate
				)})
			</p>
		{:else}
			<p>No target weight set.</p>
		{/if}
	</div>

	<div class="flex flex-col lg:w-1/3 w-full gap-4">
		<TrackerInput
			bind:value={weightQuickAdd}
			onAdd={addWeightQuickly}
			dateStr={getDateAsStr(new Date())}
			compact={true}
			unit={'kg'}
		/>

		{#if weightList && weightList.length > 0}
			<button class="btn variant-filled grow" aria-label="edit weight">
				<span>
					<Scale />
				</span>
				<span> Edit </span>
			</button>
		{/if}
	</div>
</div>
