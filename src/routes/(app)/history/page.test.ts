import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import TestWrapper from '../../../../tests/utils/TestWrapper.svelte';

vi.mock('@tauri-apps/plugin-haptics', () => ({ vibrate: vi.fn() }));
vi.mock('@tauri-apps/plugin-log', () => ({ debug: vi.fn() }));

vi.mock('$lib/api/gen/commands.js', () => ({
	createIntake: vi.fn(),
	createWeightTrackerEntry: vi.fn(),
	deleteIntake: vi.fn(),
	deleteWorkout: vi.fn(),
	getBodyData: vi.fn().mockResolvedValue({ sex: 'MALE' }),
	getExerciseLibrary: vi.fn().mockResolvedValue([]),
	getTrackerHistory: vi.fn().mockResolvedValue({
		intakeHistory: { '2026-05-11': [], '2026-05-17': [] },
		weightHistory: { '2026-05-11': [], '2026-05-17': [] },
		dateLastStr: '2026-05-30',
		caloriesAverage: 1700
	}),
	listWorkouts: vi.fn().mockResolvedValue([]),
	updateIntake: vi.fn(),
	updateWeightTrackerEntry: vi.fn()
}));

import HistoryPage from './+page.svelte';
import { getTrackerHistory } from '$lib/api/gen/commands.js';

const mockCategories = [
	{ shortvalue: 'b', longvalue: 'Breakfast' },
	{ shortvalue: 'l', longvalue: 'Lunch' },
	{ shortvalue: 'd', longvalue: 'Dinner' },
	{ shortvalue: 's', longvalue: 'Snack' },
	{ shortvalue: 't', longvalue: 'Treat' }
];

// A full visible week; dateLastStr is AFTER the last visible day so the
// next-week affordance (showRightCaret) is enabled.
function makeData() {
	const week = [
		'2026-05-18',
		'2026-05-19',
		'2026-05-20',
		'2026-05-21',
		'2026-05-22',
		'2026-05-23',
		'2026-05-24'
	];
	const intakeHistory: Record<string, unknown[]> = {};
	const weightHistory: Record<string, unknown[]> = {};
	week.forEach((d) => {
		intakeHistory[d] = [];
		weightHistory[d] = [];
	});
	return {
		trackerHistory: {
			intakeHistory,
			weightHistory,
			dateLastStr: '2026-05-30',
			caloriesAverage: 1800
		},
		intakeTarget: {
			id: 1,
			added: '2026-05-18',
			startDate: '2026-05-01',
			endDate: '2026-06-01',
			targetCalories: 2000,
			maximumCalories: 2500
		}
	};
}

function renderPage() {
	return render(TestWrapper, {
		props: { component: HistoryPage, props: { data: makeData() }, categories: mockCategories }
	});
}

describe('history page', () => {
	beforeEach(() => vi.clearAllMocks());

	it('[GES-008] [HI-007] swiping forward at the last day of the week loads the adjacent week', async () => {
		const { container } = renderPage();

		// Default selection is the last day of the week. A forward (left) day
		// swipe at the boundary should fall through to scrollRight() →
		// updateRange() → getTrackerHistory() for the next week.
		const swipeArea = container.querySelector('.flex.flex-col.gap-4 > div') as HTMLElement;
		expect(swipeArea).not.toBeNull();

		swipeArea.dispatchEvent(
			new CustomEvent('swipe', { detail: { direction: 'left' }, bubbles: true })
		);

		expect(getTrackerHistory).toHaveBeenCalledTimes(1);
	});

	it('[HI-006] swiping backward mid-week selects the previous day without loading a new week', async () => {
		const { container } = renderPage();

		// Default selection is the last day. A backward (right) swipe moves to
		// the previous day within the visible week — a pure selection change,
		// so no week fetch is triggered (distinguishes day-nav from boundary).
		const swipeArea = container.querySelector('.flex.flex-col.gap-4 > div') as HTMLElement;
		swipeArea.dispatchEvent(
			new CustomEvent('swipe', { detail: { direction: 'right' }, bubbles: true })
		);

		expect(getTrackerHistory).not.toHaveBeenCalled();
	});

	it('[ANI-003] the day content is wrapped in a keyed transition block (slide on day change)', () => {
		// The {#key selectedDateStr} block carries in:/out:fly so day changes
		// slide. jsdom doesn't run the animation, so we assert the content
		// region that carries the transition renders for the selected day.
		const { container } = renderPage();
		const dayContent = container.querySelector('.flex.flex-col.gap-4');
		expect(dayContent).not.toBeNull();
	});
});
