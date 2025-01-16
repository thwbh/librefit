<script lang="ts">
	import Scale from '$lib/assets/icons/scale-outline.svg?component';
	import { createEventDispatcher } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { convertDateStrToDisplayDateStr, getDateAsStr } from '$lib/date';
	import TrackerInput from '$lib/components/TrackerInput.svelte';
	import Target from '$lib/assets/icons/target-arrow.svg?component';
	import type { WeightTarget, WeightTracker } from '$lib/model';

	interface Props {
		weightTarget: WeightTarget;
		weightList: Array<WeightTracker>;
	}

	let { weightTarget, weightList }: Props = $props();

	let weightQuickAdd: number = $state();
	let btnTarget: HTMLButtonElement = $state();

	const modalStore = getModalStore();
	const todayDateStr = getDateAsStr(new Date());
	const dispatch = createEventDispatcher();

	const addWeightQuickly = (e) => {
		dispatch('addWeight', {
			dateStr: todayDateStr,
			value: e.detail.value,
			callback: () => {
				e.detail.callback();
				weightQuickAdd = undefined;
			}
		});
	};

	const updateWeight = (e) => {
		dispatch('updateWeight', {
			id: e.detail.id,
			dateStr: e.detail.dateStr,
			value: e.detail.value,
			target: e.detail.target,
			callback: e.detail.callback
		});
	};

	const deleteWeight = (e) => {
		dispatch('deleteWeight', {
			id: e.detail.id,
			dateStr: e.detail.dateStr,
			target: e.detail.target,
			callback: e.detail.callback
		});
	};

	const setTarget = (e) => {
		dispatch('setTarget', {
			weightTarget: e.weightTarget,
			target: btnTarget
		});
	};

	const onEdit = () => {
		modalStore.trigger({
			type: 'component',
			component: 'weightModal',
			meta: {
				weightList: weightList
			},
			response: (e) => {
				if (e) {
					if (e.detail.type === 'update') updateWeight(e.detail);
					else if (e.detail.type === 'remove') deleteWeight(e.detail);
					if (e.detail.close) modalStore.close();
				} else modalStore.close();
			}
		});
	};

	const onSetTarget = () => {
		modalStore.trigger({
			type: 'component',
			component: 'targetModal',
			meta: {
				weightTarget: !weightTarget
					? { initialWeight: !weightList ? undefined : weightList[0].amount }
					: weightTarget
			},
			response: (e) => {
				if (e && !e.cancelled) {
					setTarget(e);
				}

				modalStore.close();
			}
		});
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
		<button class="btn-icon variant-filled w-8" bind:this={btnTarget} onclick={onSetTarget}>
			<Target />
		</button>
	</div>

	<div class="flex flex-col lg:w-1/3 w-full gap-4">
		<TrackerInput
			bind:value={weightQuickAdd}
			on:add={addWeightQuickly}
			dateStr={getDateAsStr(new Date())}
			compact={true}
			unit={'kg'}
		/>

		{#if weightList && weightList.length > 0}
			<button class="btn variant-filled grow" aria-label="edit weight" onclick={onEdit}>
				<span>
					<Scale />
				</span>
				<span> Edit </span>
			</button>
		{/if}
	</div>
</div>
