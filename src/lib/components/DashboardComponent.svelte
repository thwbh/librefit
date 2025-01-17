<script lang="ts">
	import { getDaytimeGreeting } from '$lib/date';
	import { DataViews } from '$lib/enum';
	import type {
		CalorieTarget,
		CalorieTracker,
		Dashboard,
		WeightTarget,
		WeightTracker
	} from '$lib/model';
	import { paintWeightTracker } from '$lib/weight-chart';
	import { Line } from 'svelte-chartjs';
	import CalorieDistribution from './CalorieDistribution.svelte';
	import CalorieQuickview from './CalorieQuickview.svelte';
	import CalorieTrackerComponent from './tracker/CalorieTrackerComponent.svelte';
	import WeightTrackerComponent from './tracker/WeightTrackerComponent.svelte';
	import ScaleOff from '$lib/assets/icons/scale-outline-off.svg?component';

	export let dashboardData: Dashboard;
	export let today: Date;

	// these properties needs to be passed as reactive
	export let caloriesTodayList: Array<CalorieTracker> = undefined;
	export let calorieTarget: CalorieTarget = undefined;
	export let caloriesWeekList: Array<CalorieTracker> = undefined;
	export let weightTodayList: Array<WeightTracker> = undefined;
	export let weightTarget: WeightTarget = undefined;

	export let onAddWeight: (e: CustomEvent<any>) => void;
	export let onAddCalories: (e: CustomEvent<any>) => void;
	export let onUpdateCalories: (e: CustomEvent<any>) => void;
	export let onDeleteCalories: (e: CustomEvent<any>) => void;

	export let onUpdateWeight: (e: CustomEvent<any>) => void;
	export let onDeleteWeight: (e: CustomEvent<any>) => void;

	export let setCalorieTarget: (e: CustomEvent<any>) => void;
	export let setWeightTarget: (e: CustomEvent<any>) => void;

	$: weightChart = paintWeightTracker(dashboardData.weightMonthList, today, DataViews.Month);
</script>

<div class="container md:w-fit mx-auto p-8 space-y-8">
	<h1 class="h1">Good {getDaytimeGreeting(new Date())}{dashboardData.userData.name}!</h1>
	<p>This is your daily summary.</p>
	<div class="flex flex-col gap-8 lg:grid grid-cols-3">
		<div class="card flex flex-col gap-4 p-4">
			<CalorieTrackerComponent
				calorieTracker={caloriesTodayList}
				categories={dashboardData.foodCategories}
				{calorieTarget}
				on:addCalories={onAddCalories}
				on:updateCalories={onUpdateCalories}
				on:deleteCalories={onDeleteCalories}
			/>
		</div>

		<div class="card flex flex-col gap-4 p-4">
			<CalorieDistribution
				displayClass="flex flex-col"
				foodCategories={dashboardData.foodCategories}
				bind:calorieTracker={caloriesWeekList}
				bind:calorieTarget
			/>
		</div>

		<div class="card p-4">
			<CalorieQuickview
				displayClass="flex flex-col"
				bind:calorieTracker={caloriesWeekList}
				{calorieTarget}
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
				<Line class="md:w-full" options={weightChart.chartOptions} data={weightChart.chartData} />
			{:else}
				<div>
					<ScaleOff width={100} height={100} class="self-center" />
				</div>
			{/if}
			<WeightTrackerComponent
				weightList={weightTodayList}
				{weightTarget}
				on:addWeight={onAddWeight}
				on:updateWeight={onUpdateWeight}
				on:deleteWeight={onDeleteWeight}
				on:setTarget={setWeightTarget}
			/>
		</div>
	</div>
</div>
