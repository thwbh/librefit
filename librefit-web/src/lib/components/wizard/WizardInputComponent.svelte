<script lang="ts">
	import { CalculationSex, type WizardInput } from '$lib/model';
	import type { RadioInputChoice } from '$lib/types';
	import RangeInputComponent from '../RangeInputComponent.svelte';
	import RadioInputComponent from '../RadioInputComponent.svelte';

	export let wizardInput: WizardInput;

	const choices: Array<RadioInputChoice> = [
		{ value: CalculationSex.Male, label: 'Male' },
		{ value: CalculationSex.Female, label: 'Female' }
	];
</script>

<form class="flex flex-col gap-2 variant-ringed p-4 space-y-4 rounded-container-token">
	<RangeInputComponent
		label="Age"
		name="age"
		rangeMin="18"
		rangeMax="99"
		bind:rangeValue={wizardInput.age}
	/>

	<RangeInputComponent
		label="Height"
		name="height"
		rangeMin="100"
		rangeMax="220"
		bind:rangeValue={wizardInput.height}
	/>

	<RangeInputComponent
		label="Weight"
		name="weight"
		rangeMin="30"
		rangeMax="300"
		bind:rangeValue={wizardInput.weight}
	/>

	<RadioInputComponent bind:value={wizardInput.sex} {choices} label="Sex" />
</form>
