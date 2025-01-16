<script lang="ts">
	import { paintWeightTracker } from '$lib/weight-chart';
	import CalorieTrackerComponent from '$lib/components/tracker/CalorieTrackerComponent.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import {
		addCalories,
		addWeight,
		deleteCalories,
		deleteWeight,
		updateCalories,
		updateWeight
	} from '$lib/api/tracker';
	import { createCalorieTarget, createWeightTarget } from '$lib/api/target';
	import { getContext } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { Line } from 'svelte-chartjs';
	import CalorieDistribution from '$lib/components/CalorieDistribution.svelte';
	import { validateAmount } from '$lib/validation';
	import { showToastError, showToastSuccess, showToastWarning } from '$lib/toast';
	import { DataViews } from '$lib/enum';
	import { getDaytimeGreeting } from '$lib/date';
	import { getFoodCategoryLongvalue } from '$lib/api/category';
	import ScaleOff from '$lib/assets/icons/scale-outline-off.svg?component';
	import CalorieQuickview from '$lib/components/CalorieQuickview.svelte';
	import WeightTrackerComponent from '$lib/components/tracker/WeightTrackerComponent.svelte';
	import type { CalorieTarget, FoodCategory, WeightTracker } from '$lib/model';
	import type { Writable } from 'svelte/store';
	import type { Indicator } from '$lib/indicator';
	import { getDashboard } from '$lib/api/user';

	Chart.register(...registerables);

	const lastWeightTracker: Writable<WeightTracker> = getContext('lastWeight');
	const foodCategories: Writable<Array<FoodCategory>> = getContext('foodCategories');
	const calorieTarget: Writable<CalorieTarget> = getContext('calorieTarget');
	const indicator: Writable<Indicator> = getContext('indicator');

	const toastStore = getToastStore();

	const onAddCalories = async (event) => {
		const amountMessage = validateAmount(event.detail.value);

		if (!amountMessage) {
			await addCalories(event)
				.then(async (response) => {
					event.detail.callback();

					showToastSuccess(
						toastStore,
						`Successfully added ${getFoodCategoryLongvalue($foodCategories, event.detail.category)}.`
					);
				})
				.catch((e) => {
					showToastError(toastStore, e);
					event.detail.callback(true);
				})
				.finally(() => ($indicator = $indicator.finish()));
		} else {
			showToastWarning(toastStore, amountMessage);
			event.detail.callback(true);
		}
	};

	const onUpdateCalories = async (event) => {
		const amountMessage = validateAmount(event.detail.value);

		if (!amountMessage) {
			$indicator = $indicator.start(event.detail.target);

			await updateCalories(event)
				.then(async (response) => {
					event.detail.callback();

					showToastSuccess(
						toastStore,
						`Successfully updated ${getFoodCategoryLongvalue($foodCategories, event.detail.category)}.`
					);
				})
				.catch((e) => {
					showToastError(toastStore, e);
					event.detail.callback(true);
				})
				.finally(() => ($indicator = $indicator.finish()));
		} else {
			showToastWarning(toastStore, amountMessage);
			event.detail.callback(true);
		}
	};

	const onDeleteCalories = async (event) => {
		$indicator = $indicator.start(event.detail.target);

		await deleteCalories(event)
			.then(async (response) => {
				event.detail.callback();
				showToastSuccess(toastStore, `Deletion successful.`);
			})
			.catch((e) => {
				showToastError(toastStore, e);
				event.detail.callback(true);
			})
			.finally(() => ($indicator = $indicator.finish()));
	};

	const onAddWeight = async (event) => {
		const amountMessage = validateAmount(event.detail.value);

		if (!amountMessage) {
			$indicator = $indicator.start(event.detail.target);

			await addWeight(event)
				.then((response) => {
					event.detail.callback();
					showToastSuccess(toastStore, `Set weight to ${$lastWeightTracker.amount}kg.`);
				})
				.catch((e) => showToastError(toastStore, e))
				.finally(() => ($indicator = $indicator.finish()));
		} else {
			showToastWarning(toastStore, amountMessage);
			event.detail.callback(true);
		}
	};

	const onUpdateWeight = async (event) => {
		const amountMessage = validateAmount(event.detail.value);

		if (!amountMessage) {
			$indicator = $indicator.start(event.detail.target);

			await updateWeight(event)
				.then(async (response) => {
					event.detail.callback();
					showToastSuccess(toastStore, 'Successfully updated weight.');
				})
				.catch((e) => showToastError(toastStore, e))
				.finally(() => ($indicator = $indicator.finish()));
		} else {
			showToastWarning(toastStore, amountMessage);
			event.detail.callback(true);
		}
	};

	const onDeleteWeight = async (event) => {
		$indicator = $indicator.start(event.detail.target);

		await deleteWeight(event)
			.then((response) => {
				event.detail.callback();
				showToastSuccess(toastStore, `Deletion successful.`);
			})
			.catch((e) => {
				showToastError(toastStore, e);
				event.detail.callback(true);
			})
			.finally(() => ($indicator = $indicator.finish()));
	};

	const setCalorieTarget = async (e) => {
		$indicator = $indicator.start(e.detail.target);

		await createCalorieTarget(e.detail.calorieTarget)
			.then((response) => {
				calorieTarget.set(response);
			})
			.then(() => {
				showToastSuccess(toastStore, 'Successfully set target caloric intake.');
			})
			.catch((e) => {
				showToastError(toastStore, e);
			})
			.finally(() => ($indicator = $indicator.finish()));
	};

	const setWeightTarget = async (e) => {
		$indicator = $indicator.start(e.detail.target);

		await createWeightTarget(e.detail.weightTarget)
			.then(() => {
				showToastSuccess(toastStore, 'Successfully set target weight.');
			})
			.catch((e) => {
				showToastError(toastStore, e);
			})
			.finally(() => ($indicator = $indicator.finish()));
	};
</script>

<svelte:head>
	<title>LibreFit - Dashboard</title>
</svelte:head>

{#await getDashboard(new Date()) then dashboardData}
	{@const name = dashboardData.userData.name}
	{@const weightChart = paintWeightTracker(
		dashboardData.weightMonthList,
		new Date(),
		DataViews.Month
	)}

	<section>
		<div class="container md:w-fit mx-auto p-8 space-y-8">
			<h1 class="h1">
				Good {getDaytimeGreeting(new Date())}{#if name}, {name}!{:else}!{/if}
			</h1>
			<p>This is your daily summary.</p>
			<div class="flex flex-col gap-8 lg:grid grid-cols-3">
				<div class="card flex flex-col gap-4 p-4">
					<CalorieTrackerComponent
						calorieTracker={dashboardData.caloriesTodayList}
						categories={dashboardData.foodCategories}
						calorieTarget={dashboardData.calorieTarget}
						on:addCalories={onAddCalories}
						on:updateCalories={onUpdateCalories}
						on:deleteCalories={onDeleteCalories}
					/>
				</div>

				<div class="card flex flex-col gap-4 p-4">
					<CalorieDistribution
						displayClass="flex flex-col"
						foodCategories={dashboardData.foodCategories}
						calorieTracker={dashboardData.caloriesWeekList}
						calorieTarget={dashboardData.calorieTarget}
					/>
				</div>

				<div class="card p-4">
					<CalorieQuickview
						displayClass="flex flex-col"
						calorieTracker={dashboardData.caloriesWeekList}
						calorieTarget={dashboardData.calorieTarget}
						on:setTarget={setCalorieTarget}
					/>
				</div>
			</div>

			<div class="flex md:flex-row flex-col gap-8">
				<div
					class="flex flex-col gap-4 card p-4 object-fill justify-center items-center relative md:w-full"
				>
					<h2 class="h3">Weight Tracker</h2>
					{#if weightChart && dashboardData.weightMonthList.length > 0}
						<Line
							class="md:w-full"
							options={weightChart.chartOptions}
							data={weightChart.chartData}
						/>
					{:else}
						<div>
							<ScaleOff width={100} height={100} class="self-center" />
						</div>
					{/if}
					<WeightTrackerComponent
						weightList={dashboardData.weightTodayList}
						weightTarget={dashboardData.weightTarget}
						on:addWeight={onAddWeight}
						on:updateWeight={onUpdateWeight}
						on:deleteWeight={onDeleteWeight}
						on:setTarget={setWeightTarget}
					/>
				</div>
			</div>
		</div>
	</section>
{/await}
