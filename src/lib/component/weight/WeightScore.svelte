<script lang="ts">
	import { parseStringAsDate } from '$lib/date';
	import type { WeightTarget, WeightTracker } from '$lib/api/gen';
	import NumberFlow from '@number-flow/svelte';
	import { differenceInDays } from 'date-fns';
	import { Shield, ShieldCheck, ShieldWarning, TrendDown, TrendUp } from 'phosphor-svelte';
	import { goto } from '$app/navigation';

	interface Props {
		weightTracker: WeightTracker;
		weightTarget: WeightTarget;
	}

	let { weightTracker, weightTarget }: Props = $props();

	let percentage = $derived.by(() => {
		const diff = weightTarget.initialWeight - weightTracker.amount;

		return Math.round((diff / weightTarget.initialWeight) * 100);
	});

	let modifier = $derived(weightTarget.initialWeight > weightTracker.amount ? '-' : '+');

	let lastEntryDayDiff = $derived(
		differenceInDays(new Date(), parseStringAsDate(weightTracker?.added!))
	);
</script>

<div class="stat weight-stat">
	<div class="stat-title">Current Weight</div>
	<div class="flex flex-row justify-between stat-value">
		<span>
			<NumberFlow value={weightTracker.amount} />
			<span class="text-sm">kg</span>
		</span>
		<span class="flex items-center gap-1">
			{#if modifier === '-'}
				<TrendDown weight="bold" size="2rem" />
			{:else if modifier === '+'}
				<TrendUp weight="bold" size="2rem" />
			{:else}{/if}
		</span>
	</div>
	<div class="flex flex-row stat-desc items-center justify-between gap-1">
		<span class="flex flex-row gap-1 items-center">
			{#if lastEntryDayDiff === 0}
				<ShieldCheck size="1.25rem" weight="fill" color="var(--color-success)" />
				Last update: Today.
			{:else if lastEntryDayDiff > 2}
				<ShieldWarning size="1.25rem" weight="fill" color="var(--color-error)" />
				Last update was {lastEntryDayDiff} days ago!
			{:else}
				<ShieldWarning size="1.25rem" weight="fill" color="var(--color-warning)" />
				Last update: {lastEntryDayDiff} days ago.
			{/if}
		</span>
		<span>
			{modifier}{Math.abs(percentage)}%
		</span>
	</div>
</div>
{#if weightTarget}
	{@const dayDiff = differenceInDays(parseStringAsDate(weightTarget.endDate), new Date())}
	{@const totalDays = differenceInDays(
		parseStringAsDate(weightTarget.endDate),
		parseStringAsDate(weightTarget.startDate)
	)}
	{@const progress = Math.round(((totalDays - dayDiff) / totalDays) * 100)}
	<div class="progress-container w-full">
		<span class="flex flex-row justify-between items-center">
			<p class="text-sm opacity-60">
				{dayDiff} days left.
			</p>
			<button class="btn btn-sm" onclick={() => goto('/review')}> Review plan </button>
		</span>

		<progress class="progress w-full" value={progress} max="100"></progress>
	</div>
{/if}

<style>
	.stat-value {
		font-size: 2rem;
	}

	.progress-container {
		padding-inline: calc(0.25rem * 6);
		padding-block: calc(0.25rem * 4);
	}

	.weight-stat {
		border-right: 0px !important;
	}
</style>
