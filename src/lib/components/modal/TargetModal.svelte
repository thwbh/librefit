<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import { getModalStore, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import { getDateAsStr } from '$lib/date';
	import { validateCalorieTarget, validateWeightTarget } from '$lib/validation';
	import TargetComponent from '$lib/components/TargetComponent.svelte';
	import type { CalorieTarget, WeightTarget } from '$lib/model';

	const today = new Date();

	let errors: any = $state();
	let errorEndDate = $state({
		valid: true
	});

	const modalStore = getModalStore();

	// either one of those must be present (dashboard) or both (wizard default results)
	let calorieTarget: CalorieTarget = $state();
	let weightTarget: WeightTarget = $state();

	// used for customized wizard results only
	let targetsByRate: Map<number, { calorieTarget: CalorieTarget; weightTarget: WeightTarget }> = $state();
	let rates: Array<string> = $state();
	let rateActive: string = $state();

	let warningMessage: string = $state();

	let added = getDateAsStr(today);
	let startDate = getDateAsStr(today);

	let endDate = getDateAsStr(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()));

	if ($modalStore[0] && $modalStore[0].meta) {
		calorieTarget = $modalStore[0].meta.calorieTarget;
		weightTarget = $modalStore[0].meta.weightTarget;

		targetsByRate = $modalStore[0].meta.targetsByRate;
		warningMessage = $modalStore[0].meta.warningMessage;

		rates = targetsByRate ? Object.keys(targetsByRate) : [];

		if (rates.length > 0) {
			rateActive = rates[rates.length - 1];
			calorieTarget = targetsByRate[rateActive].calorieTarget;
			weightTarget = targetsByRate[rateActive].weightTarget;
		}

		errors = {
			valid: true,
			calorieTarget: !calorieTarget
				? undefined
				: {
						targetCalories: {},
						maximumCalories: {}
					},
			weightTarget: !weightTarget
				? undefined
				: {
						initialWeight: {},
						targetWeight: {}
					}
		};
	}

	const onTabChange = () => {
		calorieTarget = targetsByRate[rateActive].calorieTarget;
		weightTarget = targetsByRate[rateActive].weightTarget;

		errors.calorieTarget = targetsByRate[rateActive].calorieTarget;
		errors.weightTarget = targetsByRate[rateActive].weightTarget;
	};

	const onSubmit = () => {
		errors.valid = true;

		if (calorieTarget)
			populateAndValidateTarget(
				calorieTarget,
				validateCalorieTarget,
				'targetCalories',
				'maximumCalories'
			);
		if (weightTarget)
			populateAndValidateTarget(
				weightTarget,
				validateWeightTarget,
				'initialWeight',
				'targetWeight'
			);

		errors.valid &&= errorEndDate.valid;

		if (errors.valid) {
			if ($modalStore[0].response) {
				$modalStore[0].response({
					calorieTarget: calorieTarget,
					weightTarget: weightTarget
				});
			}
		}
	};

	const populateAndValidateTarget = (target, validationFn, prop1, prop2) => {
		let type = '';

		if (target === calorieTarget) type = 'calorieTarget';
		else if (target === weightTarget) type = 'weightTarget';

		target.added = added;
		target.startDate = startDate;
		target.endDate = endDate;

		errors[type] = validationFn(target);
		errorEndDate = errors[type].endDate;

		errors.valid &&= errors[type][prop1].valid;
		errors.valid &&= errors[type][prop2].valid;
	};

	const onCancel = () => {
		if ($modalStore[0].response) {
			$modalStore[0].response({
				cancelled: true
			});
		}
	};
</script>

<div
	class="modal block bg-surface-100-800-token w-modal h-auto p-4 space-y-4 rounded-container-token shadow-xl"
>
	{#if rates.length > 0}
		<header class="text-2xl font-bold">Recommended rate</header>

		<div>
			<p>
				The following rates help you achieve your goal with different run times. Pick the one you
				think that suits you best. The outcome will be the same, but a lower rate means it your
				progress will be slower.
			</p>
		</div>

		<TabGroup class="flex-wrap" flex="flex-wrap">
			{#each rates as rate}
				<Tab bind:group={rateActive} name={rate} value={rate} on:change={onTabChange}>
					<span>{rate}</span>
				</Tab>
			{/each}

			<!-- Tab Panels --->
			{#snippet panel()}
					
					{#if targetsByRate}
						{@const calorieTarget = targetsByRate[rateActive].calorieTarget}
						{@const weightTarget = targetsByRate[rateActive].weightTarget}
						<TargetComponent
							startDate={calorieTarget.startDate}
							endDate={calorieTarget.endDate}
							{errors}
							{errorEndDate}
							{calorieTarget}
							{weightTarget}
						/>
					{/if}
				
					{/snippet}
		</TabGroup>
	{:else if warningMessage}
		<header class="text-2xl font-bold">Warning</header>

		<p>{warningMessage}</p>
	{:else}
		<header class="text-2xl font-bold">Set target</header>

		<TargetComponent {startDate} {endDate} {errors} {errorEndDate} {calorieTarget} {weightTarget} />
	{/if}

	<footer class="modal-footer flex justify-between space-x-2">
		<button onclick={preventDefault(onCancel)} class="btn variant-ringed"> Cancel </button>

		<button onclick={preventDefault(onSubmit)} class="btn variant-filled"> Submit </button>
	</footer>
</div>
