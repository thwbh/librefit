<script lang="ts">
	import { goto } from '$app/navigation';
	import Check from '$lib/assets/icons/check.svg?component';
	import History from '$lib/assets/icons/history.svg?component';
	import NoFood from '$lib/assets/icons/food-off.svg?component';
	import Overflow1 from '$lib/assets/icons/overflow-1.svg?component';
	import Overflow2 from '$lib/assets/icons/overflow-2.svg?component';
	import { Chart, registerables } from 'chart.js';
	import { createDistributionChart } from '$lib/distribution-chart';
	import { getAverageDailyIntake } from '$lib/calorie-util';
	import type { CalorieTarget, CalorieTracker, FoodCategory } from '$lib/model';
	import PolarAreaChartComponent from './chart/PolarAreaChartComponent.svelte';

	Chart.register(...registerables);

	interface Props {
		calorieTracker: Array<CalorieTracker>;
		displayClass?: string;
		displayHeader?: boolean;
		displayHistory?: boolean;
		headerText?: string;
		foodCategories: Array<FoodCategory>;
		calorieTarget: CalorieTarget;
	}

	let {
		calorieTracker,
		displayClass = '',
		displayHeader = true,
		displayHistory = true,
		headerText = 'Average distribution',
		foodCategories,
		calorieTarget
	}: Props = $props();
</script>

<div class="{displayClass} gap-4 text-center justify-between items-center relative h-full">
	{#if displayHeader}<h2 class="h3">{headerText}</h2>{/if}

	{#if calorieTracker && calorieTracker.length > 0}
		{@const polarAreaChart = createDistributionChart(
			calorieTracker,
			foodCategories,
			displayHistory
		)}
		{@const dailyAverage = getAverageDailyIntake(calorieTracker)}
		<div class="flex flex-col md:max-2xl:w-fit h-full justify-between gap-4">
			<PolarAreaChartComponent
				data={polarAreaChart.chartData}
				options={polarAreaChart.chartOptions}
			/>

			<div>
				<div class="w-full grid grid-cols-2 gap-2">
					<div class="text-right">&empty; daily intake:</div>
					<div class="flex flex-row text">
						~{dailyAverage}kcal

						{#if calorieTarget}
							{@const targetAverageRatio = dailyAverage / calorieTarget.targetCalories}
							<span>
								{#if targetAverageRatio <= 1}
									<Check color="rgb(var(--color-primary-700))" />
								{:else if targetAverageRatio > 1 && targetAverageRatio <= 1.15}
									<Overflow1 color="rgb(var(--color-warning-500))" />
								{:else}
									<Overflow2 color="rgb(var(--color-error-500))" />
								{/if}
							</span>
						{/if}
					</div>

					{#if calorieTarget}
						<div class="text-right">&empty; target intake:</div>
						<div class="text-left">
							~{calorieTarget.targetCalories}kcal
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-4 m-auto">
			<NoFood height={100} width={100} class="self-center" />
			<p>Nothing tracked yet.</p>
		</div>
	{/if}

	{#if displayHistory}
		<button class="btn variant-filled w-full" onclick={() => goto('/tracker/calories')}>
			<span>
				<History />
			</span>
			<span> History </span>
		</button>
	{/if}
</div>
