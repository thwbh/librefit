<script lang="ts">
	import { AlertBox, AlertType, Stepper } from '@thwbh/veilchen';
	import Body from './body/Body.svelte';
	import {
		CalculationGoal,
		CalculationSex,
		WizardRecommendation,
		type LibreUser,
		type NewCalorieTarget,
		type NewWeightTarget,
		type NewWeightTracker,
		type WizardInput,
		type WizardResult,
		type WizardTargetWeightResult
	} from '$lib/model';
	import type { WizardTargetSelection } from '$lib/types';
	import { WizardOptions } from '$lib/enum';
	import Finish from './Finish.svelte';
	import {
		calculateForTargetWeight,
		calculateTdee,
		createTargetWeightTargets,
		postWizardResult
	} from '$lib/api/wizard';
	import ActivityLevel from './activity/ActivityLevel.svelte';
	import { getDateAsStr } from '$lib/date';
	import Rate from './targets/Rate.svelte';
	import Report from './body/Report.svelte';
	import { setBodyData } from '$lib/api/body';
	import { goto } from '$app/navigation';
	import { error } from '@tauri-apps/plugin-log';
	import Profile from '../profile/Profile.svelte';
	import { updateProfile } from '$lib/api/user';

	let currentStep = $state(1);

	let userData: LibreUser = $state({
		id: 1,
		name: 'Arnie',
		avatar: ''
	});

	let wizardInput: WizardInput = $state({
		age: 30,
		sex: CalculationSex.Male,
		weight: 85,
		height: 180,
		activityLevel: 1,
		weeklyDifference: 1,
		calculationGoal: CalculationGoal.Loss
	});

	let wizardResult: WizardResult = $state();
	let weightTracker: NewWeightTracker = $state();

	let chosenOption: WizardTargetSelection = $state({
		customDetails: 76,
		userChoice: WizardOptions.Custom_weight
	});

	let wizardTargetWeightResult: WizardTargetWeightResult = $state();
	let chosenRate: number = $state(500);

	let weightTarget: NewWeightTarget = $state();
	let calorieTarget: NewCalorieTarget = $state();

	let finished: boolean = $state(false);
	let finishError: boolean = $state(false);

	const onnext = async () => {
		if (currentStep === 2) {
			weightTracker = {
				added: getDateAsStr(new Date()),
				amount: wizardInput.weight
			};
		}

		if (currentStep === 3) {
			wizardResult = await calculateTdee(wizardInput);

			if (wizardResult.recommendation === WizardRecommendation.Lose) {
				chosenOption.customDetails = wizardResult.targetWeightUpper;
			} else if (wizardResult.recommendation === WizardRecommendation.Hold) {
				chosenOption.customDetails = wizardResult.targetWeight;
			} else {
				chosenOption.customDetails = wizardResult.targetWeightLower;
			}
		}

		if (currentStep === 4) {
			wizardTargetWeightResult = await calculateForTargetWeight({
				age: wizardInput.age,
				sex: wizardInput.sex,
				currentWeight: wizardInput.weight,
				height: wizardInput.height,
				targetWeight: wizardResult.targetWeight,
				startDate: getDateAsStr(new Date())
			});
		}

		if (currentStep === 5) {
			const targets = createTargetWeightTargets(
				wizardInput,
				wizardResult,
				wizardTargetWeightResult,
				new Date(),
				wizardResult.targetWeightUpper,
				chosenRate
			);

			weightTarget = targets.weightTarget;
			calorieTarget = targets.calorieTarget;
		}
	};

	const onback = () => {
		finishError = false;
		finished = false;
	};

	const onfinish = async () => {
		await updateProfile(userData);
		await setBodyData(wizardInput.age, wizardInput.sex, wizardInput.height, wizardInput.weight);
		await postWizardResult({ weightTracker, weightTarget, calorieTarget }).catch((e) => {
			error(e);
			finishError = true;
		});

		finished = true;

		if (!finishError) {
			setTimeout(() => {
				goto('/');
			}, 5000);
		}
	};
</script>

<Stepper bind:currentStep backLabel="Back" {onnext} {onback} {onfinish}>
	{#snippet step1()}
		<strong>Body Parameters</strong>
		<Body bind:wizardInput />
	{/snippet}

	{#snippet step2()}
		<strong>Activity Level</strong>
		<ActivityLevel bind:value={wizardInput.activityLevel} />
	{/snippet}

	{#snippet step3()}
		<strong>Result</strong>
		{#if wizardResult}
			<Report {wizardInput} {wizardResult} />
		{/if}
	{/snippet}

	{#snippet step4()}
		<strong>Next Steps</strong>
		{#if wizardTargetWeightResult}
			{@const rates = Object.keys(wizardTargetWeightResult.dateByRate).map((v) => +v)}
			{@const targetDates = wizardTargetWeightResult.dateByRate}
			{@const targetProgress = wizardTargetWeightResult.progressByRate}
			<Rate bind:value={chosenRate} {rates} {targetDates} {targetProgress} />
		{/if}
	{/snippet}

	{#snippet step5()}
		<strong>You're set!</strong>
		<Finish {wizardResult} {chosenRate} {weightTarget} {calorieTarget} />
		<p class="text-xs">Click finish to proceed. You will be redirected to the dashboard.</p>
	{/snippet}
</Stepper>

{#if finished}
	{#if finishError}
		<AlertBox type={AlertType.Error} alertClass="alert-soft">
			<strong>Error</strong>
			<p>An error occurred. Please try again later.</p>
		</AlertBox>
	{:else}
		<AlertBox type={AlertType.Success} alertClass="alert-soft">
			<strong>Success</strong>
			<p>
				Successfully created your plan. You will be redirected to the <a href="/" class="link"
					>dashboard</a
				>.
			</p>
		</AlertBox>
	{/if}
{/if}
