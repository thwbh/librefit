<script lang="ts">
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import { AlertBox, AlertType, StatCard } from '@thwbh/veilchen';
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
	<!-- Weight Goals Card -->
	<div class="bg-base-100">
		<div class="stats stats-horizontal shadow w-full flex-col">
			<StatCard title="Current Weight" value={weightTarget!.initialWeight} description="kg" />
			<StatCard
				title="Target Weight"
				value={weightTarget!.targetWeight}
				description="kg"
				valueClass="text-primary"
			/>
		</div>
	</div>

	<!-- Calorie Plan Card -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
			Calorie Plan
		</h3>
		<div class="space-y-3">
			<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
				<span class="text-base-content opacity-70">Daily Deficit</span>
				<span class="font-bold text-primary">{chosenRate} kcal</span>
			</div>
			<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
				<span class="text-base-content opacity-70">Target Intake</span>
				<span class="font-bold">{calorieTarget!.targetCalories} kcal</span>
			</div>
			<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
				<span class="text-base-content opacity-70">Maximum Limit</span>
				<span class="font-bold text-error">{calorieTarget!.maximumCalories} kcal</span>
			</div>
		</div>
	</div>

	<!-- Timeline Card -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">Timeline</h3>
		<div class="space-y-4">
			<div class="flex items-center gap-4">
				<div
					class="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
				>
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
				<div
					class="flex-shrink-0 w-12 h-12 rounded-full bg-success/20 flex items-center justify-center"
				>
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
	<AlertBox type={AlertType.Info}>
		<strong>Remember:</strong>
		<p class="text-sm">Consistency is key. Small daily actions lead to big results!</p>
	</AlertBox>
</div>
