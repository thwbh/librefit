<script lang="ts">
	import {
		calculateForTargetDate,
		calculateForTargetWeight,
		createTargetDateTargets
	} from '$lib/api/wizard';
	import { getDateAsStr } from '$lib/date';
	import { WizardOptions } from '$lib/enum';
	import type {
		ValidationMessage,
		WizardInput,
		WizardResult,
		WizardTargetDateResult,
		WizardTargetWeightResult
	} from '$lib/model';
	import type {
		WizardTargetSelection,
		WizardTargetError,
		WizardTargetSelectionEvent
	} from '$lib/types';
	import TargetComponent from '../TargetComponent.svelte';
	import RadioInputComponent from '../RadioInputComponent.svelte';
	import { createEventDispatcher } from 'svelte';

	export let wizardInput: WizardInput;
	export let wizardResult: WizardResult;

	export let chosenOption: WizardTargetSelection;

	export let selectedRate = undefined;

	const dispatch = createEventDispatcher();

	let errors: WizardTargetError;

	let errorEndDate: ValidationMessage = { valid: true };

	const onRateSelection = () => {
		const parameters: WizardTargetSelectionEvent = {};

		dispatch('selectedRateChanged', {});
	};

	const extractAndSelectWeightRate = (wizardTargetResult: WizardTargetWeightResult) => {
		const rates = wizardTargetResult.dateByRate ? Object.keys(wizardTargetResult.dateByRate) : [];

		if (selectedRate === undefined) {
			const selectedIndex = rates.length <= 0 ? 0 : Math.floor(rates.length / 2);
			selectedRate = `${rates[selectedIndex]}`;
		}
		return rates;
	};

	const extractAndSelectDateRate = (wizardTargetResult: WizardTargetDateResult) => {
		const rates = wizardTargetResult.weightByRate
			? Object.keys(wizardTargetResult.weightByRate)
			: [];

		if (selectedRate === undefined) {
			const selectedIndex = rates.length <= 0 ? 0 : Math.floor(rates.length / 2);
			selectedRate = `${rates[selectedIndex]}`;
		}

		return rates;
	};

	const getRadioChoices = (rates: Array<string>) => {
		return rates.map((rate) => {
			return { label: rate, value: rate };
		});
	};
</script>

<div class="flex flex-col gap-2">
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
			<p>Calculating...</p>
		{:then chosenOptionWeightResult}
			{@const rates = extractAndSelectWeightRate(chosenOptionWeightResult)}
			{#if rates.length > 0}
				{@const choices = getRadioChoices(rates)}
				<h2 class="h2">Select your rate</h2>
				<div>
					<p>
						The following rates help you achieve your goal with different run times. Pick the one
						you think that suits you best. The outcome will be the same, but a lower rate means it
						your progress will be slower.
					</p>
				</div>

				<div class="flex flex-row gap-2">
					<RadioInputComponent flexDirection="flex-col" bind:value={selectedRate} {choices} />
					<div class="flex flex-col flex-grow justify-between">
						{#if chosenOptionWeightResult.dateByRate}
							{@const endDate = chosenOptionWeightResult.dateByRate[selectedRate]}
							{@const weightProgress = chosenOptionWeightResult.progressByRate[selectedRate]}
							<TargetComponent
								startDate={getDateAsStr(new Date())}
								{endDate}
								{errors}
								{errorEndDate}
							/>

							<p class="p-2">
								With a rate of {selectedRate}kcal per day, you should see a {weightProgress}kg
								difference each week.
							</p>
						{/if}
					</div>
				</div>
			{:else if chosenOptionWeightResult.warning}
				<header class="text-2xl font-bold">Warning</header>

				<p>{chosenOptionWeightResult.message}</p>
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
			<p>Calculating...</p>
		{:then chosenOptionDateResult}
			{@const rates = extractAndSelectDateRate(chosenOptionDateResult)}
			{#if rates.length > 0}
				{@const choices = getRadioChoices(rates)}
				<h2 class="h2">Select your rate</h2>
				<div>
					<p>
						The following rates help you achieve your goal with different run times. Pick the one
						you think that suits you best. The outcome will be the same, but a lower rate means it
						your progress will be slower.
					</p>
				</div>

				<div class="flex flex-row gap-2">
					<div>
						<RadioInputComponent flexDirection="flex-col" bind:value={selectedRate} {choices} />
					</div>
					<div class="flex flex-col flex-grow justify-between">
						{#if chosenOptionDateResult.weightByRate && chosenOptionDateResult.bmiByRate}
							{@const weightResult = chosenOptionDateResult.weightByRate[selectedRate]}
							{@const bmiResult = chosenOptionDateResult.bmiByRate[selectedRate]}
							{@const startDate = getDateAsStr(new Date())}
							{@const endDate = chosenOptionDateInput.targetDate}

							<TargetComponent {startDate} {endDate} {errors} {errorEndDate} />

							<p>
								With a rate of {selectedRate}kcal per day, your target weight will be ~{weightResult}kg,
								which leaves you with a BMI of {bmiResult}.
							</p>
						{/if}
					</div>
				</div>
			{:else if chosenOptionDateResult.warning}
				<header class="text-2xl font-bold">Warning</header>

				<p>{chosenOptionDateResult.message}</p>
			{/if}
		{:catch}
			<p>Error</p>
		{/await}
	{/if}
</div>
