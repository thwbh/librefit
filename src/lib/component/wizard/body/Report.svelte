<script lang="ts">
	import {
		BmiCategorySchema,
		type BmiCategory,
		type WizardInput,
		type WizardResult
	} from '$lib/api/gen';
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

<div class="flex flex-col gap-4">
	<table class="table table-sm" aria-label="result table">
		<thead>
			<tr>
				<th>Description</th>
				<th>Value</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Age</td>
				<td>{wizardInput.age}</td>
			</tr>

			<tr>
				<td>Height</td>
				<td>{wizardInput.height} cm</td>
			</tr>

			<tr>
				<td>Weight</td>
				<td class="flex flex-row justify-between items-center">
					{wizardInput.weight} kg
					<span class="badge badge-primary text-xs"
						>{wizardResult.recommendation.toLowerCase()}</span
					>
				</td>
			</tr>

			<tr>
				<td>Body Mass Index</td>
				<td class="flex flex-row justify-between items-center">
					{wizardResult.bmi}
					<span class="badge {getClassificationStyle(wizardResult.bmiCategory)} text-xs">
						{getBmiCategoryDisplayValue(wizardResult.bmiCategory)}
					</span>
				</td>
			</tr>

			<tr>
				<td>Basal Metabolic Rate</td>
				<td>{wizardResult.bmr} kcal</td>
			</tr>

			<tr>
				<td>Total Daily Energy Expediture</td>
				<td>{wizardResult.tdee} kcal</td>
			</tr>
		</tbody>
	</table>

	<p>
		Based on your input, your basal metabolic rate is {wizardResult.bmr}kcal. Your daily calorie
		consumption to hold your weight should be around {wizardResult.tdee}kcal.
	</p>

	<p>
		Having {wizardInput.weight}kg at {wizardInput.height}cm height means you have a BMI of
		{wizardResult.bmi}.

		{#if wizardResult.targetBmi}
			At your age of {wizardInput.age},

			{#if wizardResult.targetBmiLower <= wizardResult.bmi && wizardResult.bmi <= wizardResult.targetBmiUpper}
				you are currently in
			{:else}
				you are out of
			{/if}

			the optimal BMI range of {wizardResult.targetBmiLower} to {wizardResult.targetBmiUpper},
			leaving you
			<span class="font-bold">
				{getBmiCategoryDisplayValue(wizardResult.bmiCategory).toLowerCase()}.
			</span>

			<span class="underline">
				{#if wizardResult.bmiCategory !== BmiCategory.StandardWeight && wizardResult.bmiCategory !== BmiCategory.Overweight}
					It is recommended to consult with a healthcare professional.
				{/if}
			</span>

			Your weight should be around {wizardResult.targetWeight}kg or between
			{wizardResult.targetWeightLower}kg and {wizardResult.targetWeightUpper}kg.
		{/if}
	</p>

	{#if wizardResult.bmiCategory === BmiCategory.Underweight}
		<p>
			To reach the lower bound of the optimal weight within your standard weight range ({wizardResult.targetWeightLower}kg
			- {wizardResult.targetWeightUpper}kg), you will need to consume calories at a surplus of {wizardResult.deficit}kcal
			for {wizardResult.durationDaysLower}
			days. Your caloric intake should be around {wizardResult.target}kcal during that time.
		</p>
	{:else if classificationLose.safeParse(wizardResult.bmiCategory).success}
		<p>
			To reach the optimal weight within the standard weight range ({wizardResult.targetWeightLower}kg
			- {wizardResult.targetWeightUpper}kg), you will need to consume calories at a difference of {wizardResult.deficit}kcal
			for
			{wizardResult.durationDaysUpper} days. Your caloric intake should be around {wizardResult.target}kcal
			during that time.
		</p>
	{/if}
</div>
