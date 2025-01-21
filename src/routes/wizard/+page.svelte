<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { showToastError, showToastSuccess, showToastWarning } from '$lib/toast';
	import { getContext } from 'svelte';
	import {
		calculateForTargetDate,
		calculateForTargetWeight,
		calculateTdee,
		createTargetDateTargets,
		createTargetWeightTargets,
		postWizardResult,
		validateCustomDate,
		validateCustomWeight
	} from '$lib/api/wizard';
	import WizardResultComponent from '$lib/components/wizard/WizardResultComponent.svelte';
	import WizardTarget from '$lib/components/wizard/WizardTarget.svelte';
	import { addDays } from 'date-fns';
	import { getDateAsStr } from '$lib/date';
	import { WizardOptions } from '$lib/enum';
	import {
		WizardRecommendation,
		type NewCalorieTarget,
		type NewWeightTarget,
		type Wizard,
		type WizardInput,
		type WizardResult,
		type WizardTargetDateInput,
		type WizardTargetDateResult,
		type WizardTargetWeightInput,
		type WizardTargetWeightResult
	} from '$lib/model';
	import type { Writable } from 'svelte/store';
	import type { Indicator } from '$lib/indicator';

	interface Props {
		calculationResult: WizardResult;
		calculationInput: WizardInput;
	}

	let { calculationResult, calculationInput }: Props = $props();

	const toastStore = getToastStore();
	const modalStore = getModalStore();

	const indicator: Writable<Indicator> = getContext('indicator');

	let calculationError = $state();

	let chosenOption = $state({
		userChoice: undefined,
		customDetails: undefined
	});

	const today = new Date();
	let selectedRate = '100';

	const calculate = async (e) => {
		$indicator = $indicator.start();

		calculationInput = e.detail.input;

		await calculateTdee(calculationInput)
			.then(async (response) => {
				calculationResult = response;
			})
			.catch((e) => showToastError(toastStore, e))
			.finally(() => ($indicator = $indicator.finish()));
	};

	const calculateCustomDate = async (wizardDetails) => {
		const validation = validateCustomDate({
			value: wizardDetails.targetDate
		});

		if (!validation.valid) {
			showToastWarning(toastStore, validation.errorMessage);
		} else {
			$indicator = $indicator.start();

			const wizardInput: WizardTargetDateInput = {
				age: calculationInput.age,
				height: calculationInput.height,
				currentWeight: calculationInput.weight,
				sex: calculationInput.sex,
				targetDate: wizardDetails.targetDate,
				calculationGoal: calculationInput.calculationGoal,
				startDate: getDateAsStr(new Date())
			};

			await calculateForTargetDate(wizardInput)
				.then((customWizardResult: WizardTargetDateResult) => {
					const targetsByRate = createTargetDateTargets(
						calculationInput,
						calculationResult,
						customWizardResult,
						today,
						wizardDetails.targetDate,
						selectedRate
					);

					showModal({
						targetsByRate: targetsByRate
					});
				})
				.catch((e) => showToastError(toastStore, e))
				.finally(() => ($indicator = $indicator.finish()));
		}
	};

	const calculateCustomWeight = async (wizardDetails) => {
		const validation = validateCustomWeight({
			value: wizardDetails.targetWeight
		});

		if (!validation.valid) {
			showToastWarning(toastStore, validation.errorMessage);
		} else {
			$indicator = $indicator.start();

			const wizardInput: WizardTargetWeightInput = {
				age: calculationInput.age,
				height: calculationInput.height,
				currentWeight: calculationInput.weight,
				sex: calculationInput.sex,
				targetWeight: wizardDetails.targetWeight,
				startDate: getDateAsStr(today)
			};

			await calculateForTargetWeight(wizardInput)
				.then((customWizardResult: WizardTargetWeightResult) => {
					const targetsByRate = createTargetWeightTargets(
						calculationInput,
						calculationResult,
						customWizardResult,
						today,
						wizardDetails.targetWeight,
						selectedRate
					);

					showModal({
						targetsByRate: targetsByRate,
						warningMessage: customWizardResult.message
					});
				})
				.catch((e) => showToastError(toastStore, e))
				.finally(() => ($indicator = $indicator.finish()));
		}
	};

	const reset = () => {
		calculationResult = undefined;
		calculationError = false;
		chosenOption.userChoice = undefined;
		chosenOption.customDetails = undefined;
	};

	const processResult = async (calculationResult: WizardResult) => {
		const endDate = addDays(today, calculationResult.durationDays);

		const wizardDetails: { calorieTarget: NewCalorieTarget; weightTarget: NewWeightTarget } = {
			calorieTarget: {
				added: getDateAsStr(today),
				endDate: getDateAsStr(endDate),
				startDate: getDateAsStr(today),
				targetCalories: 0,
				maximumCalories: 0
			},

			weightTarget: {
				added: getDateAsStr(today),
				endDate: getDateAsStr(endDate),
				startDate: getDateAsStr(today),
				initialWeight: calculationInput.weight,
				targetWeight: 0
			}
		};

		if (chosenOption.userChoice === WizardOptions.Default) {
			wizardDetails.calorieTarget.targetCalories = calculationResult.target;
			wizardDetails.calorieTarget.maximumCalories = calculationResult.tdee;

			wizardDetails.weightTarget.targetWeight = calculationResult.targetWeight;

			showModal(wizardDetails);
		} else if (chosenOption.userChoice === WizardOptions.Recommended) {
			if (calculationResult.recommendation === WizardRecommendation.Hold) {
				wizardDetails.calorieTarget.targetCalories = calculationResult.tdee;
				wizardDetails.calorieTarget.maximumCalories = calculationResult.tdee;

				wizardDetails.weightTarget.targetWeight = calculationInput.weight;

				showModal(wizardDetails);
			} else {
				wizardDetails.calorieTarget.targetCalories = calculationResult.target;
				wizardDetails.calorieTarget.maximumCalories = calculationResult.tdee;

				// calculate for recommendation
				await calculateCustomWeight({
					targetWeight:
						calculationResult.recommendation === WizardRecommendation.Gain
							? calculationResult.targetWeightLower
							: calculationResult.targetWeightUpper
				});
			}
		} else if (chosenOption.userChoice === WizardOptions.Custom_date) {
			// calculate with custom weight input
			await calculateCustomDate({ targetDate: chosenOption.customDetails });
		} else if (chosenOption.userChoice === WizardOptions.Custom_weight) {
			// calculate with custom date input
			await calculateCustomWeight({ targetWeight: chosenOption.customDetails });
		} else if (chosenOption.userChoice === WizardOptions.Custom) {
			showModal(wizardDetails);
		}
	};

	const showModal = (wizardDetails) => {
		modalStore.trigger({
			type: 'component',
			component: 'targetModal',
			meta: wizardDetails,
			response: async (e) => {
				if (e && !e.cancelled) {
					await createTargetsAddWeight(e);
				}

				modalStore.close();
			}
		});
	};

	const createTargetsAddWeight = async (detail) => {
		$indicator = $indicator.start();

		const wizard: Wizard = {
			calorieTarget: detail.calorieTarget,
			weightTarget: detail.weightTarget,
			weightTracker: {
				added: getDateAsStr(today),
				amount: detail.weightTarget.initialWeight
			}
		};

		await postWizardResult(wizard)
			.then(async (_) => showToastSuccess(toastStore, 'Successfully saved your targets.'))
			.catch((error) => showToastError(toastStore, error))
			.finally(() => ($indicator = $indicator.finish()));
	};
</script>

<svelte:head>
	<title>LibreFit - TDEE Wizard</title>
</svelte:head>

<section>
	<div class="container mx-auto p-8 space-y-8">
		<h1 class="h1">TDEE Calculator</h1>
	</div>
</section>
