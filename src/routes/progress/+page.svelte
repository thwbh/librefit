<script lang="ts">
	import BottomDock from '$lib/component/BottomDock.svelte';
	import { LineChart } from '@thwbh/veilchen';

	let { data } = $props();

	let progress = $state(data.trackerProgress);

	const legend = ['1', '2', '3', '4', '5', '6', '7'];
	const axisLabel = 'Value (Mt)';
	const lineData = [19, 45, 100, 98, 99, 35, 31];

	const lineChartData = {
		data: {
			labels: legend,
			datasets: [
				{
					label: axisLabel,
					data: lineData
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

	{JSON.stringify(progress)}

	<BottomDock activeRoute="/progress" />
</div>
