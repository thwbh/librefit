<script>
	import { setWizardContext } from './wizard';
	import WizardChild from './WizardChild.test.svelte';

	// Set context during initialization - this is the correct way
	setWizardContext({
		wizardInput: {
			age: 30,
			sex: 'FEMALE',
			weight: 70,
			height: 170,
			activityLevel: 1,
			calculationGoal: 'GAIN',
			weeklyDifference: 0.3
		},
		userData: { id: 1, name: 'Alice', avatar: 'avatar-seed' },
		chosenRate: 500
	});
</script>

<WizardChild />
