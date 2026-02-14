<script lang="ts">
	import { differenceInDays } from 'date-fns';
	import { convertDateStrToDisplayDateStr, parseStringAsDate } from '$lib/date';
	import { TrendDown, TrendUp, Lightning } from 'phosphor-svelte';
	import NumberFlow from '@number-flow/svelte';

	interface Props {
		startDate: string;
		endDate: string;
		initialWeight: number;
		targetWeight: number;
		currentWeight: number;
	}

	let { startDate, endDate, initialWeight, targetWeight, currentWeight }: Props = $props();

	const startDateParsed = $derived(parseStringAsDate(startDate));
	const endDateParsed = $derived(parseStringAsDate(endDate));
	const today = $derived(new Date());

	const totalDays = $derived(differenceInDays(endDateParsed, startDateParsed));
	const daysElapsed = $derived(Math.min(differenceInDays(today, startDateParsed), totalDays));
	const daysLeft = $derived(Math.max(totalDays - daysElapsed, 0));
	const progress = $derived(totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0);

	const weightChange = $derived(initialWeight - currentWeight);
	const isGaining = $derived(targetWeight > initialWeight);
	const isOnTrack = $derived(
		isGaining ? currentWeight >= initialWeight : currentWeight <= initialWeight
	);
</script>

<div class="bg-primary text-primary-content rounded-box p-6 shadow">
	<div class="flex items-baseline justify-between mb-6">
		<h2 class="text-lg font-semibold">Journey Timeline</h2>
		<span class="text-xs opacity-70">{daysLeft} days left</span>
	</div>

	<!-- Progress bar -->
	<div class="journey-bar-track">
		<div class="journey-bar-fill" style="width: calc({progress}% + 0.5rem)"></div>
	</div>

	<!-- Start / Target labels -->
	<div class="flex justify-between mt-4">
		<div class="flex flex-col">
			<span class="text-2xl font-bold">
				<NumberFlow value={initialWeight} /> <span class="text-xs">kg</span>
			</span>
			<span class="text-xs opacity-70">{convertDateStrToDisplayDateStr(startDate)}</span>
		</div>
		<div class="flex flex-col items-end">
			<span class="text-2xl font-bold">
				<NumberFlow value={targetWeight} /> <span class="text-xs">kg</span>
			</span>
			<span class="text-xs opacity-70">{convertDateStrToDisplayDateStr(endDate)}</span>
		</div>
	</div>

	<!-- Today callout -->
	<div
		class="bg-primary-content text-primary rounded-lg p-3 mt-4 flex items-center justify-between"
	>
		<div class="flex items-center gap-2">
			<Lightning size="1.25rem" weight="bold" />
			<span class="font-semibold">Today</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-xl font-bold">
				<NumberFlow value={currentWeight} /> <span class="text-xs">kg</span>
			</span>
			{#if weightChange === 0}
				<span class="text-xs opacity-60">No change yet</span>
			{:else if isOnTrack}
				{#if isGaining}
					<TrendUp size="1rem" weight="bold" />
				{:else}
					<TrendDown size="1rem" weight="bold" />
				{/if}
				<span class="text-xs">{Math.abs(weightChange).toFixed(1)} kg</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.journey-bar-track {
		height: 0.25rem;
		border-radius: 9999px;
		background-color: oklch(0.85 0.02 280);
		overflow: visible;
		position: relative;
	}

	.journey-bar-fill {
		height: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background-color: var(--color-accent);
		position: relative;
		min-width: 1rem;
		transition: width 0.6s ease;
		clip-path: polygon(0% 0%, calc(100% - 0.5rem) 0%, 100% 50%, calc(100% - 0.5rem) 100%, 0% 100%);
	}
</style>
