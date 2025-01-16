<script lang="ts">
	import { run } from 'svelte/legacy';

	import { paintWeightTracker } from '$lib/weight-chart';
	import CalorieTrackerComponent from '$lib/components/tracker/CalorieTrackerComponent.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import {
		addCalories,
		addWeight,
		deleteCalories,
		deleteWeight,
		listCalorieTrackerRange,
		listWeightRange,
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
	import { subMonths, subWeeks } from 'date-fns';
	import ScaleOff from '$lib/assets/icons/scale-outline-off.svg?component';
	import { observeToggle } from '$lib/theme-toggle';
	import CalorieQuickview from '$lib/components/CalorieQuickview.svelte';
	import WeightTrackerComponent from '$lib/components/tracker/WeightTrackerComponent.svelte';
	import { getDateAsStr } from '$lib/date';
	import type {
		CalorieTarget,
		CalorieTracker,
		Dashboard,
		FoodCategory,
		LibreUser,
		WeightTarget,
		WeightTracker
	} from '$lib/model';
	import type { Writable } from 'svelte/store';
	import type { Indicator } from '$lib/indicator';

	Chart.register(...registerables);

	const lastWeightTracker: Writable<WeightTracker> = getContext('lastWeight');
	const foodCategories: Writable<Array<FoodCategory>> = getContext('foodCategories');
	const calorieTarget: Writable<CalorieTarget> = getContext('calorieTarget');

	let { data } = $props();

	const dashboardData: Dashboard = $state(data.dashboardData);

	let caloriesToday: Array<CalorieTracker> = $state(dashboardData.caloriesTodayList);
	let weightListToday: Array<WeightTracker> = $state(dashboardData.weightTodayList);
	let weightListMonth: Array<WeightTracker> = $state(dashboardData.weightMonthList);

	let weightTarget: WeightTarget = $state(dashboardData.weightTarget);



	const user: Writable<LibreUser> = getContext('user');
	const indicator: Writable<Indicator> = getContext('indicator');


	const toastStore = getToastStore();

	const today = new Date();
	const lastWeek = subWeeks(today, 1);
	const lastMonth = subMonths(today, 1);

	observeToggle(document.documentElement, () => repaintWeightChart());

	const onAddCalories = async (event) => {
		const amountMessage = validateAmount(event.detail.value);

		if (!amountMessage) {
			await addCalories(event)
				.then(async (response) => {
					event.detail.callback();

					caloriesToday = response;

					showToastSuccess(
						toastStore,
						`Successfully added ${getFoodCategoryLongvalue($foodCategories, event.detail.category)}.`
					);
				})
				.then(refreshCalorieDistribution)
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

					caloriesToday = response;

					showToastSuccess(
						toastStore,
						`Successfully updated ${getFoodCategoryLongvalue($foodCategories, event.detail.category)}.`
					);
				})
				.then(refreshCalorieDistribution)
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

				caloriesToday = response;

				showToastSuccess(toastStore, `Deletion successful.`);
			})
			.then(refreshCalorieDistribution)
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

					weightListToday = response;
					lastWeightTracker.set(weightListToday[0]);

					showToastSuccess(toastStore, `Set weight to ${$lastWeightTracker.amount}kg.`);
				})
				.then(refreshWeightChart)
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

					weightListToday = response;

					showToastSuccess(toastStore, 'Successfully updated weight.');
				})
				.then(refreshWeightChart)
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

				weightListToday = response;

				showToastSuccess(toastStore, `Deletion successful.`);
			})
			.then(refreshWeightChart)
			.catch((e) => {
				showToastError(toastStore, e);
				event.detail.callback(true);
			})
			.finally(() => ($indicator = $indicator.finish()));
	};

	const refreshCalorieDistribution = async () => {
		listCalorieTrackerRange(getDateAsStr(lastWeek), getDateAsStr(today)).then(
			(response) => (dashboardData.caloriesWeekList = response)
		);
	};

	const refreshWeightChart = async () => {
		await listWeightRange(getDateAsStr(lastMonth), getDateAsStr(today)).then((response) => {
			weightListMonth = response;
			repaintWeightChart();
		});
	};

	const repaintWeightChart = () => {
		weightChart = paintWeightTracker(weightListMonth, today, DataViews.Month);
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
			.then(async (response) => {
				weightTarget = response;
			})
			.then(() => {
				showToastSuccess(toastStore, 'Successfully set target weight.');
			})
			.catch((e) => {
				showToastError(toastStore, e);
			})
			.finally(() => ($indicator = $indicator.finish()));
	};
	let weightChart;
	run(() => {
		weightChart = paintWeightTracker(weightListMonth, today, DataViews.Month);
	});
	run(() => {
		lastWeightTracker.set(dashboardData.weightTodayList[0]);
	});
	run(() => {
		foodCategories.set(dashboardData.foodCategories);
	});
	run(() => {
		calorieTarget.set(dashboardData.calorieTarget);
	});
	run(() => {
		dashboardData.caloriesWeekList;
	});
	run(() => {
		user.set(dashboardData.userData);
	});
</script>

<svelte:head>
	<title>LibreFit - Dashboard</title>
</svelte:head>

<section>
	<div class="container md:w-fit mx-auto p-8 space-y-8">
		{#if $user}
			{@const name = $user.name}
			<h1 class="h1">
				Good {getDaytimeGreeting(new Date())}
				{#if name}, {name}!{:else}!{/if}
			</h1>
			<p>This is your daily summary.</p>
		{/if}
		<div class="flex flex-col gap-8 lg:grid grid-cols-3">
			<div class="card flex flex-col gap-4 p-4">
				<CalorieTrackerComponent
					calorieTracker={caloriesToday}
					categories={$foodCategories}
					calorieTarget={$calorieTarget}
					on:addCalories={onAddCalories}
					on:updateCalories={onUpdateCalories}
					on:deleteCalories={onDeleteCalories}
				/>
			</div>

			<div class="card flex flex-col gap-4 p-4">
				<CalorieDistribution
					displayClass="flex flex-col"
					foodCategories={$foodCategories}
					bind:calorieTracker={dashboardData.caloriesWeekList}
					bind:calorieTarget={dashboardData.calorieTarget}
				/>
			</div>

			<div class="card p-4">
				<CalorieQuickview
					displayClass="flex flex-col"
					bind:calorieTracker={dashboardData.caloriesWeekList}
					calorieTarget={$calorieTarget}
					on:setTarget={setCalorieTarget}
				/>
			</div>
		</div>

		<div class="flex md:flex-row flex-col gap-8">
			<div
				class="flex flex-col gap-4 card p-4 object-fill justify-center items-center relative md:w-full"
			>
				<h2 class="h3">Weight Tracker</h2>
				{#if weightChart && weightListMonth.length > 0}
					<Line class="md:w-full" options={weightChart.chartOptions} data={weightChart.chartData} />
				{:else}
					<div>
						<ScaleOff width={100} height={100} class="self-center" />
					</div>
				{/if}
				<WeightTrackerComponent
					weightList={weightListToday}
					{weightTarget}
					on:addWeight={onAddWeight}
					on:updateWeight={onUpdateWeight}
					on:deleteWeight={onDeleteWeight}
					on:setTarget={setWeightTarget}
				/>
			</div>
		</div>
	</div>
</section>
