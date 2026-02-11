<script lang="ts">
	import { getWizardContext } from '$lib/context';
	import { AlertBox, AlertType, AlertVariant, RangeInput, StatCard } from '@thwbh/veilchen';

	interface Props {
		value: number;
		targetWeightLower: number;
		targetWeightUpper: number;
	}

	let { value = $bindable(), targetWeightLower, targetWeightUpper }: Props = $props();

	// Get wizard state from context
	const wizardState = getWizardContext();
	const { wizardInput, wizardResult } = wizardState;

	// Calculate BMI for the selected target weight
	let targetBmi = $derived.by(() => {
		const heightInMeters = wizardInput.height / 100;
		return (value / (heightInMeters * heightInMeters)).toFixed(1);
	});

	// Calculate weight difference
	let weightDifference = $derived(Math.abs(value - wizardInput.weight).toFixed(1));
	let isIncreasing = $derived(value > wizardInput.weight);
	let isDecreasing = $derived(value < wizardInput.weight);
</script>

<div class="flex flex-col gap-4">
	<RangeInput
		bind:value
		step={0.5}
		min={targetWeightLower}
		max={targetWeightUpper}
		unit="kg"
		label="Target Weight"
	/>

	<div class="bg-base-100 rounded-box p-6 shadow">
		<h3 class="text-lg font-semibold text-base-content mb-4">Target Weight Details</h3>

		<div class="stats stats-horizontal shadow w-full flex-col">
			<StatCard title="Current Weight" value={wizardInput.weight} description="kg" />
			<StatCard title="Target Weight" {value} description="kg" valueClass="text-primary" />
		</div>

		<div class="mt-4 space-y-3">
			<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
				<span class="text-base-content opacity-70">Target BMI</span>
				<span class="font-bold text-primary">{targetBmi}</span>
			</div>

			{#if weightDifference !== '0.0'}
				<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
					<span class="text-base-content opacity-70">Weight Change</span>
					<span class="font-bold" class:text-success={isIncreasing} class:text-error={isDecreasing}>
						{isIncreasing ? '+' : '-'}{weightDifference} kg
					</span>
				</div>
			{/if}
		</div>
	</div>

	<AlertBox type={AlertType.Info} variant={AlertVariant.Callout}>
		<strong>Maintain your healthy weight.</strong>
		<p class="text-sm">
			{#if value === wizardInput.weight}
				You've chosen to maintain your current weight. This is great for staying in your healthy BMI
				range!
			{:else if isIncreasing}
				You've chosen to gain {weightDifference} kg while staying within the healthy range.
			{:else}
				You've chosen to lose {weightDifference} kg while staying within the healthy range.
			{/if}
		</p>
	</AlertBox>
</div>
