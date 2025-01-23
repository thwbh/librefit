<script lang="ts">
	import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import { paintWeightTracker } from '$lib/weight-chart';
	import { Chart, registerables } from 'chart.js';
	import NoScale from '$lib/assets/icons/scale-outline-off.svg?component';
	import { listWeightFiltered } from '$lib/api/tracker';
	import { DataViews, enumKeys } from '$lib/enum';
	import LineChartComponent from '$lib/components/chart/LineChartComponent.svelte';

	Chart.register(...registerables);

	interface Props {
		filter?: any;
	}

	let { filter = $bindable(DataViews.Month) }: Props = $props();

	const today = new Date();
</script>

<svelte:head>
	<title>LibreFit - Weight Tracker</title>
</svelte:head>

<section>
	<div class="container mx-auto p-8 space-y-10">
		<h1 class="h1">Weight Progress</h1>

		<div class="flex flex-col gap-4">
			<RadioGroup>
				{#each enumKeys(DataViews) as dataView}
					<RadioItem bind:group={filter} name="justify" value={DataViews[dataView]}>
						{dataView}
					</RadioItem>
				{/each}
			</RadioGroup>

			{#await listWeightFiltered(filter) then weightData}
				{#if weightData.length > 0}
					{@const weightChart = paintWeightTracker(weightData, today, filter)}
					<LineChartComponent data={weightChart.data} options={weightChart.options} />
				{:else}
					<div class="flex flex-col items-center text-center gap-4">
						<NoScale width={100} height={100} />
						<p>Insufficient data to render your history.</p>
					</div>
				{/if}
			{/await}
		</div>
	</div>
</section>
