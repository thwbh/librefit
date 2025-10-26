<script lang="ts">
	import { Stepper } from '@thwbh/veilchen';
	import Body from './body/Body.svelte';
	import SetupComplete from './SetupComplete.svelte';
	import {
		CalculationGoalSchema,
		CalculationSexSchema,
		updateBodyData,
		updateUser,
		wizardCalculateForTargetWeight,
		wizardCalculateTdee,
		wizardCreateTargets,
		WizardRecommendationSchema,
		type LibreUser,
		type NewCalorieTarget,
		type NewWeightTarget,
		type NewWeightTracker,
		type WizardInput,
		type WizardResult,
		type WizardTargetWeightResult
	} from '$lib/api/gen';
	import type { WizardTargetSelection } from '$lib/types';
	import { WizardOptions } from '$lib/enum';
	import Finish from './Finish.svelte';
	import ActivityLevel from './activity/ActivityLevel.svelte';
	import { getDateAsStr } from '$lib/date';
	import Rate from './targets/Rate.svelte';
	import Report from './body/Report.svelte';
	import { goto } from '$app/navigation';
	import { error } from '@tauri-apps/plugin-log';
	import { createTargetWeightTargets } from '$lib/api/util';

	const CalculationGoal = CalculationGoalSchema.enum;
	const CalculationSex = CalculationSexSchema.enum;
	const WizardRecommendation = WizardRecommendationSchema.enum;

	let currentStep = $state(1);

	let userInput: LibreUser = $state({
		id: 1,
		name: 'Arnie',
		avatar: ''
	});

	let wizardInput: WizardInput = $state({
		age: 30,
		sex: CalculationSex.MALE,
		weight: 85,
		height: 180,
		activityLevel: 1,
		weeklyDifference: 1,
		calculationGoal: CalculationGoal.LOSS
	});

	let wizardResult: WizardResult | undefined = $state();
	let weightTracker: NewWeightTracker | undefined = $state();

	let chosenOption: WizardTargetSelection = $state({
		customDetails: 76,
		userChoice: WizardOptions.Custom_weight
	});

	let wizardTargetWeightResult: WizardTargetWeightResult | undefined = $state();
	let chosenRate: number = $state(500);

	let weightTarget: NewWeightTarget | undefined = $state();
	let calorieTarget: NewCalorieTarget | undefined = $state();

	let showCompletion: boolean = $state(false);
	let isProcessing: boolean = $state(false);
	let processingStep: string = $state('');
	let finishError: boolean = $state(false);
	let isFadingOut: boolean = $state(false);

	const onnext = async () => {
		if (currentStep === 1) {
			// Lock in avatar to name if user never opened the picker
			if (!userInput.avatar) {
				userInput.avatar = userInput.name!;
			}
		}

		if (currentStep === 2) {
			weightTracker = {
				added: getDateAsStr(new Date()),
				amount: wizardInput.weight
			};
		}

		if (currentStep === 3) {
			wizardResult = await wizardCalculateTdee({
				input: wizardInput
			});

			if (wizardResult.recommendation === WizardRecommendation.LOSE) {
				chosenOption.customDetails = wizardResult.targetWeightUpper;
			} else if (wizardResult.recommendation === WizardRecommendation.HOLD) {
				chosenOption.customDetails = wizardResult.targetWeight;
			} else {
				chosenOption.customDetails = wizardResult.targetWeightLower;
			}
		}

		if (currentStep === 4) {
			wizardTargetWeightResult = await wizardCalculateForTargetWeight({
				input: {
					age: wizardInput.age,
					sex: wizardInput.sex,
					currentWeight: wizardInput.weight,
					height: wizardInput.height,
					targetWeight: wizardResult!.targetWeight,
					startDate: getDateAsStr(new Date())
				}
			});
		}

		if (currentStep === 5) {
			const targets = createTargetWeightTargets(
				wizardInput,
				wizardResult!,
				wizardTargetWeightResult!,
				new Date(),
				wizardResult!.targetWeightUpper,
				chosenRate
			);

			weightTarget = targets.weightTarget;
			calorieTarget = targets.calorieTarget;
		}
	};

	const onback = () => {
		finishError = false;
	};

	const performSetup = async () => {
		showCompletion = true;
		isProcessing = true;
		finishError = false;

		try {
			processingStep = 'Saving your profile...';
			await new Promise((resolve) => setTimeout(resolve, 800));
			await updateUser({
				userName: userInput.name!,
				userAvatar: userInput.avatar!
			});

			processingStep = 'Recording body measurements...';
			await new Promise((resolve) => setTimeout(resolve, 800));
			await updateBodyData({
				age: wizardInput.age,
				sex: wizardInput.sex,
				height: wizardInput.height,
				weight: wizardInput.weight
			});

			processingStep = 'Creating your personalized plan...';
			await new Promise((resolve) => setTimeout(resolve, 800));
			await wizardCreateTargets({
				input: {
					weightTracker: weightTracker!,
					weightTarget: weightTarget!,
					calorieTarget: calorieTarget!
				}
			});

			processingStep = 'All set! Taking you to your dashboard...';
			isProcessing = false;

			// Wait a moment to show success message
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Start fade out transition
			isFadingOut = true;

			// Wait for fade out animation to complete
			await new Promise((resolve) => setTimeout(resolve, 1000));

			goto('/');
		} catch (e) {
			error(`Error during setup: ${e}`);
			finishError = true;
			isProcessing = false;
			processingStep = 'An error occurred. Please try again.';
		}
	};

	const onfinish = async () => {
		await performSetup();
	};

	const handleRetry = () => {
		isFadingOut = false;
		performSetup();
	};
</script>

{#if !showCompletion}
	<Stepper bind:currentStep backLabel="Back" {onnext} {onback} {onfinish}>
		{#snippet step1()}
			<div class="mb-6">
				<h2 class="text-2xl font-bold text-base-content mb-2">Body Parameters</h2>
				<p class="text-sm text-base-content opacity-60">
					Let's start with some basic information about you
				</p>
			</div>
			<Body bind:wizardInput bind:userInput />
		{/snippet}

		{#snippet step2()}
			<div class="mb-6">
				<h2 class="text-2xl font-bold text-base-content mb-2">Activity Level</h2>
				<p class="text-sm text-base-content opacity-60">
					How active are you during your day? Choose what describes your daily activity level best.
				</p>
			</div>
			<ActivityLevel bind:value={wizardInput.activityLevel} />
		{/snippet}

		{#snippet step3()}
			<div class="mb-6">
				<h2 class="text-2xl font-bold text-base-content mb-2">Your Results</h2>
				<p class="text-sm text-base-content opacity-60">
					Here's what your body composition and metabolism look like
				</p>
			</div>
			{#if wizardResult}
				<Report {wizardInput} {wizardResult} />
			{/if}
		{/snippet}

		{#snippet step4()}
			<div class="mb-6">
				<h2 class="text-2xl font-bold text-base-content mb-2">Choose Your Pace</h2>
				<p class="text-sm text-base-content opacity-60">
					Select a calorie deficit that fits your lifestyle and goals
				</p>
			</div>
			{#if wizardTargetWeightResult}
				{@const rates = Object.keys(wizardTargetWeightResult.dateByRate).map((v) => +v)}
				{@const targetDates = wizardTargetWeightResult.dateByRate}
				{@const targetProgress = wizardTargetWeightResult.progressByRate}
				<Rate bind:value={chosenRate} {rates} {targetDates} {targetProgress} />
			{/if}
		{/snippet}

		{#snippet step5()}
			<div class="mb-6">
				<h2 class="text-2xl font-bold text-base-content mb-2">Your Personalized Plan</h2>
				<p class="text-sm text-base-content opacity-60">
					Here's your customized fitness journey roadmap
				</p>
			</div>
			<Finish
				{wizardResult}
				{wizardInput}
				{userInput}
				{chosenRate}
				{weightTarget}
				{calorieTarget}
			/>
		{/snippet}
	</Stepper>
{/if}

{#if showCompletion}
	<SetupComplete
		{isProcessing}
		{processingStep}
		{isFadingOut}
		hasError={finishError}
		{userInput}
		onRetry={handleRetry}
	/>
{/if}
