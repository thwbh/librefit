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
		LibreUserSchema,
		WizardInputSchema,
		WizardRecommendationSchema
	} from '$lib/api/gen/types';
	import type {
		BodyData,
		LibreUser,
		NewIntakeTarget,
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
	import { performSetup as runSetup } from './setup-orchestration';

	interface Props {
		userData?: LibreUser;
		bodyData?: BodyData;
		currentStep?: number;
		recommendation?: string;
	}

	const CalculationGoal = CalculationGoalSchema.enum;
	const CalculationSex = CalculationSexSchema.enum;
	const WizardRecommendation = WizardRecommendationSchema.enum;

	let {
		userData: userDataProp,
		bodyData: bodyDataProp,
		currentStep = $bindable(1),
		recommendation = $bindable('')
	}: Props = $props();

	// Local reactive state. For first-time runs, `name` and `sex` are deliberately
	// left blank so the generated Zod schemas reject the draft until the user fills
	// them in — see step1Valid below. On wizard re-run, the loader-supplied props
	// carry valid values and the wizard is advance-ready immediately.
	let userData = $state(
		userDataProp ?? {
			id: 1,
			name: '',
			avatar: ''
		}
	);

	let bodyData = bodyDataProp ?? {
		id: 0,
		age: 30,
		sex: undefined as unknown as BodyData['sex'],
		weight: 85,
		height: 180
	};

	// `wizardInput` is typed as `WizardInput` so Body's bindings stay strongly typed,
	// but on first-time runs `sex` is undefined at runtime. The Stepper `onnext`
	// short-circuit + `step1Parse.success` guard before any Tauri call ensure that
	// by the time `wizardInput` reaches a backend command it has a real sex value.
	let wizardInput: WizardInput = $state({
		age: bodyData.age,
		sex: bodyDataProp
			? CalculationSexSchema.safeParse(bodyData.sex).data!
			: (undefined as unknown as WizardInput['sex']),
		weight: bodyData.weight,
		height: bodyData.height,
		activityLevel: 1,
		weeklyDifference: 1,
		calculationGoal: CalculationGoal.LOSS
	});

	// Validity for Step 1 is derived by running the generated Zod schemas against
	// the live form state. The backend `validator`-crate annotations are the single
	// source of truth for bounds (see `_conv-validation [VAL-011]`); `tauri-typegen`
	// propagates `length`/`range` messages into these Zod schemas. Enum messages are
	// NOT propagated (tauri-typegen 0.4.0 parses only `length`/`range` constraints),
	// so we curate enum-error messages here via Zod's per-parse `error` hook.
	const wizardErrorMap: import('zod').core.$ZodErrorMap = (issue) =>
		issue.path?.[0] === 'sex'
			? { message: 'Please choose Male or Female before continuing.' }
			: undefined;

	const step1Parse = $derived(WizardInputSchema.safeParse(wizardInput, { error: wizardErrorMap }));
	const userParse = $derived(LibreUserSchema.safeParse(userData));
	const step1Valid = $derived(step1Parse.success && userParse.success);

	// Per-field error messages from the failing Zod schemas, surfaced under each
	// offending input. Empty map until the user attempts to advance — validation
	// errors should not appear on initial render before any interaction (per [OB-020]).
	let hasAttemptedAdvance: boolean = $state(false);
	const step1Errors = $derived.by<Record<string, string>>(() => {
		if (!hasAttemptedAdvance) return {};
		const errors: Record<string, string> = {};
		if (!step1Parse.success) {
			for (const issue of step1Parse.error.issues) {
				const field = String(issue.path[0]);
				if (!(field in errors)) errors[field] = issue.message;
			}
		}
		if (!userParse.success) {
			for (const issue of userParse.error.issues) {
				const field = String(issue.path[0]);
				if (!(field in errors)) errors[field] = issue.message;
			}
		}
		return errors;
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
	let intakeTarget: NewIntakeTarget | undefined = $state();

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
		get intakeTarget() {
			return intakeTarget;
		}
	});

	const onnext = async () => {
		// veilchen's Stepper increments `currentStep` BEFORE invoking onnext, so by
		// the time we run, `currentStep` is the step we just moved TO. To gate the
		// Step 1 → Step 2 transition we check `currentStep === 2` (arrived at step 2)
		// and roll back synchronously if Step 1 wasn't valid. Synchronous re-assign
		// happens in the same tick as the Stepper's mutation so Svelte flushes once.
		if (currentStep === 2 && !step1Valid) {
			hasAttemptedAdvance = true;
			currentStep = 1;
			return;
		}

		if (currentStep === 2) {
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
			// step1Parse.success is guaranteed here because Step 1 gating throws otherwise.
			// Using the parsed `data` instead of the raw draft pins the type at the boundary.
			if (!step1Parse.success) throw new Error('unreachable: Step 1 not valid at Step 3');
			const result = await wizardCalculateTdee({
				input: step1Parse.data
			});

			if (result) {
				wizardResult = result;
				recommendation = result.recommendation;

				if (result.recommendation === WizardRecommendation.LOSE) {
					chosenOption.customDetails = result.targetWeightUpper;
				} else if (result.recommendation === WizardRecommendation.HOLD) {
					// Initialize target weight to current weight for HOLD users
					chosenTargetWeight = step1Parse.data.weight;
				} else if (result.recommendation === WizardRecommendation.GAIN) {
					chosenOption.customDetails = result.targetWeightLower;
					// Also initialize for potential override to HOLD
					chosenTargetWeight = step1Parse.data.weight;
				}
			}
		}

		if (currentStep === 4) {
			if (!step1Parse.success) throw new Error('unreachable: Step 1 not valid at Step 4');
			const input1 = step1Parse.data;
			const result = await wizardCalculateForTargetWeight({
				input: {
					age: input1.age,
					sex: input1.sex,
					currentWeight: input1.weight,
					height: input1.height,
					targetWeight: chosenTargetWeight,
					startDate: getDateAsStr(new Date())
				}
			});

			if (result) {
				wizardTargetWeightResult = result;
			}
		}

		if (currentStep === 5) {
			if (!step1Parse.success) throw new Error('unreachable: Step 1 not valid at Step 5');
			const input1 = step1Parse.data;
			// For GAIN users, check if they selected target weight equal to current weight (maintain)
			const isGainUserMaintaining =
				wizardResult!.recommendation === WizardRecommendation.GAIN &&
				chosenTargetWeight === input1.weight;

			// Determine effective recommendation
			const effectiveRecommendation = isGainUserMaintaining
				? WizardRecommendation.HOLD
				: wizardResult!.recommendation;

			const targets = createTargetWeightTargets(
				input1,
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
			intakeTarget = targets.intakeTarget;
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
			step1Parse.success &&
			chosenTargetWeight !== step1Parse.data.weight
		) {
			const input1 = step1Parse.data;
			wizardCalculateForTargetWeight({
				input: {
					age: input1.age,
					sex: input1.sex,
					currentWeight: input1.weight,
					height: input1.height,
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

	const stepMessages = {
		profile: 'Saving your profile...',
		body: 'Recording body measurements...',
		targets: 'Creating your personalized plan...'
	};

	const performSetup = async () => {
		showCompletion = true;
		isProcessing = true;
		finishError = false;

		if (!step1Parse.success) throw new Error('unreachable: Step 1 not valid at performSetup');

		const result = await runSetup(
			{
				userName: userData.name!,
				userAvatar: userData.avatar!,
				input: step1Parse.data,
				weightTracker: weightTracker!,
				weightTarget: weightTarget!,
				intakeTarget: intakeTarget!
			},
			{
				updateUser,
				updateBodyData,
				wizardCreateTargets,
				onStepStart: async (step) => {
					processingStep = stepMessages[step];
					await new Promise((resolve) => setTimeout(resolve, 800));
				}
			}
		);

		if (!result.ok) {
			error(`Error during setup: ${result.error}`);
			finishError = true;
			isProcessing = false;
			processingStep = 'An error occurred. Please try again.';
			return;
		}

		try {
			// Update user context so the profile page reflects new data
			if (userContext && result.user) {
				userContext.updateUser({
					id: result.user.id,
					name: result.user.name!,
					avatar: result.user.avatar!
				});
			}

			processingStep = 'All set! Taking you to your dashboard...';
			isProcessing = false;

			// Wait a moment to show success message
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Start fade out transition
			isFadingOut = true;

			// Wait for fade out animation to complete
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Navigate and invalidate all layout data to refetch user profile
			await goto('/', { invalidateAll: true });
		} catch (e) {
			error(`Error during setup finalization: ${e}`);
			finishError = true;
			isProcessing = false;
			isFadingOut = false;
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
			<Body bind:wizardInput bind:userData errors={step1Errors} />
		{/snippet}

		{#snippet step2()}
			<ActivityLevel bind:value={wizardInput.activityLevel} />
		{/snippet}

		{#snippet step3()}
			{#if wizardResult}
				<Report {wizardInput} {wizardResult} />
			{/if}
		{/snippet}

		{#snippet step4()}
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

<style>
	/* Hide default step timeline — replaced by branded header progress bar */
	:global(.timeline-container) {
		display: none;
	}

	/* Style Next button with accent color */
	:global(.stepper-buttons-wrapper .btn-neutral) {
		background-color: var(--color-accent);
		color: var(--color-accent-content);
		border-color: var(--color-accent);
	}

	:global(.stepper-buttons-wrapper .btn-neutral:hover) {
		background-color: color-mix(in oklch, var(--color-accent) 85%, black);
		border-color: color-mix(in oklch, var(--color-accent) 85%, black);
	}
</style>
