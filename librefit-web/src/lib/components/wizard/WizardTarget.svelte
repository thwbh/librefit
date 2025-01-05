<script lang="ts">
	import { type WizardInput, WizardRecommendation, type WizardResult } from '$lib/model';
	import { type WizardTargetSelection } from '$lib/types';
	import { WizardOptions } from '$lib/enum';
	import ValidatedInput from '$lib/components/ValidatedInput.svelte';
	import { convertDateStrToDisplayDateStr, parseStringAsDate } from '../../date';

	export let calculationResult: WizardResult;
	export let calculationInput: WizardInput;

	export let chosenOption: WizardTargetSelection;

	const getActiveClass = (userChoice: WizardOptions) => {
		if (userChoice === chosenOption.userChoice) {
			return 'variant-ringed-primary';
		}

		return '';
	};
</script>

<h2 class="h2">Next steps</h2>
<p>
	Let me assist you with a few suggestions. I created a set of targets for you to choose depending
	on what you want to achieve. You can also set your own, if preferred.
</p>
<div class="flex flex-col gap-4">
	<label class="block card card-hover p-4 {getActiveClass(WizardOptions.Default)}">
		<div class="flex flex-row gap-2">
			<input
				type="radio"
				name="wizard-choice"
				class="self-center"
				value={WizardOptions.Default}
				bind:group={chosenOption.userChoice}
			/>
			<h3 class="h3 self-center">Take my initial values.</h3>
		</div>
		<p>
			I'm fine with what you presented before, set the weight {calculationInput.calculationGoal.toLowerCase()}
			target based on my input.
		</p>
	</label>
	<label class="block card card-hover p-4 {getActiveClass(WizardOptions.Recommended)}">
		<div class="flex flex-row gap-2">
			<input
				type="radio"
				name="wizard-choice"
				class="self-center"
				value={WizardOptions.Recommended}
				bind:group={chosenOption.userChoice}
			/>
			<h3 class="h3 self-center">I'll take your recommendation.</h3>
		</div>
		<p>
			I want to {calculationResult.recommendation.toLowerCase()}
			{calculationResult.recommendation === WizardRecommendation.Hold ? 'my' : 'some'}
			weight. Create a target for that.
		</p>
	</label>

  {#if chosenOption.userChoice === WizardOptions.Custom_weight}
	<label class="block card card-hover p-4 {getActiveClass(WizardOptions.Custom_weight)}">
		<div class="flex flex-row gap-2">
			<input
				type="radio"
				name="wizard-choice"
				class="self-center"
				value={WizardOptions.Custom_weight}
				bind:group={chosenOption.userChoice}
			/>
			<h3 class="h3">I want to reach my dream weight.</h3>
		</div>
		<p>How can I get to my target weight of {chosenOption.customDetails}kg as fast as possible?</p>
	</label>
  {:else if chosenOption.userChoice === WizardOptions.Custom_date}
	<label class="block card card-hover p-4 {getActiveClass(WizardOptions.Custom_date)}">
		<div class="flex flex-row gap-2">
			<input
				type="radio"
				name="wizard-choice"
				class="self-center"
				value={WizardOptions.Custom_date}
				bind:group={chosenOption.userChoice}
			/>
			<h3 class="h3">I have a timeline in mind.</h3>
		</div>
		<p>How much can I achieve until {convertDateStrToDisplayDateStr(chosenOption.customDetails)}?</p>
	</label>

  {/if}
</div>
