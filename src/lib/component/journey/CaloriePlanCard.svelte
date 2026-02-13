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

	<!-- Stacked bars -->
	<div class="mb-4 flex flex-col gap-2">
		<!-- Target bar -->
		<div>
			<div class="flex justify-between mb-1">
				<span class="text-xs opacity-70">Target</span>
				<span class="text-xs font-semibold text-primary">{targetCalories} kcal</span>
			</div>
			<div class="h-2 bg-base-200 rounded-full">
				<div
					class="h-full bg-primary rounded-full transition-all duration-500"
					style="width: {targetPercent}%"
				></div>
			</div>
		</div>

		<!-- Average intake bar -->
		<div>
			<div class="flex justify-between mb-1">
				<span class="text-xs opacity-70">Your average</span>
				{#if averageIntake}
					<span
						class="text-xs font-semibold"
						class:text-success={!averageOverTarget}
						class:text-warning={averageOverTarget}
					>
						{averageIntake} kcal
					</span>
				{:else}
					<span class="text-xs opacity-50">No data yet</span>
				{/if}
			</div>
			<div class="h-2 bg-base-200 rounded-full">
				<div
					class="h-full rounded-full transition-all duration-500"
					class:bg-success={!averageOverTarget}
					class:bg-warning={averageOverTarget}
					style="width: {averagePercent ?? 0}%"
				></div>
			</div>
		</div>

		<div class="flex justify-between mt-0.5">
			<span class="text-xs opacity-50">0</span>
			<span class="text-xs opacity-50">{maximumCalories} kcal max</span>
		</div>
	</div>

	<!-- Supporting info -->
	{#if !isHolding || dailyRate !== 0}
		<div class="flex justify-between items-center text-sm py-2 border-t border-base-200">
			<span class="opacity-70">Daily {rateLabel}</span>
			<span class="font-semibold text-primary">{dailyRate} kcal</span>
		</div>
	{/if}
	<div class="flex justify-between items-center text-sm py-2 border-t border-base-200">
		<span class="opacity-70">Maximum</span>
		<span class="font-semibold" class:text-accent={!isGaining && !isHolding}
			>{maximumCalories} kcal</span
		>
	</div>

	{#if isHolding}
		<p class="text-xs opacity-60 mt-3">
			Your target is set to maintain current weight. Stay within this range.
		</p>
	{/if}
</div>
