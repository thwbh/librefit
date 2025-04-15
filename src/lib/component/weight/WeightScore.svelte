<script lang="ts">
	import { parseStringAsDate } from '$lib/date';
	import type { CalorieTarget, WeightTarget, WeightTracker } from '$lib/model';
	import { differenceInDays } from 'date-fns';
	import { ExclamationCircleSolid, ShieldCheckSolid, ShieldSolid } from 'flowbite-svelte-icons';
	import { PlusOutline } from 'flowbite-svelte-icons';

	interface Props {
		weightTracker?: WeightTracker;
		lastWeightTracker?: WeightTracker;
		weightTarget: WeightTarget;
	}

	let { weightTracker = undefined, lastWeightTracker = undefined, weightTarget }: Props = $props();
</script>

<div class="stat">
	<div class="stat-figure">
		<button class="btn btn-primary btn-xl">
			<PlusOutline height="1.5rem" width="1.5rem" />
		</button>
	</div>

	<div class="stat-title">Current Weight</div>
	<div class="stat-value">
		<span>
			{#if weightTracker}
				{weightTracker.amount}
			{:else if lastWeightTracker}
				{lastWeightTracker.amount}
			{:else}
				-
			{/if}
			<span class="text-sm">kg</span>
		</span>
	</div>
	<div class="stat-desc flex items-center gap-1">
		{#if weightTracker}
			<ShieldCheckSolid width="20" height="20" class={'text-success'} />
			Last update: Today.
		{:else if lastWeightTracker}
			{@const lastEntryDayDiff = differenceInDays(
				new Date(),
				parseStringAsDate(lastWeightTracker.added)
			)}
			{#if lastEntryDayDiff > 2}
				<ExclamationCircleSolid width="20" height="20" class={'text-error'} />
				Last update was {lastEntryDayDiff} days ago!
			{:else}
				<ShieldSolid width="20" height="20" class={'text-warning'} />
				Last update: {lastEntryDayDiff} days ago.
			{/if}
		{:else}
			<ShieldSolid width="20" height="20" class={'stat-desc'} />
			Nothing tracked yet.
		{/if}
	</div>
</div>

<div class="progress-container w-full">
	<span class="flex flex-row justify-between items-center">
		<p class="text-sm opacity-60">
			{differenceInDays(parseStringAsDate(weightTarget.endDate), new Date())} days left.
		</p>
		<button class="btn btn-sm"> Review plan </button>
	</span>
	<progress class="progress w-full" value="63" max="100"></progress>
</div>

<style>
	.stat-value {
		font-size: 2rem;
	}

	.progress-container {
		padding-inline: calc(0.25rem * 6);
		padding-block: calc(0.25rem * 4);
	}
</style>
