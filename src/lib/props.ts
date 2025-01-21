import type { HTMLCanvasAttributes } from 'svelte/elements';
import type { ChartData, ChartOptions, ChartTypeRegistry, Point } from 'chart.js';

export interface ChartProps<T extends keyof ChartTypeRegistry> extends HTMLCanvasAttributes {
	data: ChartData<T, (number | [number, number] | Point)[], unknown>;
	options: ChartOptions<T>;
}
