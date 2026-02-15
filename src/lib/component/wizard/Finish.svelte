<script lang="ts">
	import { getWizardContext } from '$lib/context';
	import CaloriePlanCard from '$lib/component/journey/CaloriePlanCard.svelte';
	import TimelineCard from '$lib/component/journey/TimelineCard.svelte';
	import UserProfileCard from '$lib/component/journey/UserProfileCard.svelte';
	import WeightGoalsCard from '$lib/component/journey/WeightGoalsCard.svelte';
	import { AlertBox, AlertType, AlertVariant } from '@thwbh/veilchen';

	// Get wizard state from context
	const wizardState = getWizardContext();
	const { wizardResult, wizardInput, userData, chosenRate, weightTarget, intakeTarget } =
		wizardState;

	// Determine recommendation type
	const recommendation = wizardResult?.recommendation || 'LOSE';
</script>

<div class="flex flex-col gap-6">
	<UserProfileCard
		userName={userData.name!}
		userAvatar={userData.avatar || userData.name!}
		activityLevel={wizardInput.activityLevel || 1}
	/>

	<WeightGoalsCard
		currentWeight={weightTarget!.initialWeight}
		targetWeight={weightTarget!.targetWeight}
	/>

	<CaloriePlanCard
		{recommendation}
		dailyRate={chosenRate}
		targetCalories={intakeTarget!.targetCalories}
		maximumCalories={intakeTarget!.maximumCalories}
		showAverage={false}
		showMaximum={true}
	/>

	<TimelineCard startDate={weightTarget!.startDate} endDate={weightTarget!.endDate} />

	<AlertBox type={AlertType.Info} variant={AlertVariant.Callout}>
		Remember: Small actions can lead to big results!
	</AlertBox>
</div>
