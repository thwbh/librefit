<script lang="ts">
	import { calculateForTargetDate, calculateForTargetWeight } from '$lib/api/wizard';
	import { getDateAsStr, parseStringAsDate } from '$lib/date';
	import { WizardOptions } from '$lib/enum';
	import type {
		CalorieTarget,
		ValidationMessage,
		WeightTarget,
		WizardInput,
		WizardTargetDateResult,
		WizardTargetWeightResult
	} from '$lib/model';
	import type { WizardTargetSelection, WizardTargetError } from '$lib/types';
	import { RadioGroup, RadioItem, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import TargetComponent from '../TargetComponent.svelte';
	import RadioInputComponent from '../RadioInputComponent.svelte';
	import WizardResultComponent from './WizardResultComponent.svelte';
	import WizardTarget from './WizardTarget.svelte';

	export let wizardInput: WizardInput;
	export let chosenOption: WizardTargetSelection;

	let rateActive = "700";

	//let calorieTarget: CalorieTarget;
	//let weightTarget: WeightTarget;

	let errors: WizardTargetError;

	let errorEndDate: ValidationMessage = { valid: true };

	const onTabChange = (wizardTargetResult: WizardTargetWeightResult) => {
		//calorieTarget = wizardTargetResult.dateByRate[rateActive].calorieTarget;
		//weightTarget = wizardTargetResult.dateByRate[rateActive].weightTarget;
  
		//errors.calorieTarget = calorieTarget;
		//errors.weightTarget = weightTarget;
	};

  const extractAndSelectRate = (wizardTargetResult: WizardTargetDateResult) => {
    const rates = wizardTargetResult.weightByRate 
        ? Object.keys(wizardTargetResult.weightByRate)
				: [];

    const selectedIndex = rates.length <= 0 ? 0 : rates.length / 2;

    rateActive = `${rates[selectedIndex]}`;

    return rates;
  }
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
			<p>Target weight</p>
		{:then chosenOptionWeightResult}
			{@const rates = chosenOptionWeightResult.dateByRate
				? Object.keys(chosenOptionWeightResult.dateByRate)
				: []}
			{#if rates.length > 0}
        {@const choices = rates.map(rate => { 
          return { label: rate, value: rate } 
        }) }
        <h2 class="h2">Select your rate</h2>
        <div>
					<p>
						The following rates help you achieve your goal with different run times. Pick the one
						you think that suits you best. The outcome will be the same, but a lower rate means it
						your progress will be slower.
					</p>
				</div>

        <div class="flex flex-row gap-2">
            <RadioInputComponent flexDirection="flex-col" bind:value={rateActive} {choices}/> 
            <div class="flex flex-col flex-grow justify-between">
            {#if chosenOptionWeightResult.dateByRate}
              {@const endDate = chosenOptionWeightResult.dateByRate[rateActive] }
              {@const weightProgress = chosenOptionWeightResult.progressByRate[rateActive]}
              <TargetComponent
                  startDate={getDateAsStr(new Date())}
                  {endDate}
                  {errors}
                  {errorEndDate}
              />

              <p class="p-2">
                With a rate of {rateActive}kcal, you should see a {weightProgress}kg difference each week.
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
			<p>Target date</p>
		{:then chosenOptionDateResult}
      {@const rates = extractAndSelectRate(chosenOptionDateResult) }
      {#if rates.length > 0}
        {@const choices = rates.map(rate => { 
          return { label: rate, value: rate } 
        }) }
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
              <RadioInputComponent flexDirection="flex-col" bind:value={rateActive} {choices}/> 
            </div>
            <div class="flex flex-col flex-grow justify-between">
            {#if chosenOptionDateResult.weightByRate && chosenOptionDateResult.bmiByRate}
              {@const weightResult = chosenOptionDateResult.weightByRate[rateActive]}
              {@const bmiResult = chosenOptionDateResult.bmiByRate[rateActive]}
              {@const startDate = getDateAsStr(new Date())}
              {@const endDate = chosenOptionDateInput.targetDate}

              <TargetComponent
                {startDate} 
                {endDate}
                {errors}
                {errorEndDate}
              />

              <p>
                With a rate of {rateActive}kcal, your target weight will be ~{weightResult}kg, 
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
