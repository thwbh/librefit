<script lang="ts">
	import { Stepper } from '@thwbh/veilchen';
	import Body from './body/Body.svelte';
	import SetupComplete from './SetupComplete.svelte';
	import {
		updateUser,
		updateBodyData,
		wizardCreateTargets,
		wizardCalculateTdee,
		wizardCalculateForTargetWeight
	} from '$lib/api/gen/commands';
	import {
		CalculationGoalSchema,
		CalculationSexSchema,
		WizardRecommendationSchema
	} from '$lib/api/gen/types';
	import type {
		LibreUser,
		NewCalorieTarget,
		NewWeightTarget,
		NewWeightTracker,
		WizardInput,
		WizardResult,
		WizardTargetWeightResult
	} from '$lib/api';
	import type { WizardTargetSelection } from '$lib/types';
	import { WizardOptions } from '$lib/enum';
	import Finish from './Finish.svelte';
	import ActivityLevel from './activity/ActivityLevel.svelte';
	import { getDateAsStr } from '$lib/date';
	import Rate from './targets/Rate.svelte';
	import Report from './body/Report.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { error } from '@tauri-apps/plugin-log';
	import { createTargetWeightTargets } from '$lib/api/util';
	import { setWizardContext, tryGetUserContext } from '$lib/context';

	interface Props {
		userData?: LibreUser;
	}

	let {
		userData = {
			id: 1,
			name: 'Arnie',
			avatar: ''
		}
	}: Props = $props();

	const CalculationGoal = CalculationGoalSchema.enum;
	const CalculationSex = CalculationSexSchema.enum;
	const WizardRecommendation = WizardRecommendationSchema.enum;

	let currentStep = $state(1);

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
	let chosenTargetWeight: number = $state(76); // For HOLD/GAIN users to select target weight

	let weightTarget: NewWeightTarget | undefined = $state();
	let calorieTarget: NewCalorieTarget | undefined = $state();

	let showCompletion: boolean = $state(false);
	let isProcessing: boolean = $state(false);
	let processingStep: string = $state('');
	let finishError: boolean = $state(false);
	let isFadingOut: boolean = $state(false);

	// Get user context during component initialization (not in async function)
	const userContext = tryGetUserContext();

	// Set wizard context for child components to access
	setWizardContext({
		get wizardResult() {
			return wizardResult;
		},
		get wizardInput() {
			return wizardInput;
		},
		get userData() {
			return userData;
		},
		get chosenRate() {
			return chosenRate;
		},
		get weightTarget() {
			return weightTarget;
		},
		get calorieTarget() {
			return calorieTarget;
		}
	});

	const onnext = async () => {
		if (currentStep === 1) {
			// Lock in avatar to name if user never opened the picker
			if (!userData.avatar) {
				userData.avatar = userData.name!;
			}
		}

		if (currentStep === 2) {
			weightTracker = {
				added: getDateAsStr(new Date()),
				amount: wizardInput.weight
			};
		}

		if (currentStep === 3) {
			const result = await wizardCalculateTdee({
				input: wizardInput
			});

			if (result) {
				wizardResult = result;

				if (result.recommendation === WizardRecommendation.LOSE) {
					chosenOption.customDetails = result.targetWeightUpper;
				} else if (result.recommendation === WizardRecommendation.HOLD) {
					// Initialize target weight to current weight for HOLD users
					chosenTargetWeight = wizardInput.weight;
				} else if (result.recommendation === WizardRecommendation.GAIN) {
					chosenOption.customDetails = result.targetWeightLower;
					// Also initialize for potential override to HOLD
					chosenTargetWeight = wizardInput.weight;
				}
			}
		}

		if (currentStep === 4) {
			const result = await wizardCalculateForTargetWeight({
				input: {
					age: wizardInput.age,
					sex: wizardInput.sex,
					currentWeight: wizardInput.weight,
					height: wizardInput.height,
					targetWeight: chosenTargetWeight,
					startDate: getDateAsStr(new Date())
				}
			});

			if (result) {
				wizardTargetWeightResult = result;
			}
		}

		if (currentStep === 5) {
			// For GAIN users, check if they selected target weight equal to current weight (maintain)
			const isGainUserMaintaining =
				wizardResult!.recommendation === WizardRecommendation.GAIN &&
				chosenTargetWeight === wizardInput.weight;

			// Determine effective recommendation
			const effectiveRecommendation = isGainUserMaintaining
				? WizardRecommendation.HOLD
				: wizardResult!.recommendation;

			const targets = createTargetWeightTargets(
				wizardInput,
				wizardResult!,
				wizardTargetWeightResult!,
				new Date(),
				effectiveRecommendation === WizardRecommendation.HOLD
					? chosenTargetWeight
					: effectiveRecommendation === WizardRecommendation.LOSE
						? wizardResult!.targetWeightUpper
						: chosenTargetWeight, // Use selected target weight for GAIN
				chosenRate
			);

			weightTarget = targets.weightTarget;
			calorieTarget = targets.calorieTarget;
		}
	};

	const onback = () => {
		finishError = false;
	};

	// Recalculate when target weight changes for GAIN users
	$effect(() => {
		if (
			currentStep === 4 &&
			wizardResult?.recommendation === WizardRecommendation.GAIN &&
			chosenTargetWeight !== wizardInput.weight
		) {
			wizardCalculateForTargetWeight({
				input: {
					age: wizardInput.age,
					sex: wizardInput.sex,
					currentWeight: wizardInput.weight,
					height: wizardInput.height,
					targetWeight: chosenTargetWeight,
					startDate: getDateAsStr(new Date())
				}
			}).then((result) => {
				if (result) {
					wizardTargetWeightResult = result;
				}
			});
		}
	});

	const performSetup = async () => {
		showCompletion = true;
		isProcessing = true;
		finishError = false;

		try {
			processingStep = 'Saving your profile...';
			await new Promise((resolve) => setTimeout(resolve, 800));
			const userResult = await updateUser({
				userName: userData.name!,
				userAvatar: userData.avatar!
			});

			// Update user context so the profile page reflects new data
			if (userContext && userResult) {
				userContext.updateUser({
					id: userResult.id,
					name: userResult.name!,
					avatar: userResult.avatar!
				});
			}

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

			// Invalidate all layout data to refetch user profile
			await invalidateAll();

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
			<Body bind:wizardInput bind:userData />
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
				{#if wizardResult?.recommendation === WizardRecommendation.HOLD}
					<h2 class="text-2xl font-bold text-base-content mb-2">Select Your Target Weight</h2>
				{:else}
					<h2 class="text-2xl font-bold text-base-content mb-2">Choose Your Pace</h2>
				{/if}
				<p class="text-sm text-base-content opacity-60">
					{#if wizardResult?.recommendation === WizardRecommendation.HOLD}
						Choose a target weight within your healthy weight range
					{:else}
						Select a calorie deficit that fits your lifestyle and goals
					{/if}
				</p>
			</div>
			{#if wizardTargetWeightResult}
				{@const rates = Object.keys(wizardTargetWeightResult.dateByRate).map((v) => +v)}
				{@const targetDates = wizardTargetWeightResult.dateByRate}
				{@const targetProgress = wizardTargetWeightResult.progressByRate}
				<Rate
					bind:value={chosenRate}
					{rates}
					{targetDates}
					{targetProgress}
					bind:targetWeight={chosenTargetWeight}
				/>
			{/if}
		{/snippet}

		{#snippet step5()}
			<div class="mb-6">
				<h2 class="text-2xl font-bold text-base-content mb-2">Your Personalized Plan</h2>
				<p class="text-sm text-base-content opacity-60">
					Here's your customized fitness journey roadmap
				</p>
			</div>
			<Finish />
		{/snippet}
	</Stepper>
{/if}

{#if showCompletion}
	<SetupComplete
		{isProcessing}
		{processingStep}
		{isFadingOut}
		hasError={finishError}
		{userData}
		onRetry={handleRetry}
	/>
{/if}
