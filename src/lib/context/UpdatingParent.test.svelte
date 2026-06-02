<script>
	import { setWizardContext } from './wizard';
	import WizardChild from './WizardChild.test.svelte';

	// Set initial context during initialization
	setWizardContext({
		wizardInput: {
			age: 25,
			sex: 'FEMALE',
			weight: 65,
			height: 165,
			activityLevel: 1,
			calculationGoal: 'LOSS',
			weeklyDifference: 0.5
		},
		userData: { id: 1, name: 'Alice', avatar: 'alice-seed' },
		chosenRate: 500
	});

	// Update the rate
	setWizardContext({
		wizardInput: {
			age: 25,
			sex: 'FEMALE',
			weight: 65,
			height: 165,
			activityLevel: 1,
			calculationGoal: 'LOSS',
			weeklyDifference: 0.5
		},
		userData: { id: 1, name: 'Alice', avatar: 'alice-seed' },
		chosenRate: 750
	});
</script>

<WizardChild />
