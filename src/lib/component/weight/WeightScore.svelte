<script lang="ts">
	import { parseStringAsDate } from '$lib/date';
	import type { WeightTarget, WeightTracker } from '$lib/api/gen';
	import NumberFlow from '@number-flow/svelte';
	import { differenceInDays } from 'date-fns';
	import { HandTap, ShieldCheck, ShieldWarning, TrendDown, TrendUp } from 'phosphor-svelte';

	interface Props {
		weightTracker: WeightTracker;
		weightTarget: WeightTarget;
		onupdate?: () => void;
	}

	let { weightTracker, weightTarget, onupdate }: Props = $props();

	let percentage = $derived.by(() => {
		const diff = weightTarget.initialWeight - weightTracker.amount;

		return Math.round((diff / weightTarget.initialWeight) * 100);
	});

	let modifier = $derived(weightTarget.initialWeight > weightTracker.amount ? '-' : '+');

	let lastEntryDayDiff = $derived(
		differenceInDays(new Date(), parseStringAsDate(weightTracker?.added!))
	);

	let needsUpdate = $derived(lastEntryDayDiff > 0);
</script>

{#snippet weightContent()}
	<div class="stat-title">Current Weight</div>
	<div class="flex flex-row justify-between stat-value">
		<span>
			<NumberFlow value={weightTracker.amount} />
			<span class="text-sm">kg</span>
		</span>
		<span class="flex items-center gap-1">
			{#if needsUpdate}
				<span class="text-xs opacity-70">Tap to update</span>
				<HandTap size="2rem" class="motion-safe:animate-pulse" />
			{:else if modifier === '-'}
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
		{#if !needsUpdate}
			<span>{modifier}{Math.abs(percentage)}%</span>
		{/if}
	</div>
{/snippet}

{#if needsUpdate}
	<button
		class="stat weight-stat cursor-pointer text-left"
		aria-label="Update weight"
		onclick={onupdate}
	>
		{@render weightContent()}
	</button>
{:else}
	<div class="stat weight-stat">
		{@render weightContent()}
	</div>
{/if}

<style>
	.stat-value {
		font-size: 2rem;
	}

	.weight-stat {
		border-right: 0px !important;
	}
</style>
