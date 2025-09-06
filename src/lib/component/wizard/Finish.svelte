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

<div class="flex flex-col gap-2">
	<p class="text-sm opacity-60">This is your weight loss plan.</p>

	<table class="table">
		<tbody>
			<tr>
				<td>Current Weight</td><td>{weightTarget!.initialWeight} kg</td>
			</tr>
			<tr>
				<td>Target Weight</td><td>{weightTarget!.targetWeight} kg</td>
			</tr>
			<tr>
				<td>Target BMI</td><td>{wizardResult!.targetBmiUpper}</td>
			</tr>
			<tr>
				<td>Chosen Deficit</td><td>{chosenRate} kcal</td>
			</tr>
			<tr>
				<td>Caloric Intake</td><td>{calorieTarget!.targetCalories}</td>
			</tr>
			<tr>
				<td>Calorie Hardcap</td><td>{calorieTarget!.maximumCalories}</td>
			</tr>
			<tr>
				<td>Start Date</td><td>{convertDateStrToDisplayDateStr(weightTarget!.startDate)}</td>
			</tr>
			<tr>
				<td>Planned End Date</td><td>{convertDateStrToDisplayDateStr(weightTarget!.endDate)}</td>
			</tr>
		</tbody>
	</table>
</div>
