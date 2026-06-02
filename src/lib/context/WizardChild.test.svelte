<script>
	import { getWizardContext } from './wizard';

	const state = getWizardContext();
</script>

<div data-testid="wizard-child">
	<span data-testid="name">{state.userData.name}</span>
	<span data-testid="rate">{state.chosenRate}</span>
	<span data-testid="weight">{state.wizardInput.weight}</span>
</div>
