import { display_date_format_day, getDateAsStr, parseStringAsDate } from '$lib/date';
import type { CalorieTarget, CalorieTracker } from '$lib/model';
import type { ChartData } from 'chart.js';
import type { ChartProps } from './props';

const createCalorieTrackerQuickviewDataset = (
	calories: Array<CalorieTracker>,
	calorieTarget: CalorieTarget
): ChartData<'bar'> => {
	const style = getComputedStyle(document.body);
	const elemHtmlClasses = document.documentElement.classList;

	//let lineColor = style.getPropertyValue('--color-surface-500');
	let borderColor = style.getPropertyValue('--color-surface-200');
	const deficitColor = style.getPropertyValue('--color-primary-500');
	const surplusColor = style.getPropertyValue('--color-warning-500');
	const maximumColor = style.getPropertyValue('--color-error-500');

	if (elemHtmlClasses.contains('dark')) {
		borderColor = style.getPropertyValue('--color-surface-500');
		//lineColor = style.getPropertyValue('--color-surface-200');
	}

	const todayStr = getDateAsStr(new Date());

	calories = calories.filter((entry) => {
		return entry.added !== todayStr;
	});

	const sumPerDate = new Map<string, number>();

	calories.forEach((tracker: CalorieTracker) => {
		let sum = sumPerDate.get(tracker.added);

		if (!sum) sum = 0;

		sum += tracker.amount;

		sumPerDate.set(tracker.added, sum);
	});

	const labels: Array<string> = [];
	const intakeData: Array<number> = [];
	const targetData: Array<number> = [];

	const colors: Array<string> = [];
	const borderColors: Array<string> = [];

	sumPerDate.forEach((value: number, key: string) => {
		let color: string;

		const date: Date = parseStringAsDate(key);

		if (value <= calorieTarget.targetCalories) {
			color = deficitColor;
		} else if (value > calorieTarget.targetCalories && value <= calorieTarget.maximumCalories) {
			color = surplusColor;
		} else if (value > calorieTarget.maximumCalories) {
			color = maximumColor;
		}

		labels.push(getDateAsStr(date, display_date_format_day));

		intakeData.push(value);
		targetData.push(calorieTarget.targetCalories);

		colors.push(`rgb(${color} / .7)`);
		borderColors.push(`rgb(${borderColor})`);
	});

	return {
		labels: labels,
		datasets: [
			/*      {
              type: 'line',
              label: 'Target (kcal)',
              data: targetData,
              borderColor: `rgb(${lineColor})`,
            }, */
			{
				type: 'bar',
				label: 'Intake (kcal)',
				data: intakeData,
				backgroundColor: colors,
				borderColor: borderColors,
				borderWidth: 2
			}
		]
	};
};

export const paintCalorieTrackerQuickview = (
	entries: Array<CalorieTracker>,
	calorieTarget: CalorieTarget
): ChartProps<'bar'> => {
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
			data: chartData,
			options: {
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
						align: 'center'
					}
				}
			}
		};
	}

	return {
		data: undefined,
		options: undefined
	};
};
