<script lang="ts">
	import { getDateAsStr, parseStringAsDate } from '$lib/date';
	import type { NewWeightTracker, WeightTarget, WeightTracker } from '$lib/api/gen';
	import NumberFlow from '@number-flow/svelte';
	import { differenceInDays } from 'date-fns';
	import { Shield, ShieldCheck, ShieldWarning, TrendDown, TrendUp } from 'phosphor-svelte';
	import { goto } from '$app/navigation';

	interface Props {
		weightTracker?: NewWeightTracker | WeightTracker;
		lastWeightTracker?: WeightTracker;
		weightTarget: WeightTarget;
		onAdd?: (entry: NewWeightTracker) => Promise<WeightTracker>;
		onEdit?: (id: number, entry: WeightTracker) => Promise<WeightTracker>;
	}

	let {
		lastWeightTracker = undefined,
		weightTracker = {
			added: getDateAsStr(new Date()),
			amount: lastWeightTracker ? lastWeightTracker.amount : 0
		},
		weightTarget
	}: Props = $props();

	let percentage = $derived.by(() => {
		const diff = weightTarget.initialWeight - weightTracker.amount;

		return Math.round((diff / weightTarget.initialWeight) * 100);
	});

	let modifier = $derived(weightTarget.initialWeight > weightTracker.amount ? '-' : '+');
</script>

<div class="stat">
	<div class="stat-title">Current Weight</div>
	<div class="flex flex-row justify-between stat-value">
		<span>
			{#if (weightTracker && 'id' in weightTracker) || lastWeightTracker}
				{#if weightTracker && 'id' in weightTracker}
					<NumberFlow value={weightTracker.amount} />
				{:else if lastWeightTracker}
					<NumberFlow value={lastWeightTracker.amount} />
				{/if}
			{:else}
				-
			{/if}
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
			{#if weightTracker && 'id' in weightTracker}
				<ShieldCheck size="1.25rem" weight="fill" color="var(--color-success)" />
				Last update: Today.
			{:else if lastWeightTracker}
				{@const lastEntryDayDiff = differenceInDays(
					new Date(),
					parseStringAsDate(lastWeightTracker.added)
				)}
				{#if lastEntryDayDiff > 2}
					<ShieldWarning size="1.25rem" weight="fill" color="var(--color-error)" />
					Last update was {lastEntryDayDiff} days ago!
				{:else}
					<ShieldWarning size="1.25rem" weight="fill" color="var(--color-warning)" />
					Last update: {lastEntryDayDiff} days ago.
				{/if}
			{:else}
				<Shield size="1.25rem" class={'stat-desc'} />
				Nothing tracked yet.
			{/if}
		</span>
		<span>
			{modifier}{Math.abs(percentage)}%
		</span>
	</div>
</div>

<div class="progress-container w-full">
	<span class="flex flex-row justify-between items-center">
		{#if weightTarget}
			<p class="text-sm opacity-60">
				{differenceInDays(parseStringAsDate(weightTarget.endDate), new Date())} days left.
			</p>
			<button class="btn btn-sm" onclick={() => goto('/progress')}> Review plan </button>
		{/if}
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
