import { format, sub } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { DataViews } from '$lib/enum.js';
import { getDateAsStr, parseStringAsDate } from '$lib/date.js';

/**
 * @param {DataViews} view
 * @param {Date} start
 * @param {Array<WeightTracker>} entries
 */
export const createWeightChart = (view, start, entries) => {
	const legend = [];
	const data = [];
	const begin = 1;
	let end;
	let displayFormat;
	let duration;
	switch (view) {
		case DataViews.Year:
			end = 12;
			displayFormat = 'LLLL yyyy';
			duration = { months: 1 };
			break;
		case DataViews.Month:
			end = new Date(start.getFullYear(), start.getMonth(), 0).getDate();
			displayFormat = 'dd.LL';
			duration = { days: 1 };
			break;
		case DataViews.Week:
			end = 7;
			displayFormat = 'EEEEEE';
			duration = { days: 1 };
			break;
		default:
			end = 1;
			displayFormat = 'dd';
			duration = {};
			break;
	}
	let tmpDate = start;
	let tmpDateStr = '';
	for (let i = begin, j = end - 1; i <= end; i++, j--) {
		tmpDateStr = getDateAsStr(tmpDate);
		const values = entries
			.filter((entry) => {
				const entryAdded = parseStringAsDate(entry.added);
				let filterPassed = false;
				switch (view) {
					case DataViews.Year:
						filterPassed =
							entryAdded.getFullYear() === tmpDate.getFullYear() &&
							entryAdded.getMonth() === tmpDate.getMonth();
						break;
					case DataViews.Month:
					case DataViews.Week:
						filterPassed = entry.added === tmpDateStr;
						break;
				}
				return filterPassed;
			})
			.map((entry) => entry.amount);
		if (values.length > 0) {
			const sum = values.reduce((a, b) => {
				return a + b;
			});
			if (sum) {
				data[j] = sum / values.length;
			} else {
				data[j] = NaN;
			}
		} else {
			data[j] = NaN;
		}
		legend[j] = format(tmpDate, displayFormat.valueOf(), { locale: enGB });
		tmpDate = sub(tmpDate, duration);
	}
	return { legend, data };
};

/**
 * @param {any} weight
 */
export const createWeightChartDataset = (weight) => {
	const style = getComputedStyle(document.body);
	const elemHtmlClasses = document.documentElement.classList;

	let lineColor = style.getPropertyValue('--color-surface-500');

	if (elemHtmlClasses.contains('dark')) {
		lineColor = style.getPropertyValue('--color-surface-200');
	}

	return {
		label: 'Weight (kg)',
		borderColor: `rgb(${lineColor})`,
		options: {
			fill: false,
			interaction: {
				intersect: false
			},
			radius: 0,
			tension: 1
		},
		spanGaps: true,
		data: weight
	};
};

/**
 *
 * @param {Array<WeightTracker>} entries
 * @param {Date} date
 * @param {DataViews} filter
 */
export const paintWeightTracker = (entries, date, filter) => {
	const style = getComputedStyle(document.body);
	const elemHtmlClasses = document.documentElement.classList;

	// let borderColor = style.getPropertyValue('--color-surface-200');
	// let labelColor = style.getPropertyValue('--color-surface-100');
	let labelTextColor = style.getPropertyValue('--color-surface-900');

	if (elemHtmlClasses.contains('dark')) {
		// borderColor = style.getPropertyValue('--color-surface-500');
		// labelColor = style.getPropertyValue('--color-surface-800');
		labelTextColor = style.getPropertyValue('--color-surface-100');
	}

	const noNaN = entries.map((entry) => entry.amount);

	if (noNaN.length > 0) {
		const chart = createWeightChart(filter, date, entries);
		const dataset = createWeightChartDataset(chart.data);

		return {
			chartData: {
				labels: chart.legend,
				datasets: [dataset]
			},
			chartOptions: {
				responsive: true,
				scales: {
					y: {
						suggestedMin: Math.min(...noNaN) - 2.5,
						suggestedMax: Math.max(...noNaN) + 2.5,
						ticks: {
							color: `rgb(${labelTextColor})`
						}
					},
					x: {
						ticks: {
							color: `rgb(${labelTextColor})`
						}
					}
				},
				plugins: {
					legend: {
						labels: {
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
