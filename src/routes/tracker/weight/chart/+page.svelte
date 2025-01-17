<script lang="ts">
	import { run } from 'svelte/legacy';

	import { getToastStore, RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import { paintWeightTracker } from '$lib/weight-chart';
	import { Chart, registerables, type ChartData, type ChartOptions } from 'chart.js';
	import { showToastError } from '$lib/toast';
	import { getContext } from 'svelte';
	import NoScale from '$lib/assets/icons/scale-outline-off.svg?component';
	import { listWeightFiltered } from '$lib/api/tracker';
	import { DataViews, enumKeys } from '$lib/enum';
	import { observeToggle } from '$lib/theme-toggle';
	import type { LibreUser, WeightTracker } from '$lib/model';
	import type { Indicator } from '$lib/indicator';
	import type { Writable } from 'svelte/store';
	import type { PageData } from '../$types';
	import LineChartComponent from '$lib/components/chart/LineChartComponent.svelte';

	Chart.register(...registerables);

	const toastStore = getToastStore();
	const indicator: Writable<Indicator> = getContext('indicator');
	const user: Writable<LibreUser> = getContext('user');

	interface Props {
		filter?: any;
		data: PageData;
	}

	let { filter = $bindable(DataViews.Month), data }: Props = $props();

	const today = new Date();

	let entries: Array<WeightTracker> = $state();
	let chartData: ChartData<'line'> = $state(),
		chartOptions: ChartOptions<'line'> = $state();

	observeToggle(document.documentElement, () => paint(entries));

	const loadEntriesFiltered = async () => {
		$indicator = $indicator.start();

		await listWeightFiltered(filter)
			.then(async (result) => {
				entries = result;

				paint(entries);
			})
			.catch((e) => showToastError(toastStore, e))
			.finally(() => ($indicator = $indicator.finish()));
	};

	const paint = (entries: Array<WeightTracker>) => {
		const paintMeta = paintWeightTracker(entries, today, filter);

		chartData = paintMeta.chartData;
		chartOptions = paintMeta.chartOptions;
	};

	run(() => {
		if (data && data.weightWeekList) {
			entries = data.weightWeekList;

			paint(entries);
		}
	});
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
					<RadioItem
						bind:group={filter}
						name="justify"
						value={DataViews[dataView]}
						on:change={loadEntriesFiltered}
					>
						{dataView}
					</RadioItem>
				{/each}
			</RadioGroup>

			{#if chartData}
				<LineChartComponent data={chartData} options={chartOptions} />
			{:else}
				<div class="flex flex-col items-center text-center gap-4">
					<NoScale width={100} height={100} />
					<p>Insufficient data to render your history.</p>
				</div>
			{/if}
		</div>
	</div>
</section>
