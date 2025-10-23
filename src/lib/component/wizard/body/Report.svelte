<script lang="ts">
	import {
		BmiCategorySchema,
		type BmiCategory,
		type WizardInput,
		type WizardResult
	} from '$lib/api/gen';
	import { StatCard } from '@thwbh/veilchen';
	import { getBmiCategoryDisplayValue } from '$lib/enum';
	import { z } from 'zod';

	interface Props {
		wizardResult: WizardResult;
		wizardInput: WizardInput;
	}

	const BmiCategory = BmiCategorySchema.enum;

	let { wizardResult, wizardInput }: Props = $props();

	let classificationLose = z.enum([
		BmiCategory.Obese,
		BmiCategory.SeverelyObese,
		BmiCategory.Overweight
	]);

	const getClassificationStyle = (category: BmiCategory) => {
		if (classificationLose.safeParse(category).success) {
			return 'badge-error';
		} else if (category === BmiCategory.Underweight) {
			return 'badge-warning';
		} else {
			return 'badge-success';
		}
	};
</script>

<div class="flex flex-col gap-6">
	<!-- Key Metrics Cards -->
	<div class="stats stats-horizontal shadow w-full flex-col">
		<StatCard
			title="Body Mass Index"
			value={wizardResult.bmi}
			description={getBmiCategoryDisplayValue(wizardResult.bmiCategory)}
			descClass="badge {getClassificationStyle(wizardResult.bmiCategory)} badge-sm mt-2"
		/>
		<StatCard
			title="Recommendation"
			value={wizardResult.recommendation.toLowerCase()}
			valueClass="capitalize"
			description={`${wizardInput.weight} kg`}
			descClass="badge badge-primary badge-sm mt-2"
		/>
	</div>

	<!-- Detailed Metrics Table -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<h3 class="text-lg font-semibold text-base-content mb-4">Your Metabolic Profile</h3>
		<table class="table table-sm">
			<tbody>
				<tr>
					<td class="text-base-content opacity-70">Age</td>
					<td class="text-right font-semibold">{wizardInput.age} years</td>
				</tr>

				<tr>
					<td class="text-base-content opacity-70">Height</td>
					<td class="text-right font-semibold">{wizardInput.height} cm</td>
				</tr>

				<tr>
					<td class="text-base-content opacity-70">Current Weight</td>
					<td class="text-right font-semibold">{wizardInput.weight} kg</td>
				</tr>

				<tr class="border-t border-base-300">
					<td class="text-base-content opacity-70">Basal Metabolic Rate</td>
					<td class="text-right font-semibold text-primary">{wizardResult.bmr} kcal</td>
				</tr>

				<tr>
					<td class="text-base-content opacity-70">Total Daily Energy Expenditure</td>
					<td class="text-right font-semibold text-primary">{wizardResult.tdee} kcal</td>
				</tr>
			</tbody>
		</table>
	</div>

	<!-- Analysis & Recommendations -->
	<div class="bg-base-200 rounded-box p-6">
		<h3 class="text-lg font-semibold text-base-content mb-4">Your Analysis</h3>

		<div class="space-y-3 text-base-content opacity-80">
			<p class="leading-relaxed">
				Your <span class="font-semibold text-base-content">basal metabolic rate</span> is
				<span class="font-semibold text-primary">{wizardResult.bmr} kcal</span>. To maintain your
				current weight, you should consume approximately
				<span class="font-semibold text-primary">{wizardResult.tdee} kcal</span> per day.
			</p>

			{#if wizardResult.targetBmi}
				<div class="divider"></div>

				<p class="leading-relaxed">
					At {wizardInput.height}cm and {wizardInput.weight}kg, your BMI is
					<span class="font-semibold text-base-content">{wizardResult.bmi}</span>. For your age ({wizardInput.age}
					years), the optimal BMI range is
					<span class="font-semibold"
						>{wizardResult.targetBmiLower} - {wizardResult.targetBmiUpper}</span
					>.
				</p>

				{#if wizardResult.targetBmiLower <= wizardResult.bmi && wizardResult.bmi <= wizardResult.targetBmiUpper}
					<div class="alert alert-success">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="stroke-current shrink-0 h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
						<span
							>You are currently <span class="font-bold">in the healthy weight range</span>!</span
						>
					</div>
				{:else}
					<div class="alert alert-warning">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="stroke-current shrink-0 h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/></svg
						>
						<div>
							<span class="font-semibold">Outside healthy range</span>
							<p class="text-sm">
								Your target weight should be between <span class="font-semibold"
									>{wizardResult.targetWeightLower}kg - {wizardResult.targetWeightUpper}kg</span
								>.
							</p>
						</div>
					</div>
				{/if}

				{#if wizardResult.bmiCategory !== BmiCategory.StandardWeight && wizardResult.bmiCategory !== BmiCategory.Overweight}
					<div class="alert alert-info">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="stroke-current shrink-0 w-6 h-6"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							></path></svg
						>
						<span>It is recommended to consult with a healthcare professional.</span>
					</div>
				{/if}
			{/if}

			{#if wizardResult.bmiCategory === BmiCategory.Underweight}
				<div class="divider"></div>
				<p class="leading-relaxed">
					To reach a healthy weight ({wizardResult.targetWeightLower}kg), you should consume
					<span class="font-semibold text-primary">{wizardResult.deficit} kcal surplus</span>
					per day (approximately
					<span class="font-semibold text-primary">{wizardResult.target} kcal total</span>) for
					about
					<span class="font-semibold">{wizardResult.durationDaysLower} days</span>.
				</p>
			{:else if classificationLose.safeParse(wizardResult.bmiCategory).success}
				<div class="divider"></div>
				<p class="leading-relaxed">
					To reach a healthy weight ({wizardResult.targetWeightUpper}kg), you should maintain a
					<span class="font-semibold text-primary">{wizardResult.deficit} kcal deficit</span>
					per day (approximately
					<span class="font-semibold text-primary">{wizardResult.target} kcal total</span>) for
					about
					<span class="font-semibold">{wizardResult.durationDaysUpper} days</span>.
				</p>
			{/if}
		</div>
	</div>
</div>
