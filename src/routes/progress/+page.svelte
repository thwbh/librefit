<script lang="ts">
	import BottomDock from '$lib/component/BottomDock.svelte';
	import { ButtonGroup, LineChart } from '@thwbh/veilchen';

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
			responsive: true
		}
	};
</script>

<div class="flex flex-col gap-4">
	<LineChart data={lineChartData.data} options={lineChartData.options} />

	<BottomDock activeRoute="/progress" />
</div>
