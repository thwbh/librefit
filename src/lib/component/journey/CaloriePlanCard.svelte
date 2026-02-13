<script lang="ts">
	interface Props {
		recommendation: 'GAIN' | 'HOLD' | 'LOSE';
		dailyRate: number;
		targetCalories: number;
		maximumCalories: number;
	}

	let { recommendation, dailyRate, targetCalories, maximumCalories }: Props = $props();

	const isGaining = $derived(recommendation === 'GAIN');
	const isHolding = $derived(recommendation === 'HOLD');

	const rateLabel = $derived(
		isGaining ? 'Daily Surplus' : isHolding ? 'Daily Adjustment' : 'Daily Deficit'
	);
	const targetLabel = $derived(
		isGaining
			? 'Target Intake (Gain)'
			: isHolding
				? 'Target Intake (Maintain)'
				: 'Target Intake (Loss)'
	);
	const maximumLabel = $derived(
		isGaining ? 'Maximum Intake' : isHolding ? 'Maximum Flexibility' : 'Maximum Limit'
	);
</script>

<div class="bg-base-100 rounded-box p-6 shadow">
	<h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">Calorie Plan</h3>
	<div class="space-y-3">
		{#if !isHolding || dailyRate !== 0}
			<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
				<span class="text-base-content opacity-70">{rateLabel}</span>
				<span class="font-bold text-primary">{dailyRate} kcal</span>
			</div>
		{/if}
		<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
			<span class="text-base-content opacity-70">{targetLabel}</span>
			<span class="font-bold">{targetCalories} kcal</span>
		</div>
		<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
			<span class="text-base-content opacity-70">{maximumLabel}</span>
			<span class="font-bold" class:text-accent={!isGaining && !isHolding}
				>{maximumCalories} kcal</span
			>
		</div>
	</div>
	{#if isHolding}
		<div class="mt-4 p-3 bg-info/10 rounded-lg">
			<p class="text-sm text-base-content opacity-80">
				Your calorie target is set to maintain your current weight. Stay within this range to keep
				your weight stable.
			</p>
		</div>
	{/if}
</div>
