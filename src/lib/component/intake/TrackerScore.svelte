<script lang="ts">
	import type { CalorieTarget } from '$lib/api/gen';
	import NumberFlow from '@number-flow/svelte';
	import { Shield, ShieldCheck, ShieldWarning } from 'phosphor-svelte';
	import { CircularProgress, StatCard } from '@thwbh/veilchen';

	interface Props {
		calorieTarget: CalorieTarget;
		entries: Array<number>;
		isHistory?: boolean;
	}

	let { calorieTarget, entries, isHistory = false }: Props = $props();

	let limit = $state(
			calorieTarget && calorieTarget.targetCalories ? calorieTarget.targetCalories : 0
		),
		maximum = $state(
			calorieTarget && calorieTarget.maximumCalories ? calorieTarget.maximumCalories : 0
		),
		total = $state(0);

	let percentage = $state(0);
	let ratio = $state(0);
	let currentColor = $state('');

	$effect(() => {
		if (entries && entries.length > 0) {
			total = entries.reduce((a, b) => a + b);
		} else {
			total = 0;
		}

		if (calorieTarget) {
			limit = calorieTarget.targetCalories;
			maximum = calorieTarget.maximumCalories;
		}

		if (total !== undefined && maximum) {
			ratio = total / limit;
			percentage = Math.floor(ratio * 100);

			if (ratio == 0) {
				currentColor = 'stat-desc';
			} else if (ratio <= 1) {
				currentColor = 'text-primary';
			} else if (total <= maximum) {
				currentColor = 'text-warning';
			} else {
				currentColor = 'text-error';
			}
		}
	});

	let descText = $derived(
		ratio == 0
			? isHistory
				? 'No intake tracked.'
				: 'No intake tracked yet.'
			: ratio <= 1
				? `All good. ${limit - total}kcal left${isHistory ? '.' : ' for today.'}`
				: total <= calorieTarget.maximumCalories
					? `Warning. ${maximum - total}kcal left for hardcap.`
					: `Warning! ${total - maximum}kcal over hardcap!`
	);
</script>

<div class="stat">
	<div class="stat-figure">
		<CircularProgress value={percentage} size="7rem" color={currentColor}>
			<p class="text-neutral">{percentage}%</p>
		</CircularProgress>
	</div>

	<div class="stat-title">{isHistory ? 'Intake' : "Today's Intake"}</div>
	<div class="stat-value text-stat-value">
		<NumberFlow value={total} /><span class="text-sm">/{limit}</span>
	</div>
	<div class="stat-desc flex items-center gap-1">
		{#if ratio <= 1}
			{#if ratio == 0}
				<Shield size="1.5em" weight="fill" class={currentColor} />
			{:else}
				<ShieldCheck size="1.5em" weight="fill" class={currentColor} />
			{/if}
		{:else if total <= calorieTarget.maximumCalories}
			<Shield size="1.5em" weight="fill" class={currentColor} />
		{:else}
			<ShieldWarning size="1.5em" weight="fill" class={currentColor} />
		{/if}
		{descText}
	</div>
</div>

<style>
	.text-stat-value {
		font-size: 3rem;
	}
</style>
