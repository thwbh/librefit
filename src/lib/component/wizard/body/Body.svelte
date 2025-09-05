<script lang="ts">
	import { ButtonGroup, RangeInput } from '@thwbh/veilchen';
	import type { KeyValuePair } from '@thwbh/veilchen';
	import { CalculationSex, type WizardInput } from '$lib/model';

	interface Props {
		wizardInput: WizardInput;
	}

	let { wizardInput = $bindable() }: Props = $props();

	let sexSelection: Array<KeyValuePair> = [
		{ key: CalculationSex.Male, value: 'Male' },
		{ key: CalculationSex.Female, value: 'Female' }
	];
</script>

<div class="p-4">
	<fieldset class="fieldset">
		<RangeInput label="Age" min={18} max={99} bind:value={wizardInput.age} />

		<RangeInput label="Height" min={100} max={220} unit="cm" bind:value={wizardInput.height} />

		<RangeInput label="Weight" min={30} max={300} unit="kg" bind:value={wizardInput.weight} />

		<ButtonGroup label="Sex" bind:value={wizardInput.sex} entries={sexSelection} />
	</fieldset>
</div>
