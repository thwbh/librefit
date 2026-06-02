<script>
	import { setWizardContext } from './wizard';
	import SafeWizardChild from './SafeWizardChild.test.svelte';

	// Set context during initialization - this is the correct way
	setWizardContext({
		wizardInput: {
			age: 30,
			sex: 'MALE',
			weight: 80,
			height: 180,
			activityLevel: 2,
			calculationGoal: 'LOSS',
			weeklyDifference: 0.7
		},
		userData: { id: 2, name: 'Bob', avatar: 'bob-seed' },
		chosenRate: 750
	});
</script>

<SafeWizardChild />
