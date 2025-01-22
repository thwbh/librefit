<script lang="ts">
	import { getDaytimeGreeting } from '$lib/date';
	import { DataViews } from '$lib/enum';
	import { paintWeightTracker } from '$lib/weight-chart';
	import CalorieDistribution from './CalorieDistribution.svelte';
	import CalorieQuickview from './CalorieQuickview.svelte';
	import CalorieTrackerComponent from './tracker/CalorieTrackerComponent.svelte';
	import WeightTrackerComponent from './tracker/WeightTrackerComponent.svelte';
	import ScaleOff from '$lib/assets/icons/scale-outline-off.svg?component';
	import { validateAmount } from '$lib/validation';
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
	import { showToastError, showToastSuccess, showToastWarning } from '$lib/toast';
	import { getToastStore, type ToastStore } from '@skeletonlabs/skeleton';
	import { getContext } from 'svelte';
	import type { Indicator } from '$lib/indicator';
	import type { Writable } from 'svelte/store';
	import { getFoodCategoryLongvalue } from '$lib/api/category';
	import type {
		CalorieTracker,
		Dashboard,
		LibreUser,
		NewCalorieTracker,
		NewWeightTracker,
		WeightTracker
	} from '$lib/model';
	import LineChartComponent from './chart/LineChartComponent.svelte';
	import { subDays, subWeeks } from 'date-fns';

	interface Props {
		dashboardData: Dashboard;
	}

	let { dashboardData }: Props = $props();

	let calorieTrackerToday: Array<CalorieTracker> = $state(dashboardData.caloriesTodayList);

	let calorieTrackerWeek: Array<CalorieTracker> = $state(dashboardData.caloriesWeekList);

	let weightTrackerToday: Array<WeightTracker> = $state(dashboardData.weightTodayList);
	let weightTrackerMonth: Array<WeightTracker> = $state(dashboardData.weightMonthList);

	const toastStore: ToastStore = getToastStore();
	const indicator: Writable<Indicator> = getContext('indicator');
	const user: Writable<LibreUser> = getContext('user');

	user.set(dashboardData.userData);

	const handleRequest = async (
		amount: number,
		promise: Promise<Array<CalorieTracker | WeightTracker>>,
		callback: (response: any) => void,
		trackerCallback: () => void
	) => {
		const amountMessage = validateAmount(amount);

		if (!amountMessage) {
			$indicator = $indicator.start();

			await promise
				.then(callback)
				.catch((e) => showToastError(toastStore, e))
				.finally(() => ($indicator = $indicator.finish()));
		} else {
			showToastWarning(toastStore, amountMessage);
		}

		trackerCallback();
	};

	const updateCalorieTracker = async (tracker: Array<CalorieTracker>) => {
		const today = new Date();

		calorieTrackerToday = tracker;
		calorieTrackerWeek = await listCalorieTrackerRange(subDays(today, 6), today);
	};

	const updateWeightTracker = async (tracker: Array<WeightTracker>) => {
		const today = new Date();

		weightTrackerToday = tracker;
		weightTrackerMonth = await listWeightRange(subWeeks(today, 4), today);
	};

	const onAddCalories = async (calories: NewCalorieTracker, callback: () => void) => {
		await handleRequest(
			calories.amount,
			addCalories(calories),
			async (response: Array<CalorieTracker>) => {
				showToastSuccess(
					toastStore,
					`Successfully added ${getFoodCategoryLongvalue(dashboardData.foodCategories, calories.category)}.`
				);

				updateCalorieTracker(response);
			},
			callback
		);
	};

	const onUpdateCalories = async (calories: CalorieTracker, callback: () => void) => {
		await handleRequest(
			calories.amount,
			updateCalories(calories),
			async (response: Array<CalorieTracker>) => {
				showToastSuccess(
					toastStore,
					`Successfully updated ${getFoodCategoryLongvalue(dashboardData.foodCategories, calories.category)}.`
				);

				updateCalorieTracker(response);
			},
			callback
		);
	};

	const onDeleteCalories = async (calories: CalorieTracker, callback: () => void) => {
		await handleRequest(
			calories.amount,
			deleteCalories(calories),
			async (response: Array<CalorieTracker>) => {
				showToastSuccess(toastStore, `Deletion successful.`);

				updateCalorieTracker(response);
			},
			callback
		);
	};

	const onAddWeight = async (weight: NewWeightTracker, callback: () => void) => {
		await handleRequest(
			weight.amount,
			addWeight(weight),
			async (response: Array<WeightTracker>) => {
				showToastSuccess(toastStore, `Set weight to ${response[response.length - 1].amount}kg.`);

				updateWeightTracker(response);
			},
			callback
		);
	};

	const onUpdateWeight = async (weight: WeightTracker, callback: () => void) => {
		await handleRequest(
			weight.amount,
			updateWeight(weight),
			async (response: Array<WeightTracker>) => {
				showToastSuccess(toastStore, 'Successfully updated weight.');

				updateWeightTracker(response);
			},
			callback
		);
	};

	const onDeleteWeight = async (weight: WeightTracker, callback: () => void) => {
		await handleRequest(
			weight.amount,
			deleteWeight(weight),
			async (response: Array<WeightTracker>) => {
				showToastSuccess(toastStore, `Deletion successful.`);

				updateWeightTracker(response);
			},
			callback
		);
	};
</script>

<div class="container md:w-fit mx-auto p-8 space-y-8">
	<h1 class="h1">
		Good {getDaytimeGreeting(new Date())},
		{dashboardData.userData.name}!
	</h1>
	<p>This is your daily summary.</p>

	<div class="flex flex-col gap-8 lg:grid grid-cols-3">
		<div class="card flex flex-col gap-4 p-4">
			<CalorieTrackerComponent
				calorieTracker={calorieTrackerToday}
				categories={dashboardData.foodCategories}
				calorieTarget={dashboardData.calorieTarget}
				{onAddCalories}
				{onUpdateCalories}
				{onDeleteCalories}
			/>
		</div>

		<div class="card flex flex-col gap-4 p-4">
			<CalorieDistribution
				displayClass="flex flex-col"
				foodCategories={dashboardData.foodCategories}
				calorieTracker={calorieTrackerWeek}
				calorieTarget={dashboardData.calorieTarget}
			/>
		</div>

		<div class="card p-4">
			<CalorieQuickview
				displayClass="flex flex-col"
				calorieTracker={calorieTrackerWeek}
				calorieTarget={dashboardData.calorieTarget}
			/>
		</div>
	</div>

	<div class="flex md:flex-row flex-col gap-8">
		<div
			class="flex flex-col gap-4 card p-4 object-fill justify-center items-center relative md:w-full"
		>
			<h2 class="h3">Weight Tracker</h2>
			{#if weightTrackerMonth.length > 0}
				{@const weightChart = paintWeightTracker(weightTrackerMonth, new Date(), DataViews.Month)}
				<LineChartComponent data={weightChart.data} options={weightChart.options} />
			{:else}
				<div>
					<ScaleOff width={100} height={100} class="self-center" />
				</div>
			{/if}
			<WeightTrackerComponent
				weightList={weightTrackerToday}
				weightTarget={dashboardData.weightTarget}
				{onAddWeight}
				{onUpdateWeight}
				{onDeleteWeight}
			/>
		</div>
	</div>
</div>
