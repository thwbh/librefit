<script lang="ts">
	import { validateTargetAmount } from '$lib/validation';
	import ValidatedInput from '$lib/components/ValidatedInput.svelte';
	import type { CalorieTarget, ValidationMessage, WeightTarget } from '$lib/model';
	import type { WizardTargetError } from '$lib/types';

	export let startDate: Date;
	export let endDate: Date;

	export let errors: WizardTargetError;
	export let errorEndDate: ValidationMessage = {
		valid: true
	};

	export let weightTarget: WeightTarget;
	export let calorieTarget: CalorieTarget;
</script>

<div>
	<form class="variant-ringed p-4 space-y-4 rounded-container-token">
		<ValidatedInput name="startDate" type="date" label="Begin" required bind:value={startDate} />

		<ValidatedInput
			name="endDate"
			type="date"
			label="End"
			required
			bind:value={endDate}
			errorMessage={errorEndDate.errorMessage}
		/>

		{#if weightTarget}
			<ValidatedInput
				name="initialWeight"
				type="number"
				label="Starting weight"
				required
				unit="kg"
				bind:value={weightTarget.initialWeight}
				emptyMessage="Please enter a valid initial weight."
				validateDetail={validateTargetAmount}
				errorMessage={errors.weightTarget.initialWeight.errorMessage}
			/>

			<ValidatedInput
				name="targetWeight"
				type="number"
				label="Target weight"
				required
				unit="kg"
				bind:value={weightTarget.targetWeight}
				emptyMessage="Please enter a valid target weight."
				validateDetail={validateTargetAmount}
				errorMessage={errors.weightTarget.targetWeight.errorMessage}
			/>
		{/if}

		{#if calorieTarget}
			<ValidatedInput
				name="targetCalories"
				type="number"
				label="Target intake"
				required
				unit="kcal"
				bind:value={calorieTarget.targetCalories}
				emptyMessage="Please enter a valid target amount."
				validateDetail={validateTargetAmount}
				errorMessage={errors.calorieTarget.targetCalories.errorMessage}
			/>

			<ValidatedInput
				name="maximumCalories"
				type="number"
				label="Maximum intake"
				required
				unit="kcal"
				bind:value={calorieTarget.maximumCalories}
				emptyMessage="Please enter a valid maximum amount."
				validateDetail={validateTargetAmount}
				errorMessage={errors.calorieTarget.maximumCalories.errorMessage}
			/>
		{/if}
	</form>
</div>

