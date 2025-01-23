<script lang="ts">
	import { BmiCategory, type WizardInput, type WizardResult } from '$lib/model';
	import { getBmiCategoryDisplayValue } from '$lib/enum';

	interface Props {
		calculationResult: WizardResult;
		calculationInput: WizardInput;
	}

	let { calculationResult, calculationInput }: Props = $props();
</script>

<h2 class="h2">Your result</h2>

<div class="table-container">
	<table class="table table-compact" aria-label="result table">
		<thead>
			<tr>
				<th>Description</th>
				<th colspan="2">Value</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Basal Metabolic Rate</td>
				<td>kcal</td>
				<td>{calculationResult.bmr}</td>
			</tr>

			<tr>
				<td>Total Daily Energy Expediture</td>
				<td>kcal</td>
				<td>{calculationResult.tdee}</td>
			</tr>

			<tr>
				<td>Target deficit</td>
				<td>kcal</td>
				<td>{calculationResult.deficit}</td>
			</tr>

			<tr>
				<td>Target intake</td>
				<td>kcal</td>
				<td>{calculationResult.target}</td>
			</tr>
		</tbody>
	</table>
</div>

<h2 class="h2">Body parameters</h2>

<div class="table-container">
	<table class="table table-compact" aria-label="body parameter table">
		<thead>
			<tr>
				<th>Description</th>
				<th colspan="2">Value</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Age</td>
				<td></td>
				<td>{calculationInput.age}</td>
			</tr>

			<tr>
				<td>Height</td>
				<td>cm</td>
				<td>{calculationInput.height}</td>
			</tr>

			<tr>
				<td>Weight</td>
				<td>kg</td>
				<td>{calculationInput.weight}</td>
			</tr>

			<tr>
				<td>Body Mass Index</td>
				<td></td>
				<td>{calculationResult.bmi}</td>
			</tr>

			<tr>
				<td>Classification</td>
				<td></td>
				<td>{getBmiCategoryDisplayValue(calculationResult.bmiCategory)}</td>
			</tr>

			<tr>
				<td>Recommendation</td>
				<td></td>
				<td>{calculationResult.recommendation.toLowerCase()}</td>
			</tr>
		</tbody>
	</table>
</div>

<h2 class="h2">Explanation</h2>
<p>
	Based on your input, your basal metabolic rate is {calculationResult.bmr}kcal. Your daily calorie
	consumption to hold your weight should be around {calculationResult.tdee}kcal.
</p>

<p>
	Having {calculationInput.weight}kg at {calculationInput.height}cm height means you have a BMI of
	{calculationResult.bmi}.

	{#if calculationResult.targetBmi}
		At your age of {calculationInput.age},

		{#if calculationResult.targetBmiLower <= calculationResult.bmi && calculationResult.bmi <= calculationResult.targetBmiUpper}
			you are currently in
		{:else}
			you are out of
		{/if}

		the optimal BMI range of {calculationResult.targetBmiLower} to {calculationResult.targetBmiUpper},
		leaving you
		<span class="font-bold">
			{getBmiCategoryDisplayValue(calculationResult.bmiCategory).toLowerCase()}.
		</span>

		<span class="underline">
			{#if calculationResult.bmiCategory !== BmiCategory.Standard_Weight && calculationResult.bmiCategory !== BmiCategory.Overweight}
				It is recommended to consult with a healthcare professional.
			{/if}
		</span>

		Your weight should be around {calculationResult.targetWeight}kg or between
		{calculationResult.targetWeightLower}kg and {calculationResult.targetWeightUpper}kg.
	{/if}
</p>

{#if calculationResult.bmiCategory === BmiCategory.Underweight}
	<p>
		To reach the lower bound of the optimal weight within your standard weight range ({calculationResult.targetWeightLower}kg
		- {calculationResult.targetWeightUpper}kg), you will need to consume calories at a surplus of {calculationResult.deficit}kcal
		for {calculationResult.durationDaysLower}
		days. Your caloric intake should be around {calculationResult.target}kcal during that time.
	</p>
{:else if calculationResult.bmiCategory === BmiCategory.Overweight || calculationResult.bmiCategory === BmiCategory.Obese || calculationResult.bmiCategory === BmiCategory.Severely_obese}
	<p>
		To reach the optimal weight within the standard weight range ({calculationResult.targetWeightLower}kg
		- {calculationResult.targetWeightUpper}kg), you will need to consume calories at a difference of {calculationResult.deficit}kcal
		for
		{calculationResult.durationDaysUpper} days. Your caloric intake should be around {calculationResult.target}kcal
		during that time.
	</p>
{/if}
