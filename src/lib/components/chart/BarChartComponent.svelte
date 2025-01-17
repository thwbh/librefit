<script lang="ts">
	import { Chart, Tooltip } from 'chart.js';
	import type { ChartProps } from '$lib/props';

	const { data, options, ...rest }: ChartProps<'bar'> = $props();

	Chart.register(Tooltip);

	let canvasElem: HTMLCanvasElement;
	let chart: Chart;

	$effect(() => {
		chart = new Chart(canvasElem, {
			type: 'line',
			data,
			options
		});

		return () => {
			chart.destroy();
		};
	});

	$effect(() => {
		if (chart) {
			chart.data = data;
			chart.update();
		}
	});
</script>

<canvas bind:this={canvasElem} {...rest}></canvas>
