<script lang="ts">
	import NumberFlow from '@number-flow/svelte';
	import { Shield, ShieldCheck, ShieldWarning } from 'phosphor-svelte';
	import { CircularProgress } from '@thwbh/veilchen';
	import type { IntakeTarget } from '$lib/api';

	interface Props {
		intakeTarget: IntakeTarget;
		entries: Array<number>;
		isHistory?: boolean;
	}

	let { intakeTarget, entries, isHistory = false }: Props = $props();

	let limit = $state(intakeTarget && intakeTarget.targetCalories ? intakeTarget.targetCalories : 0),
		maximum = $state(
			intakeTarget && intakeTarget.maximumCalories ? intakeTarget.maximumCalories : 0
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

		if (intakeTarget) {
			limit = intakeTarget.targetCalories;
			maximum = intakeTarget.maximumCalories;
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
				: total <= intakeTarget.maximumCalories
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
		{:else if total <= intakeTarget.maximumCalories}
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
