import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import TestWrapper from '../../../tests/utils/TestWrapper.svelte';

// Capture the callback the dashboard registers with veilchen's useRefresh so we
// can fire it as if the user pulled to refresh — without simulating the gesture.
const refreshCallbacks: Array<() => void> = [];

vi.mock('@thwbh/veilchen', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@thwbh/veilchen')>();
	return {
		...actual,
		useRefresh: (cb: () => void) => {
			refreshCallbacks.push(cb);
		}
	};
});

vi.mock('$app/navigation', () => ({
	invalidate: vi.fn()
}));

vi.mock('@tauri-apps/plugin-log', () => ({ debug: vi.fn() }));

vi.mock('$lib/api', () => ({
	createIntake: vi.fn(),
	createWeightTrackerEntry: vi.fn(),
	deleteIntake: vi.fn(),
	updateIntake: vi.fn(),
	updateWeightTrackerEntry: vi.fn(),
	// Called from onMount: workout session resume + body model for the muscle map.
	getActiveWorkout: vi.fn(() => Promise.resolve(null)),
	getBodyData: vi.fn(() => Promise.resolve({ sex: 'MALE' }))
}));

vi.mock('$lib/avatar', () => ({
	getAvatarFromUser: () => 'data:image/svg+xml;avatar=test'
}));

import DashboardPage from './+page.svelte';
import { invalidate } from '$app/navigation';

const mockCategories = [
	{ shortvalue: 'b', longvalue: 'Breakfast' },
	{ shortvalue: 'l', longvalue: 'Lunch' },
	{ shortvalue: 'd', longvalue: 'Dinner' },
	{ shortvalue: 's', longvalue: 'Snack' },
	{ shortvalue: 't', longvalue: 'Treat' }
];

function makeDashboardData() {
	return {
		intakeTodayList: [],
		intakeWeekList: [],
		weightTodayList: [{ id: 1, added: '2026-05-28', amount: 80 }],
		weightLatest: { id: 1, added: '2026-05-28', amount: 80 },
		weightTarget: {
			id: 1,
			added: '2026-05-01',
			startDate: '2026-05-01',
			endDate: '2026-07-01',
			initialWeight: 85,
			targetWeight: 75
		},
		intakeTarget: {
			id: 1,
			added: '2026-05-01',
			startDate: '2026-05-01',
			endDate: '2026-07-01',
			targetCalories: 2000,
			maximumCalories: 2500
		},
		daysTotal: 60,
		currentDay: 27
	};
}

function renderDashboard() {
	return render(TestWrapper, {
		props: {
			component: DashboardPage,
			props: { data: { dashboardData: makeDashboardData() } },
			categories: mockCategories,
			user: { id: 1, name: 'Alice', avatar: 'alice' }
		}
	});
}

describe('dashboard page', () => {
	beforeEach(() => {
		refreshCallbacks.length = 0;
		vi.clearAllMocks();
	});

	it('[AS-009] pull-to-refresh invalidates the dashboard data dependency', () => {
		renderDashboard();

		// The dashboard registered exactly one refresh handler via useRefresh.
		expect(refreshCallbacks).toHaveLength(1);

		// Firing it (what AppShell's pull-to-refresh does) re-fetches dashboard
		// data by invalidating the load's `depends('data:dashboardData')` key.
		refreshCallbacks[0]();
		expect(invalidate).toHaveBeenCalledWith('data:dashboardData');
	});
});
