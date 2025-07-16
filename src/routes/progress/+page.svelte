<script lang="ts">
	import BottomDock from '$lib/component/BottomDock.svelte';
	import { LineChart } from '@thwbh/veilchen';

	let { data } = $props();

	const weightChartData = {
		data: {
			labels: data.trackerProgress.weightChartData.legend,
			datasets: [
				{
					label: 'Weight (kg)',
					data: data.trackerProgress.weightChartData.values,
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
			},
			scales: {
				y: {
					suggestedMin: data.trackerProgress.weightChartData.min - 2,
					suggestedMax: data.trackerProgress.weightChartData.max + 2
				}
			}
		}
	};

	const calorieChartData = {
		data: {
			labels: data.trackerProgress.calorieChartData.legend,
			datasets: [
				{
					label: 'Actual',
					data: data.trackerProgress.calorieChartData.values,
					tension: 0.4
				},
				{
					label: 'Maximum',
					data: data.trackerProgress.calorieChartData.legend.map(
						(_) => data.trackerProgress.calorieTarget.maximumCalories
					),
					tension: 0.4
				},
				{
					label: 'Target',
					data: data.trackerProgress.calorieChartData.legend.map(
						(_) => data.trackerProgress.calorieTarget.targetCalories
					)
				},
				{
					label: 'Average',
					data: data.trackerProgress.calorieChartData.legend.map(
						(_) => data.trackerProgress.calorieChartData.avg
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
			},
			scales: {
				y: {
					suggestedMin: data.trackerProgress.calorieChartData.min - 50,
					suggestedMax: data.trackerProgress.calorieChartData.max + 50
				}
			}
		}
	};
</script>

<div class="flex flex-col gap-4 p-4 pt-8">
	<h1 class="sr-only">Progress</h1>
	<span class="text-xl font-bold text-center">
		Day {data.trackerProgress.daysPassed}
	</span>

	<LineChart data={weightChartData.data} options={weightChartData.options} />

	<div class="flex flex-row justify-between">
		<div class="stat">
			<div class="stat-title">Starting weight</div>
			<div class="stat-value">
				{data.trackerProgress.weightChartData.values[0]}<span class="text-sm">kg</span>
			</div>
		</div>
		<div class="stat">
			<div class="stat-title text-right">Current weight</div>
			<div class="stat-value text-right">
				{data.trackerProgress.weightChartData.values[
					data.trackerProgress.weightChartData.values.length - 1
				]}
				<span class="text-sm">kg</span>
			</div>
		</div>
	</div>

	<LineChart data={calorieChartData.data} options={calorieChartData.options} />

	<div class="flex flex-row justify-between">
		<div class="stat">
			<div class="stat-title">Average per day</div>
			<div class="stat-value">
				{data.trackerProgress.calorieChartData.avg}
				<span class="text-sm">kcal</span>
			</div>
			<div class="stat-desc">Target: {data.trackerProgress.calorieTarget.targetCalories}kcal</div>
		</div>
		<div class="stat">
			<div class="stat-title text-right">∅ Deficit</div>
			<div class="stat-value text-right">
				{data.trackerProgress.calorieTarget.maximumCalories -
					data.trackerProgress.calorieChartData.dailyAverage}
				<span class="text-sm">kcal</span>
			</div>
			<div class="stat-desc text-right">
				target: {data.trackerProgress.calorieTarget.maximumCalories -
					data.trackerProgress.calorieTarget.targetCalories}
			</div>
		</div>
	</div>

	<BottomDock activeRoute="/progress" />
</div>
