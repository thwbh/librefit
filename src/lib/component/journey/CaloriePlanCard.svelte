<script lang="ts">
	import NumberFlow from '@number-flow/svelte';

	interface Props {
		recommendation: 'GAIN' | 'HOLD' | 'LOSE';
		dailyRate: number;
		targetCalories: number;
		maximumCalories: number;
		averageIntake?: number;
	}

	let { recommendation, dailyRate, targetCalories, maximumCalories, averageIntake }: Props =
		$props();

	const isGaining = $derived(recommendation === 'GAIN');
	const isHolding = $derived(recommendation === 'HOLD');

	const goalLabel = $derived(
		isGaining ? 'Gain Weight' : isHolding ? 'Maintain Weight' : 'Lose Weight'
	);
	const rateLabel = $derived(isGaining ? 'surplus' : isHolding ? 'adjustment' : 'deficit');

	// Position of target on the 0-to-maximum scale (as percentage)
	const targetPercent = $derived(
		maximumCalories > 0 ? Math.round((targetCalories / maximumCalories) * 100) : 0
	);

	const averagePercent = $derived(
		averageIntake != null && maximumCalories > 0
			? Math.min(100, Math.round((averageIntake / maximumCalories) * 100))
			: undefined
	);

	const averageOverTarget = $derived(averageIntake != null && averageIntake > targetCalories);
</script>

<div class="bg-base-100 text-base-content rounded-box p-6 shadow">
	<div class="flex items-baseline justify-between mb-2">
		<h3 class="text-lg font-semibold text-base-content">Calorie Plan</h3>
		<span class="text-xs opacity-60">{goalLabel}</span>
	</div>

	<!-- Hero number -->
	<div class="flex flex-col items-center py-4">
		<span class="text-5xl font-bold text-primary">
			<NumberFlow value={targetCalories} />
		</span>
		<span class="text-sm opacity-60 mt-1">kcal / day</span>
	</div>

	<!-- Stacked bars with target marker -->
	<div class="mb-4 relative">
		<!-- Labels row: Target -->
		<div class="flex justify-between mb-1">
			<span class="text-xs opacity-70">Target</span>
			<span class="text-xs font-semibold text-primary">{targetCalories} kcal</span>
		</div>

		<!-- Bars container (relative for the marker overlay) -->
		<div class="relative">
			<!-- Target bar -->
			<div class="h-2 bg-primary/15 rounded-full">
				<div
					class="h-full bg-primary rounded-full transition-all duration-500"
					style="width: {targetPercent}%"
				></div>
			</div>

			<!-- Labels row: Your average -->
			<div class="flex justify-between mt-2 mb-1">
				<span class="text-xs opacity-70">Your average</span>
				{#if averageIntake}
					<span class="text-xs font-semibold text-accent">{averageIntake} kcal</span>
				{:else}
					<span class="text-xs opacity-50">No data yet</span>
				{/if}
			</div>

			<!-- Average intake bar -->
			<div class="h-2 bg-accent/15 rounded-full">
				<div
					class="h-full bg-accent rounded-full transition-all duration-500"
					style="width: {averagePercent ?? 0}%"
				></div>
			</div>

			<!-- Target position marker: caret + dashed line spanning both bars -->
			{#if averageIntake}
				<div
					class="absolute flex flex-col items-center pointer-events-none"
					style="left: {targetPercent}%; transform: translateX(-50%); top: -8px; height: calc(100% + 8px);"
				>
					<!-- Caret pointing down -->
					<div class="target-caret"></div>
					<!-- Dashed line from caret to bottom bar -->
					<div class="flex-1 border-l border-dashed border-accent-content/40"></div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Supporting info -->
	{#if !isHolding || dailyRate !== 0}
		<div class="flex justify-between items-center text-sm py-2 border-t border-base-200">
			<span class="opacity-70">Daily {rateLabel}</span>
			<span class="font-semibold text-secondary">{dailyRate} kcal</span>
		</div>
	{/if}
	<div class="flex justify-between items-center text-sm py-2 border-t border-base-200">
		<span class="opacity-70">Maximum</span>
		<span class="font-semibold opacity-50">{maximumCalories} kcal</span>
	</div>

	{#if isHolding}
		<p class="text-xs opacity-60 mt-3">
			Your target is set to maintain current weight. Stay within this range.
		</p>
	{/if}
</div>

<style>
	.target-caret {
		width: 0;
		height: 0;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-top: 8px solid var(--color-accent);
		flex-shrink: 0;
	}
</style>
