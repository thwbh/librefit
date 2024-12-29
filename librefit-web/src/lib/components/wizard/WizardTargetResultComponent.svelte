<script lang="ts">
	import { calculateForTargetDate, calculateForTargetWeight } from '$lib/api/wizard';
	import { getDateAsStr } from '$lib/date';
	import { WizardOptions } from '$lib/enum';
	import type {
		CalorieTarget,
		ValidationMessage,
		WeightTarget,
		WizardInput,
		WizardTargetWeightResult
	} from '$lib/model';
	import type { WizardTargetSelection, WizardTargetError } from '$lib/types';
	import { Tab, TabGroup } from '@skeletonlabs/skeleton';
	import TargetComponent from '../TargetComponent.svelte';

	export let wizardInput: WizardInput;
	export let chosenOption: WizardTargetSelection;

	let rateActive = 700;

	let calorieTarget: CalorieTarget;
	let weightTarget: WeightTarget;

	let errors: WizardTargetError;

	let errorEndDate: ValidationMessage = { valid: true };

	const onTabChange = (wizardTargetResult: WizardTargetWeightResult) => {
		calorieTarget = wizardTargetResult.dateByRate[rateActive].calorieTarget;
		weightTarget = wizardTargetResult.dateByRate[rateActive].weightTarget;

		errors.calorieTarget = calorieTarget;
		errors.weightTarget = weightTarget;
	};
</script>

<div>
	<h2>Select your rate</h2>

	{#if chosenOption.userChoice === WizardOptions.Custom_weight}
		{@const chosenOptionWeightInput = {
			age: wizardInput.age,
			sex: wizardInput.sex,
			currentWeight: wizardInput.weight,
			height: wizardInput.height,
			targetWeight: +chosenOption.customDetails,
			startDate: getDateAsStr(new Date())
		}}
		{#await calculateForTargetWeight(chosenOptionWeightInput)}
			<p>Target weight</p>
		{:then chosenOptionWeightResult}
			{@const rates = chosenOptionWeightResult.dateByRate
				? Object.keys(chosenOptionWeightResult.dateByRate)
				: []}
			{#if rates.length > 0}
				<div>
					<p>
						The following rates help you achieve your goal with different run times. Pick the one
						you think that suits you best. The outcome will be the same, but a lower rate means it
						your progress will be slower.
					</p>
				</div>

				<TabGroup class="flex-wrap" flex="flex-wrap">
					{#each rates as rate}
						<Tab
							bind:group={rateActive}
							name={rate}
							value={rate}
							on:change={() => onTabChange(chosenOptionWeightResult)}
						>
							<span>{rate}</span>
						</Tab>
					{/each}

					<!-- Tab Panels --->
					<svelte:fragment slot="panel">
						{#if chosenOptionWeightResult.dateByRate}
							{@const calorieTarget = chosenOptionWeightResult.dateByRate[rateActive].calorieTarget}
							{@const weightTarget = chosenOptionWeightResult.dateByRate[rateActive].weightTarget}
							<TargetComponent
								startDate={calorieTarget.startDate}
								endDate={calorieTarget.endDate}
								{errors}
								{errorEndDate}
								{calorieTarget}
								{weightTarget}
							/>
						{/if}
					</svelte:fragment>
				</TabGroup>
			{:else if chosenOptionWeightResult.warning}
				<header class="text-2xl font-bold">Warning</header>

				<p>{chosenOptionWeightResult.warning}</p>
			{:else}
				<header class="text-2xl font-bold">Set target</header>

				<TargetComponent
					{startDate}
					{endDate}
					{errors}
					{errorEndDate}
					{calorieTarget}
					{weightTarget}
				/>
			{/if}
		{/await}
	{:else if chosenOption.userChoice === WizardOptions.Custom_date}
		{@const chosenOptionDateInput = {
			age: wizardInput.age,
			sex: wizardInput.sex,
			currentWeight: wizardInput.weight,
			height: wizardInput.height,
			calculationGoal: wizardInput.calculationGoal,
			targetDate: chosenOption.customDetails
		}}
		{#await calculateForTargetDate(chosenOptionDateInput)}
			<p>Target date</p>
		{/await}
	{/if}
</div>
