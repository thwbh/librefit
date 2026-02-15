<script lang="ts">
	import {
		BmiCategorySchema,
		WizardRecommendationSchema,
		type WizardInput,
		type WizardResult
	} from '$lib/api/gen';
	import { AlertBox, AlertType, AlertVariant } from '@thwbh/veilchen';
	import { getBmiCategoryDisplayValue } from '$lib/enum';
	import { z } from 'zod';

	interface Props {
		wizardResult: WizardResult;
		wizardInput: WizardInput;
	}

	const BmiCategory = BmiCategorySchema.enum;
	const WizardRecommendation = WizardRecommendationSchema.enum;

	let { wizardResult, wizardInput }: Props = $props();

	// Check if user is in low-normal BMI range (18.5-19.9)
	let isLowNormalBmi = $derived(
		wizardResult.bmi >= 18.5 &&
			wizardResult.bmi < 20 &&
			wizardResult.recommendation === WizardRecommendation.GAIN
	);

	let classificationLose = z.enum([
		BmiCategory.Obese,
		BmiCategory.SeverelyObese,
		BmiCategory.Overweight
	]);

	const getClassificationStyle = (category: string) => {
		if (classificationLose.safeParse(category).success) {
			return 'bg-error text-content-error';
		} else if (category === BmiCategory.Underweight) {
			return 'bg-warning text-content-warning';
		} else {
			return 'bg-success text-content-success';
		}
	};
</script>

<div class="flex flex-col gap-4">
	<!-- Key Metrics Cards -->
	<div class="grid grid-cols-2 gap-3">
		<div class="rounded-box bg-base-100 border border-base-300 p-4 flex flex-col gap-2">
			<span class="text-xs font-medium opacity-60 uppercase tracking-wide">BMI</span>
			<span class="text-3xl font-bold text-base-content">{wizardResult.bmi}</span>
			<span class="badge badge-sm {getClassificationStyle(wizardResult.bmiCategory)} font-medium">
				{getBmiCategoryDisplayValue(wizardResult.bmiCategory)}
			</span>
		</div>
		<div class="rounded-box bg-base-100 border border-base-300 p-4 flex flex-col gap-2">
			<span class="text-xs font-medium opacity-60 uppercase tracking-wide">Recommendation</span>
			<span class="text-3xl font-bold text-base-content capitalize"
				>{wizardResult.recommendation.toLowerCase()}</span
			>
			<span class="badge badge-sm bg-primary text-primary-content font-medium">
				{wizardInput.weight} kg
			</span>
		</div>
	</div>

	<!-- Metabolic Profile -->
	<div class="rounded-box border border-base-300 overflow-hidden">
		<div class="bg-base-200/50 px-4 py-3 border-b border-base-300">
			<h3 class="text-sm font-semibold text-base-content uppercase tracking-wide">
				Metabolic Profile
			</h3>
		</div>
		<div class="divide-y divide-base-200">
			<div class="flex justify-between items-center px-4 py-3">
				<span class="text-sm text-base-content/70">Age</span>
				<span class="text-sm font-semibold">{wizardInput.age} years</span>
			</div>
			<div class="flex justify-between items-center px-4 py-3">
				<span class="text-sm text-base-content/70">Height</span>
				<span class="text-sm font-semibold">{wizardInput.height} cm</span>
			</div>
			<div class="flex justify-between items-center px-4 py-3">
				<span class="text-sm text-base-content/70">Weight</span>
				<span class="text-sm font-semibold">{wizardInput.weight} kg</span>
			</div>
			<div class="flex justify-between items-center px-4 py-3 bg-primary/5">
				<span class="text-sm font-medium text-base-content">Basal Metabolic Rate</span>
				<span class="text-sm font-bold text-primary">{wizardResult.bmr} kcal</span>
			</div>
			<div class="flex justify-between items-center px-4 py-3 bg-primary/5">
				<span class="text-sm font-medium text-base-content">Daily Energy Expenditure</span>
				<span class="text-sm font-bold text-primary">{wizardResult.tdee} kcal</span>
			</div>
		</div>
	</div>

	<!-- Analysis & Recommendations -->
	<div class="rounded-box border-l-4 border-l-accent bg-base-200/50 p-5">
		<h3 class="text-sm font-semibold text-base-content mb-3 uppercase tracking-wide">Analysis</h3>

		<div class="space-y-3 text-sm text-base-content/80">
			<p class="leading-relaxed">
				Your <span class="font-semibold text-base-content">basal metabolic rate</span> is
				<span class="font-semibold text-primary">{wizardResult.bmr} kcal</span>. To maintain your
				current weight, you should consume approximately
				<span class="font-semibold text-primary">{wizardResult.tdee} kcal</span> per day.
			</p>

			{#if wizardResult.targetBmi}
				<div class="divider my-2"></div>

				<p class="leading-relaxed">
					At {wizardInput.height}cm and {wizardInput.weight}kg, your BMI is
					<span class="font-semibold text-base-content">{wizardResult.bmi}</span>. For your age ({wizardInput.age}
					years), the optimal BMI range is
					<span class="font-semibold"
						>{wizardResult.targetBmiLower} - {wizardResult.targetBmiUpper}</span
					>.
				</p>

				{#if isLowNormalBmi}
					<AlertBox type={AlertType.Info} variant={AlertVariant.Callout}>
						<strong> You are currently in the healthy weight range</strong>
						<p class="text-sm mt-1">
							Your BMI of <span class="font-semibold">{wizardResult.bmi}</span> is in the healthy
							range (18.5-24.9). However, research shows the lowest health risks occur in the
							optimal range of <span class="font-semibold">20-25</span> (approximately
							<span class="font-semibold"
								>{wizardResult.targetWeightLower}kg - {wizardResult.targetWeightUpper}kg</span
							>).
						</p>
						<p class="text-sm mt-2">
							<strong>In the next step</strong>, you can choose whether to maintain your current
							weight or gain towards the optimal range.
						</p>
					</AlertBox>
				{:else if wizardResult.targetBmiLower <= wizardResult.bmi && wizardResult.bmi <= wizardResult.targetBmiUpper}
					<AlertBox type={AlertType.Success} variant={AlertVariant.Callout}>
						<span
							>You are currently <span class="font-bold">in the healthy weight range</span>!</span
						>
					</AlertBox>
				{:else}
					<AlertBox type={AlertType.Warning} variant={AlertVariant.Callout}>
						<strong>Outside healthy range</strong>
						<p class="text-sm">
							Your target weight should be between <span class="font-semibold"
								>{wizardResult.targetWeightLower}kg - {wizardResult.targetWeightUpper}kg</span
							>.
						</p>
					</AlertBox>
				{/if}

				{#if wizardResult.bmiCategory !== BmiCategory.StandardWeight && wizardResult.bmiCategory !== BmiCategory.Overweight}
					<AlertBox type={AlertType.Info} variant={AlertVariant.Callout}>
						<span>It is recommended to consult with a healthcare professional.</span>
					</AlertBox>
				{/if}
			{/if}

			{#if wizardResult.bmiCategory === BmiCategory.Underweight}
				<p class="leading-relaxed">
					To reach a healthy weight ({wizardResult.targetWeightLower}kg), you should consume
					<span class="font-semibold text-primary"
						>{Math.abs(wizardResult.deficit)} kcal surplus</span
					>
					per day (approximately
					<span class="font-semibold text-primary">{wizardResult.target} kcal total</span>) for
					about
					<span class="font-semibold">{Math.abs(wizardResult.durationDaysLower)} days</span>.
				</p>
			{:else if classificationLose.safeParse(wizardResult.bmiCategory).success}
				<p class="leading-relaxed">
					To reach a healthy weight ({wizardResult.targetWeightUpper}kg), you should maintain a
					<span class="font-semibold text-primary"
						>{Math.abs(wizardResult.deficit)} kcal deficit</span
					>
					per day (approximately
					<span class="font-semibold text-primary">{wizardResult.target} kcal total</span>) for
					about
					<span class="font-semibold">{Math.abs(wizardResult.durationDaysUpper)} days</span>.
				</p>
			{/if}
		</div>
	</div>
</div>
