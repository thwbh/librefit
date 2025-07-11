<script lang="ts">
	import type { CalorieTarget } from '$lib/model';
	import NumberFlow from '@number-flow/svelte';
	import { ExclamationCircleSolid, ShieldCheckSolid, ShieldSolid } from 'flowbite-svelte-icons';

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
</script>

<div class="stat">
	<div class="stat-figure">
		<div
			class="radial-progress {currentColor}"
			style="--value:{percentage};--size:7rem;"
			role="progressbar"
		>
			<p class="text-neutral">{percentage}%</p>
		</div>
	</div>

	{#if !isHistory}
		<div class="stat-title">Today's Intake</div>
	{:else}
		<div class="stat-title">Intake</div>
	{/if}
	<div class="stat-value"><NumberFlow value={total} /><span class="text-sm">/{limit}</span></div>
	<div class="stat-desc flex items-center gap-1">
		{#if ratio <= 1}
			{#if ratio == 0}
				<ShieldSolid width="20" height="20" class={currentColor} />

				No intake tracked yet.
			{:else}
				<ShieldCheckSolid width="20" height="20" class={currentColor} />

				All good. {limit - total}kcal left{#if !isHistory}
					for today.{:else}.{/if}
			{/if}
		{:else if ratio > 1}
			{#if total <= calorieTarget.maximumCalories}
				<ShieldSolid width="20" height="20" class={currentColor} />
				Warning. {maximum - total}kcal left for hardcap.
			{:else}
				<ExclamationCircleSolid width="20" height="20" class={currentColor} />
				Warning! {total - maximum}kcal over hardcap!
			{/if}
		{/if}
	</div>
</div>

<style>
	.stat-value {
		font-size: 3rem;
	}
</style>
