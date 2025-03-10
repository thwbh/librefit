import { getAverageCategoryIntake } from './calorie-util';
import type { CalorieTracker, FoodCategory } from '$lib/model';
import type { ChartData, ChartOptions } from 'chart.js';
import type { ChartProps } from './props';

export interface PolarAreaChartConfig {
	chartData: ChartData<'polarArea'>;
	chartOptions: ChartOptions<'polarArea'>;
}

export const createDistributionChart = (
	entries: Array<CalorieTracker>,
	foodCategories: Array<FoodCategory>,
	displayHistory: boolean
): ChartProps<'polarArea'> => {
	if (
		!entries ||
		(entries && entries.length <= 0) ||
		!foodCategories ||
		(foodCategories && foodCategories.length <= 0)
	) {
		return {
			data: undefined,
			options: undefined
		};
	}

	const style = getComputedStyle(document.body);
	const elemHtmlClasses = document.documentElement.classList;

	let borderColor = style.getPropertyValue('--color-surface-200');
	let labelColor = displayHistory
		? style.getPropertyValue('--color-surface-100')
		: style.getPropertyValue('--color-surface-50');
	let labelTextColor = style.getPropertyValue('--color-surface-900');

	if (elemHtmlClasses.contains('dark')) {
		borderColor = style.getPropertyValue('--color-surface-500');
		labelColor = displayHistory
			? style.getPropertyValue('--color-surface-800')
			: style.getPropertyValue('--color-surface-900');
		labelTextColor = style.getPropertyValue('--color-surface-100');
	}

	const labels: Array<string> = [];
	const values: Array<number> = [];

	const averageCategoryIntake = getAverageCategoryIntake(entries, foodCategories);

	if (averageCategoryIntake != null) {
		foodCategories.forEach((cat) => {
			const averageIntake = averageCategoryIntake.get(cat.shortvalue);

			if (averageIntake > 0) {
				values.push(averageCategoryIntake.get(cat.shortvalue));
				labels.push(cat.longvalue);
			}
		});
	}

	return {
		data: {
			labels: labels,
			datasets: [
				{
					label: '∅ kcal',
					data: values,
					hoverOffset: 4,
					backgroundColor: [
						`rgb(${style.getPropertyValue('--color-primary-500')} / .7)`,
						`rgb(${style.getPropertyValue('--color-secondary-500')} / .7)`,
						`rgb(${style.getPropertyValue('--color-tertiary-500')} / .7)`,
						`rgb(${style.getPropertyValue('--color-warning-500')} / .7)`,
						`rgb(${style.getPropertyValue('--color-error-500')} / .7)`
					],
					borderColor: `rgb(${borderColor})`
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: false,
					align: 'center',
					text: 'Last 7 days'
				},
				legend: {
					align: 'center',
					labels: {
						color: `rgb(${labelTextColor})`
					}
				}
			},
			scales: {
				r: {
					ticks: {
						backdropColor: `rgb(${labelColor})`,
						color: `rgb(${labelTextColor})`
					}
				}
			}
		}
	};
};
