<script lang="ts">
	import { getTrackerProgress } from '$lib/api/progress';
	import BottomDock from '$lib/component/BottomDock.svelte';
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import { ButtonGroup, LineChart, PolarAreaChart } from '@thwbh/veilchen';
	import { elements } from 'chart.js';

	let { data } = $props();

	let progress = $state(data.trackerProgress);

	const entries = [
		{ key: 'w', value: 'Week' },
		{ key: 'm', value: 'Month' },
		{ key: 'o', value: 'Overall' }
	];

	let value = $state('o'); // Default to 'Option A'

	const axisLabel = 'Weight (kg)';

	const lineChartData = {
		data: {
			labels: data.trackerProgress.weightLegend,
			datasets: [
				{
					label: axisLabel,
					data: data.trackerProgress.weightValues,
					tension: 0.4
				}
			]
		},
		options: {
			responsive: true,
			elements: {
				point: {
					radius: 0
				}
			}
		}
	};

	const calorieChartData = {
		data: {
			labels: data.trackerProgress.caloriesLegend,
			datasets: [
				{
					label: 'Calories',
					data: data.trackerProgress.caloriesValues,
					tension: 0.4
				},
				{
					label: 'Maximum',
					data: data.trackerProgress.caloriesLegend.map(
						(_) => data.trackerProgress.calorieTarget.maximumCalories
					),
					tension: 0.4
				},
				{
					label: 'Target',
					data: data.trackerProgress.caloriesLegend.map(
						(_) => data.trackerProgress.calorieTarget.targetCalories
					)
				}
			]
		},
		options: {
			responsive: true,
			elements: {
				point: {
					radius: 0
				}
			}
		}
	};

	const distributionChartData = {
		data: {
			labels: Object.keys(data.trackerProgress.caloriesCategoryAverage),
			datasets: [
				{
					label: '∅ kcal',
					data: Object.values(data.trackerProgress.caloriesCategoryAverage)
				}
			]
		},
		options: {
			responsive: true
		}
	};
</script>

<div class="flex flex-col gap-4 p-4">
	<h1 class="sr-only">Progress</h1>
	<span class="text-xl font-bold text-center">
		Day {data.trackerProgress.daysPassed}
	</span>

	<LineChart data={lineChartData.data} options={lineChartData.options} />

	<div class="flex flex-row justify-between">
		<div class="stat">
			<div class="stat-title">Starting weight</div>
			<div class="stat-value">
				{data.trackerProgress.weightValues[0]}<span class="text-sm">kg</span>
			</div>
		</div>
		<div class="stat">
			<div class="stat-title text-right">Current weight</div>
			<div class="stat-value text-right">
				{data.trackerProgress.weightValues[data.trackerProgress.weightValues.length - 1]}
				<span class="text-sm">kg</span>
			</div>
		</div>
	</div>

	<LineChart data={calorieChartData.data} options={calorieChartData.options} />

	<div class="flex flex-row justify-between">
		<div class="stat">
			<div class="stat-title">Average per day</div>
			<div class="stat-value">
				{data.trackerProgress.caloriesDailyAverage}
				<span class="text-sm">kcal</span>
			</div>
			<div class="stat-desc">Target: {data.trackerProgress.calorieTarget.targetCalories}kcal</div>
		</div>
		<div class="stat">
			<div class="stat-title text-right">∅ Deficit</div>
			<div class="stat-value text-right">
				{data.trackerProgress.calorieTarget.maximumCalories -
					data.trackerProgress.caloriesDailyAverage}
				<span class="text-sm">kcal</span>
			</div>
			<div class="stat-desc text-right">
				target: {data.trackerProgress.calorieTarget.maximumCalories -
					data.trackerProgress.calorieTarget.targetCalories}
			</div>
		</div>
	</div>

	<!--
	<PolarAreaChart data={distributionChartData.data} options={distributionChartData.options} /> -->

	<BottomDock activeRoute="/progress" />
</div>
