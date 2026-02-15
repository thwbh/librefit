<script lang="ts">
	import NumberFlow from '@number-flow/svelte';
	import { TrendDown, TrendUp } from 'phosphor-svelte';

	interface Props {
		initialWeight: number;
		targetWeight: number;
	}

	let { initialWeight, targetWeight }: Props = $props();

	const weightDiff = targetWeight - initialWeight;
	const isGaining = targetWeight > initialWeight;
</script>

<div class="bg-base-100 rounded-box p-6 shadow">
	<h3 class="text-lg font-semibold text-base-content mb-4">Weight Goal</h3>
	<div class="flex justify-between items-end">
		<div class="flex flex-col">
			<span class="text-2xl font-bold">
				<NumberFlow value={initialWeight} /> <span class="text-xs font-normal">kg</span>
			</span>
			<span class="text-xs opacity-70">Start</span>
		</div>

		<div class="flex items-center gap-1 opacity-80">
			{#if isGaining}
				<TrendUp size="1rem" weight="bold" />
			{:else}
				<TrendDown size="1rem" weight="bold" />
			{/if}
			<span class="text-sm font-semibold">{Math.abs(weightDiff).toFixed(1)} kg</span>
		</div>

		<div class="flex flex-col items-end">
			<span class="text-2xl font-bold text-primary">
				<NumberFlow value={targetWeight} /> <span class="text-xs font-normal">kg</span>
			</span>
			<span class="text-xs opacity-70">Target</span>
		</div>
	</div>
</div>
