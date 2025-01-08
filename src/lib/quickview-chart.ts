import { display_date_format_day, getDateAsStr, parseStringAsDate } from '$lib/date';
import type { CalorieTarget, CalorieTracker } from '$lib/model';
import type { ChartData, ChartOptions } from 'chart.js';

const createCalorieTrackerQuickviewDataset = (calories: Array<CalorieTracker>, calorieTarget: CalorieTarget) => {
	const style = getComputedStyle(document.body);
	const elemHtmlClasses = document.documentElement.classList;

	let lineColor = style.getPropertyValue('--color-surface-500');
	let borderColor = style.getPropertyValue('--color-surface-200');
	let deficitColor = style.getPropertyValue('--color-primary-500');
	let surplusColor = style.getPropertyValue('--color-warning-500');
	let maximumColor = style.getPropertyValue('--color-error-500');

	if (elemHtmlClasses.contains('dark')) {
		borderColor = style.getPropertyValue('--color-surface-500');
		lineColor = style.getPropertyValue('--color-surface-200');
	}

	const todayStr = getDateAsStr(new Date());

	calories = calories.filter((entry) => {
		return entry.added !== todayStr;
	});

	const sum = calories.reduce((acc, obj) => {
		let key = obj.added;
		if (!acc[key]) {
			acc[key] = 0;
		}
		acc[key] += obj.amount;
		return acc;
	}, {});

	const labels = [];
	const data = [];
	const lineData = [];
	const colors = [];
	const borderColors = [];

	Object.keys(sum).forEach((dateStr) => {
		let color;

		const total = sum[dateStr];
		const date = parseStringAsDate(dateStr);

		if (total <= calorieTarget.targetCalories) {
			color = deficitColor;
		} else if (total > calorieTarget.targetCalories && total <= calorieTarget.maximumCalories) {
			color = surplusColor;
		} else if (total > calorieTarget.maximumCalories) {
			color = maximumColor;
		}

		labels.push(getDateAsStr(date, display_date_format_day));
		data.push(total);
		lineData.push(calorieTarget.targetCalories);
		colors.push(`rgb(${color} / .7)`);
		borderColors.push(`rgb(${borderColor})`);
	});

	return {
		labels: labels,
		datasets: [
			{
				type: 'line',
				label: 'Target (kcal)',
				data: lineData,
				borderColor: `rgb(${lineColor})`,
				borderDash: [6],
				pointRadius: 0,
				pointHoverRadius: 10,
				spanGaps: true
			},
			{
				type: 'bar',
				label: 'Intake (kcal)',
				data: data,
				backgroundColor: colors,
				borderColor: borderColors,
				borderWidth: 2
			}
		]
	};
};

export const paintCalorieTrackerQuickview = (entries: Array<CalorieTracker>, calorieTarget: CalorieTarget): BarChartConfig => {
	const style = getComputedStyle(document.body);
	const elemHtmlClasses = document.documentElement.classList;

	let labelColor = style.getPropertyValue('--color-surface-100');
	let labelTextColor = style.getPropertyValue('--color-surface-900');

	if (elemHtmlClasses.contains('dark')) {
		labelColor = style.getPropertyValue('--color-surface-800');
		labelTextColor = style.getPropertyValue('--color-surface-100');
	}

	const noNaN = entries.map((entry) => entry.amount);

	const chartData = createCalorieTrackerQuickviewDataset(entries, calorieTarget);

	if (noNaN.length > 0) {
		return {
			chartData: {
				labels: chartData.labels,
				datasets: chartData.datasets
			},
			chartOptions: {
				indexAxis: 'y',
				scales: {
					y: {
						beginAtZero: false,
						ticks: {
							backdropColor: `rgb(${labelColor})`,
							color: `rgb(${labelTextColor})`
						}
					},
					x: {
						ticks: {
							backdropColor: `rgb(${labelColor})`,
							color: `rgb(${labelTextColor})`
						}
					}
				},
				responsive: true,
				aspectRatio: 0.73,
				plugins: {
					legend: {
						display: false,
						align: 'center',
						label: {
							color: `rgb(${labelTextColor})`
						}
					}
				}
			}
		};
	}

	return {
		chartData: undefined,
		chartOptions: undefined
	};
};

export interface BarChartConfig {
	chartData: ChartData<any>,
	chartOptions: ChartOptions<any>
}