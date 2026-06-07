import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TestWrapper from '../../../../tests/utils/TestWrapper.svelte';

vi.mock('@thwbh/veilchen', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@thwbh/veilchen')>();
	// LineChart needs Chart.js + canvas, both unavailable in jsdom. Replace with no-op stub.
	const LineChart = function () {
		return { p: () => {}, d: () => {} };
	};
	return { ...actual, LineChart };
});

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/api', () => ({
	getBodyData: vi.fn(() => Promise.resolve({ sex: 'MALE' })),
	getExerciseLibrary: vi.fn(() => Promise.resolve([])),
	listWorkouts: vi.fn(() => Promise.resolve([]))
}));

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
import { listWorkouts } from '$lib/api';

// jsdom in this setup has no full localStorage; back it with a simple Map.
const lsStore = new Map<string, string>();
vi.stubGlobal('localStorage', {
	getItem: (k: string) => lsStore.get(k) ?? null,
	setItem: (k: string, v: string) => void lsStore.set(k, String(v)),
	removeItem: (k: string) => void lsStore.delete(k),
	clear: () => lsStore.clear()
});

const mockCategories = [
	{ shortvalue: 'b', longvalue: 'Breakfast' },
	{ shortvalue: 'l', longvalue: 'Lunch' },
	{ shortvalue: 'd', longvalue: 'Dinner' },
	{ shortvalue: 's', longvalue: 'Snack' },
	{ shortvalue: 't', longvalue: 'Treat' }
];

function progressWorkout(id: number, name: string) {
	return {
		session: {
			id,
			workoutType: 'wl',
			name,
			startedAt: '2026-06-04T10:00:00.000Z',
			endedAt: '2026-06-04T10:30:00.000Z'
		},
		exercises: [
			{
				id,
				exerciseId: 1,
				name: 'Bench Press',
				defaultRestSeconds: 90,
				sets: [{ id, loggedAt: '2026-06-04T10:05:00.000Z', metrics: { reps: 10, weightKg: 80 } }]
			}
		],
		pauses: []
	};
}

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
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset persisted segment + URL hash so each test starts on the default.
		localStorage.clear();
		window.location.hash = '';
	});

	it('[PG-005] defaults to the Body segment, with Body and Workout options', () => {
		renderPage(makeData());
		const body = screen.getByRole('button', { name: 'Body' });
		const workout = screen.getByRole('button', { name: 'Workout' });
		expect(body).toHaveAttribute('aria-pressed', 'true');
		expect(workout).toHaveAttribute('aria-pressed', 'false');
		// Body hosts the existing charts.
		expect(screen.getByText('Calorie Intake')).toBeInTheDocument();
	});

	it('[PG-007] does not fetch workout data until the Workout segment is selected', async () => {
		renderPage(makeData());
		expect(listWorkouts).not.toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('button', { name: 'Workout' }));
		expect(listWorkouts).toHaveBeenCalledTimes(1);
	});

	it('[PG-006] selecting Workout shows its view and reflects in the URL hash', async () => {
		renderPage(makeData());
		await fireEvent.click(screen.getByRole('button', { name: 'Workout' }));
		expect(window.location.hash).toBe('#workout');
		// Nutrition charts are gone; the workout range control / empty state shows.
		expect(screen.queryByText('Calorie Intake')).toBeNull();
		expect(screen.getByText('No workouts in range')).toBeInTheDocument();
	});

	it('[PG-008] persists the selected segment in localStorage', async () => {
		renderPage(makeData());
		await fireEvent.click(screen.getByRole('button', { name: 'Workout' }));
		expect(localStorage.getItem('progress-segment')).toBe('workout');
	});

	it('[PG-009] Workout segment offers a selectable range defaulting to 30 days', async () => {
		renderPage(makeData());
		await fireEvent.click(screen.getByRole('button', { name: 'Workout' }));
		const d30 = screen.getByRole('button', { name: '30 days' });
		const d90 = screen.getByRole('button', { name: '90 days' });
		expect(d30).toHaveAttribute('aria-pressed', 'true');
		expect(d90).toHaveAttribute('aria-pressed', 'false');
	});

	it('[PG-012] [PG-013] lists workouts in range and opens the detail on tap', async () => {
		vi.mocked(listWorkouts).mockResolvedValue([progressWorkout(1, 'Push Day')]);
		renderPage(makeData());
		await fireEvent.click(screen.getByRole('button', { name: 'Workout' }));
		const card = await screen.findByText('Push Day');
		await fireEvent.click(card);
		expect(await screen.findByRole('button', { name: 'Close' })).toBeInTheDocument();
	});

	it('[PG-014] shows an empty state when no workouts fall in range', async () => {
		vi.mocked(listWorkouts).mockResolvedValue([]);
		renderPage(makeData());
		await fireEvent.click(screen.getByRole('button', { name: 'Workout' }));
		expect(await screen.findByText('No workouts in range')).toBeInTheDocument();
	});

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
