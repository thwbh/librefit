import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TestWrapper from '../../../../tests/utils/TestWrapper.svelte';

vi.mock('@thwbh/veilchen', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@thwbh/veilchen')>();
	// LineChart needs Chart.js + canvas, both unavailable in jsdom. Replace with no-op stub.
	const LineChart = function () {
		return { p: () => {}, d: () => {} };
	};
	return { ...actual, LineChart };
});

vi.mock('@number-flow/svelte', () => {
	const NumberFlowMock = function (anchor: any, props: any) {
		const value = props?.value ?? 0;
		const textNode = document.createTextNode(String(value));
		if (anchor && anchor.parentNode) {
			anchor.parentNode.insertBefore(textNode, anchor);
		}
		return {
			p: (newProps: any) => {
				if (newProps.value !== undefined) textNode.textContent = String(newProps.value);
			},
			d: () => {
				if (textNode.parentNode) textNode.parentNode.removeChild(textNode);
			}
		};
	};
	return { default: NumberFlowMock };
});

import Page from './+page.svelte';

const mockCategories = [
	{ shortvalue: 'b', longvalue: 'Breakfast' },
	{ shortvalue: 'l', longvalue: 'Lunch' },
	{ shortvalue: 'd', longvalue: 'Dinner' },
	{ shortvalue: 's', longvalue: 'Snack' },
	{ shortvalue: 't', longvalue: 'Treat' }
];

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		trackerProgress: {
			daysPassed: 5,
			daysTotal: 30,
			weightTarget: {
				initialWeight: 85,
				targetWeight: 75
			},
			intakeTarget: {
				targetCalories: 2000,
				maximumCalories: 2200
			},
			weightChartData: {
				legend: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
				values: [85, 84.8, 84.5, 84.2, 84.0, 83.8],
				min: 83.8,
				max: 85,
				avg: 84.4
			},
			intakeChartData: {
				legend: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
				values: [1800, 1900, 2000, 1950, 2050, 1850],
				min: 1800,
				max: 2050,
				avg: 1925,
				dailyAverage: 1925,
				categoryAverage: { l: 500, d: 600, b: 300 }
			},
			...overrides
		}
	};
}

function renderPage(data: ReturnType<typeof makeData>) {
	return render(TestWrapper, {
		props: {
			component: Page,
			props: { data },
			categories: mockCategories
		}
	});
}

describe('progress page', () => {
	it('[PG-001] should render the page header with start and current weight when there is sufficient data', () => {
		renderPage(makeData());

		expect(screen.getByText('Your Progress')).toBeTruthy();
		expect(screen.getByText('Start')).toBeTruthy();
		expect(screen.getByText('Current')).toBeTruthy();
	});

	it('[PG-002] should display Actual and Target legend labels for both weight and intake charts', () => {
		renderPage(makeData());

		expect(screen.getAllByText('Actual').length).toBeGreaterThanOrEqual(2);
		expect(screen.getAllByText('Target').length).toBeGreaterThanOrEqual(2);
	});

	it('[PG-003] should display the progress day count in the header', () => {
		renderPage(makeData({ daysPassed: 5, daysTotal: 30 }));

		// "Day 6 of 31" — daysPassed + 1 / daysTotal + 1
		expect(screen.getByText(/Day 6 of 31/)).toBeTruthy();
	});

	it('[PG-004] [EMP-002] should show the empty-state message when fewer than 2 days have passed', () => {
		renderPage(makeData({ daysPassed: 0 }));

		expect(screen.getByText('Not enough data yet')).toBeTruthy();
		expect(screen.getByText(/Track for at least 2 days/)).toBeTruthy();
	});
});
