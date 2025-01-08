<script>
	import {getToastStore, RadioGroup, RadioItem} from '@skeletonlabs/skeleton';
	import {paintWeightTracker} from '$lib/weight-chart.ts';
	import {Line} from 'svelte-chartjs';
	import {Chart, registerables} from 'chart.js';
	import {showToastError} from '$lib/toast.ts';
	import {getContext} from 'svelte';
	import NoScale from '$lib/assets/icons/scale-outline-off.svg?component';
	import {listWeightFiltered} from '$lib/api/tracker.ts';
	import {DataViews, enumKeys} from '$lib/enum.ts';
	import {goto} from '$app/navigation';
	import {observeToggle} from '$lib/theme-toggle.ts';

	Chart.register(...registerables);

	const toastStore = getToastStore();
	const indicator = getContext('indicator');
	const user = getContext('user');

	if (!$user) goto('/');

	export let filter = DataViews.Month;

	/** @type import('./$types').PageData */
	export let data;

	const today = new Date();

	let entries;
	let chartData, chartOptions;

	observeToggle(document.documentElement, () => paint(entries));

	const loadEntriesFiltered = async () => {
		$indicator = $indicator.start();

		await listWeightFiltered(filter).then(async (result) => {
			/** @type Array<WeightTracker> */
			entries = result;

			paint(entries);
		}).catch(e => showToastError(toastStore, e)).finally(() => $indicator = $indicator.finish());
	}

	const paint = (entries) => {
		const paintMeta = paintWeightTracker(entries, today, filter);

		chartData = paintMeta.chartData;
		chartOptions = paintMeta.chartOptions;
	}

	$: if (data && data.entries) {
		entries = data.entries;

		paint(data.entries);
	}
</script>

<svelte:head>
	<title>LibreFit - Weight Tracker</title>
</svelte:head>

{#if $user}
<section>
	<div class="container mx-auto p-8 space-y-10">
		<h1 class="h1">
			Weight Progress
		</h1>

		<div class="flex flex-col gap-4">
			<RadioGroup>
				{#each enumKeys(DataViews) as dataView}
					<RadioItem bind:group={filter}
							   name="justify"
							   value={DataViews[dataView]}
							   on:change={loadEntriesFiltered}>
						{dataView}
					</RadioItem>
				{/each}
			</RadioGroup>

			{#if chartData }
				<Line data={chartData} options={chartOptions} />
			{:else}
				<div class="flex flex-col items-center text-center gap-4">
					<NoScale width={100} height={100}/>
					<p>
						Insufficient data to render your history.
					</p>
				</div>
			{/if}
		</div>
	</div>
</section>
{/if}