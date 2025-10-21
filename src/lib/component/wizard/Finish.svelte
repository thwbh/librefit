<script lang="ts">
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import type { NewCalorieTarget, NewWeightTarget, WizardResult } from '$lib/api/gen';

	interface Props {
		wizardResult?: WizardResult;
		chosenRate?: number;
		weightTarget?: NewWeightTarget;
		calorieTarget?: NewCalorieTarget;
	}

	let { wizardResult, chosenRate, weightTarget, calorieTarget }: Props = $props();
</script>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="text-center">
		<h2 class="text-2xl font-bold text-base-content mb-2">Your Personalized Plan</h2>
		<p class="text-sm text-base-content opacity-60">
			Here's your customized fitness journey roadmap
		</p>
	</div>

	<!-- Weight Goals Card -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
			<span>🎯</span> Weight Goals
		</h3>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<p class="text-sm text-base-content opacity-60 mb-1">Current Weight</p>
				<p class="text-3xl font-bold text-base-content">{weightTarget!.initialWeight}</p>
				<p class="text-xs text-base-content opacity-50">kg</p>
			</div>
			<div>
				<p class="text-sm text-base-content opacity-60 mb-1">Target Weight</p>
				<p class="text-3xl font-bold text-primary">{weightTarget!.targetWeight}</p>
				<p class="text-xs text-base-content opacity-50">kg</p>
			</div>
		</div>
		<div class="mt-4 pt-4 border-t border-base-300">
			<div class="flex justify-between items-center">
				<span class="text-sm text-base-content opacity-70">Target BMI</span>
				<span class="badge badge-success">{wizardResult!.targetBmiUpper}</span>
			</div>
		</div>
	</div>

	<!-- Calorie Plan Card -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
			<span>🍽️</span> Calorie Plan
		</h3>
		<div class="space-y-3">
			<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
				<span class="text-base-content opacity-70">Daily Deficit</span>
				<span class="font-bold text-warning">{chosenRate} kcal</span>
			</div>
			<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
				<span class="text-base-content opacity-70">Target Intake</span>
				<span class="font-bold text-primary">{calorieTarget!.targetCalories} kcal</span>
			</div>
			<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
				<span class="text-base-content opacity-70">Maximum Limit</span>
				<span class="font-bold text-error">{calorieTarget!.maximumCalories} kcal</span>
			</div>
		</div>
	</div>

	<!-- Timeline Card -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
			<span>📅</span> Timeline
		</h3>
		<div class="space-y-4">
			<div class="flex items-center gap-4">
				<div class="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
					<span class="text-primary font-bold">🚀</span>
				</div>
				<div class="flex-1">
					<p class="text-sm text-base-content opacity-60">Start Date</p>
					<p class="font-semibold text-base-content">
						{convertDateStrToDisplayDateStr(weightTarget!.startDate)}
					</p>
				</div>
			</div>

			<div class="divider my-2"></div>

			<div class="flex items-center gap-4">
				<div class="flex-shrink-0 w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
					<span class="text-success font-bold">🎉</span>
				</div>
				<div class="flex-1">
					<p class="text-sm text-base-content opacity-60">Target Date</p>
					<p class="font-semibold text-base-content">
						{convertDateStrToDisplayDateStr(weightTarget!.endDate)}
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Encouragement Message -->
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
		<span>
			<span class="font-semibold">Remember:</span> Consistency is key. Small daily actions lead to
			big results!
		</span>
	</div>
</div>
