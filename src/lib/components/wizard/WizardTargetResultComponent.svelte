<script lang="ts">
	import { calculateForTargetDate, calculateForTargetWeight } from '$lib/api/wizard';
	import { getDateAsStr } from '$lib/date';
	import { WizardOptions } from '$lib/enum';
	import {
		type ValidationMessage,
		type WizardInput,
		type WizardResult,
		type WizardTargetDateResult,
		type WizardTargetWeightResult
	} from '$lib/model';
	import type { WizardTargetSelection, WizardTargetError } from '$lib/types';
	import TargetComponent from '../TargetComponent.svelte';
	import RadioInputComponent from '../RadioInputComponent.svelte';
	import Alert from '$lib/assets/icons/alert-circle-filled.svg?component';
	import type { WizardTargetSelectionEvent } from '$lib/event';

	interface Props {
		wizardInput: WizardInput;
		wizardResult: WizardResult;
		chosenOption: WizardTargetSelection;
		selectedRate?: any;
		onTargetSelected: (event: WizardTargetSelectionEvent) => void;
	}

	let {
		wizardInput,
		wizardResult,
		chosenOption,
		selectedRate = $bindable(undefined),
		onTargetSelected
	}: Props = $props();

	let errors: WizardTargetError;
	let errorEndDate: ValidationMessage = { valid: true };

	const onWeightRateSelection = (rate: string, startDateStr: string, endDateStr: string) => {
		selectedRate = rate;

		const parameters: WizardTargetSelectionEvent = {
			newWeightTarget: {
				added: getDateAsStr(new Date()),
				startDate: startDateStr,
				endDate: endDateStr,
				initialWeight: +wizardInput.weight,
				targetWeight: +chosenOption.customDetails
			},
			newCalorieTarget: {
				added: getDateAsStr(new Date()),
				startDate: startDateStr,
				endDate: endDateStr,
				targetCalories: +wizardResult.target,
				maximumCalories: wizardResult.tdee
			}
		};

		onTargetSelected(parameters);
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
					{#if chosenOptionWeightResult.dateByRate}
						{@const endDate = chosenOptionWeightResult.dateByRate[selectedRate]}
						{@const weightProgress = chosenOptionWeightResult.progressByRate[selectedRate]}
						<RadioInputComponent
							flexDirection="flex-col"
							bind:value={selectedRate}
							{choices}
							on:change={(changed) =>
								onWeightRateSelection(changed.detail.selection, getDateAsStr(new Date()), endDate)}
						/>
						<div class="flex flex-col flex-grow justify-between">
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
						</div>
					{/if}
				</div>
			{:else if chosenOptionWeightResult.warning}
				<aside class="alert variant-filled-warning">
					<div><Alert /></div>

					<div class="alert-message">
						<h3 class="h3">Warning</h3>
						<p>{chosenOptionWeightResult.message}</p>
					</div>
				</aside>
			{/if}
		{/await}
	{:else if chosenOption.userChoice === WizardOptions.Custom_date}
		{@const chosenOptionDateInput = {
			age: wizardInput.age,
			sex: wizardInput.sex,
			currentWeight: wizardInput.weight,
			height: wizardInput.height,
			calculationGoal: wizardInput.calculationGoal,
			targetDate: chosenOption.customDetails,
			startDate: getDateAsStr(new Date())
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
					{#if chosenOptionDateResult.weightByRate && chosenOptionDateResult.bmiByRate}
						{@const weightResult = chosenOptionDateResult.weightByRate[selectedRate]}
						{@const bmiResult = chosenOptionDateResult.bmiByRate[selectedRate]}
						{@const startDate = getDateAsStr(new Date())}
						{@const endDate = chosenOptionDateInput.targetDate}

						<div>
							<RadioInputComponent
								flexDirection="flex-col"
								bind:value={selectedRate}
								{choices}
								on:change={(changed) => (selectedRate = changed.detail.selection)}
							/>
						</div>
						<div class="flex flex-col flex-grow justify-between">
							<TargetComponent {startDate} {endDate} {errors} {errorEndDate} />

							<p>
								With a rate of {selectedRate}kcal per day, your target weight will be ~{weightResult}kg,
								which leaves you with a BMI of {bmiResult}.
							</p>
						</div>
					{/if}
				</div>
			{:else if chosenOptionDateResult.warning}
				<aside class="alert variant-filled-warning">
					<div><Alert /></div>

					<div class="alert-message">
						<h3 class="h3">Warning</h3>
						<p>{chosenOptionDateResult.message}</p>
					</div>
				</aside>
			{/if}
		{:catch}
			<p>Error</p>
		{/await}
	{/if}
</div>
