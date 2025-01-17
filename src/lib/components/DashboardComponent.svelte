<script lang="ts">
	import { getDaytimeGreeting } from '$lib/date';
	import { DataViews } from '$lib/enum';
	import { paintWeightTracker } from '$lib/weight-chart';
	import CalorieDistribution from './CalorieDistribution.svelte';
	import CalorieQuickview from './CalorieQuickview.svelte';
	import CalorieTrackerComponent from './tracker/CalorieTrackerComponent.svelte';
	import WeightTrackerComponent from './tracker/WeightTrackerComponent.svelte';
	import ScaleOff from '$lib/assets/icons/scale-outline-off.svg?component';
	import type { DashboardComponentProps } from '$lib/props';
	import { validateAmount } from '$lib/validation';
	import {
		addCalories,
		addWeight,
		deleteCalories,
		deleteWeight,
		updateCalories,
		updateWeight
	} from '$lib/api/tracker';
	import { showToastError, showToastSuccess, showToastWarning } from '$lib/toast';
	import { getToastStore, type ToastStore } from '@skeletonlabs/skeleton';
	import { getContext } from 'svelte';
	import type { Indicator } from '$lib/indicator';
	import type { Writable } from 'svelte/store';
	import { getFoodCategoryLongvalue } from '$lib/api/category';
	import type { WeightTracker } from '$lib/model';
	import LineChartComponent from './chart/LineChartComponent.svelte';

	let { dashboardData }: DashboardComponentProps = $props();

	let weightChart = $derived(
		paintWeightTracker(dashboardData.weightMonthList, new Date(), DataViews.Month)
	);

	const toastStore: ToastStore = getToastStore();
	const indicator: Writable<Indicator> = getContext('indicator');

	const handleRequest = async (
		event: CustomEvent,
		promise: Promise<any>,
		callback: (response: any) => void
	) => {
		const amountMessage = validateAmount(event.detail.value);

		if (!amountMessage) {
			$indicator = $indicator.start(event.detail.target);

			await promise
				.then(callback)
				.catch((e) => {
					showToastError(toastStore, e);

					if (event.detail.callback) {
						event.detail.callback();
					}
				})
				.finally(() => ($indicator = $indicator.finish()));
		} else {
			showToastWarning(toastStore, amountMessage);

			if (event.detail.callback) {
				event.detail.callback(true);
			}
		}
	};

	const onAddCalories = async (event: CustomEvent) => {
		await handleRequest(event, addCalories(event), (_) => {
			event.detail.callback();

			showToastSuccess(
				toastStore,
				`Successfully added ${getFoodCategoryLongvalue(dashboardData.foodCategories, event.detail.category)}.`
			);
		});
	};

	const onUpdateCalories = async (event: CustomEvent) => {
		await handleRequest(event, updateCalories(event), (_) => {
			event.detail.callback();

			showToastSuccess(
				toastStore,
				`Successfully updated ${getFoodCategoryLongvalue(dashboardData.foodCategories, event.detail.category)}.`
			);
		});
	};

	const onDeleteCalories = async (event: CustomEvent) => {
		await handleRequest(event, deleteCalories(event), (_) => {
			event.detail.callback();
			showToastSuccess(toastStore, `Deletion successful.`);
		});
	};

	const onAddWeight = async (event: CustomEvent) => {
		await handleRequest(event, addWeight(event), (response: WeightTracker) => {
			event.detail.callback();
			showToastSuccess(toastStore, `Set weight to ${response.amount}kg.`);
		});
	};

	const onUpdateWeight = async (event: CustomEvent) => {
		await handleRequest(event, updateWeight(event), (_) => {
			event.detail.callback();
			showToastSuccess(toastStore, 'Successfully updated weight.');
		});
	};

	const onDeleteWeight = async (event: CustomEvent) => {
		await handleRequest(event, deleteWeight(event), (_) => {
			event.detail.callback();
			showToastSuccess(toastStore, `Deletion successful.`);
		});
	};
</script>

<div class="container md:w-fit mx-auto p-8 space-y-8">
	<h1 class="h1">Good {getDaytimeGreeting(new Date())}{dashboardData.userData.name}!</h1>
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
			/>
		</div>
	</div>

	<div class="flex md:flex-row flex-col gap-8">
		<div
			class="flex flex-col gap-4 card p-4 object-fill justify-center items-center relative md:w-full"
		>
			<h2 class="h3">Weight Tracker</h2>
			{#if weightChart && dashboardData.weightMonthList.length > 0}
				<LineChartComponent data={weightChart.chartData} options={weightChart.chartOptions} />
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
			/>
		</div>
	</div>
</div>
