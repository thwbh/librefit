import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
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

// A manually-resolvable analyze call so a test can interleave a cancel between
// "analysis started" and "result arrives" (FR-038).
const analyzeControl = vi.hoisted(() => {
	let resolve!: (value: unknown) => void;
	const analyzeMealPhoto = vi.fn(
		() =>
			new Promise((r) => {
				resolve = r;
			})
	);
	return {
		analyzeMealPhoto,
		resolveWith: (value: unknown) => resolve(value)
	};
});

vi.mock('$lib/api', () => ({
	createIntake: vi.fn(),
	createWeightTrackerEntry: vi.fn(),
	deleteIntake: vi.fn(),
	deleteWorkout: vi.fn(),
	updateIntake: vi.fn(),
	updateWeightTrackerEntry: vi.fn(),
	// Called from onMount: workout session resume + body model for the muscle map +
	// today's completed workouts and the exercise library for the card silhouettes.
	getActiveWorkout: vi.fn(() => Promise.resolve(null)),
	getBodyData: vi.fn(() => Promise.resolve({ sex: 'MALE' })),
	getExerciseLibrary: vi.fn(() => Promise.resolve([])),
	listWorkouts: vi.fn(() => Promise.resolve([])),
	unverifiedExerciseSummary: vi.fn(() => Promise.resolve({ count: 0 })),
	// AI meal-photo intake: status load on mount + the capture/analysis boundary.
	getAiIntakeConfig: vi.fn(() =>
		Promise.resolve({
			config: { enabled: true, consentGranted: true, baseUrl: 'https://api.mistral.ai/v1' },
			configured: true
		})
	),
	analyzeMealPhoto: analyzeControl.analyzeMealPhoto,
	grantAiIntakeConsent: vi.fn(() => Promise.resolve()),
	// Imported by the flat-CRUD editor; not called in the open→edit→Done flow.
	addWorkoutSet: vi.fn(),
	createWorkoutForDate: vi.fn(),
	updateWorkoutSet: vi.fn(),
	deleteWorkoutSet: vi.fn()
}));

vi.mock('$lib/avatar', () => ({
	getAvatarFromUser: () => 'data:image/svg+xml;avatar=test'
}));

// Keep the real helpers (confidenceLevel/aiErrorMessage) but stub the byte reader
// (jsdom has no File.arrayBuffer) and the native camera invoke, which resolves with
// image bytes so tapping the capture button proceeds straight to analysis.
vi.mock('$lib/food-recognition', async (orig) => ({
	...(await orig<typeof import('$lib/food-recognition')>()),
	fileToBytes: vi.fn(async () => [1, 2, 3]),
	capturePhotoFromCamera: vi.fn(async () => ({ image: [1, 2, 3], mime: 'image/jpeg' }))
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

function renderDashboardWithAi() {
	return render(TestWrapper, {
		props: {
			component: DashboardPage,
			props: {
				data: {
					dashboardData: makeDashboardData(),
					aiStatus: {
						config: { enabled: true, consentGranted: true, baseUrl: 'https://api.mistral.ai/v1' },
						configured: true
					}
				}
			},
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

	// SKIPPED: the dashboard's useRefresh registration was removed as a hotfix for a
	// Svelte 5.50 render-loop (pull-to-refresh disabled). Re-enable + restore this
	// assertion once fixed — see thwbh/librefit#248.
	it.skip('[AS-009] pull-to-refresh invalidates the dashboard data dependency', () => {
		renderDashboard();

		// The dashboard registered exactly one refresh handler via useRefresh.
		// TODO: reverted to zero to fix dashboard reload loop.
		expect(refreshCallbacks).toHaveLength(0);

		// Firing it (what AppShell's pull-to-refresh does) re-fetches dashboard
		// data by invalidating the load's `depends('data:dashboardData')` key.
		//		refreshCallbacks[0]();
		//		expect(invalidate).toHaveBeenCalledWith('data:dashboardData');
	});

	it('[FR-036] analysis opens the create modal in a loading state before the candidate arrives', async () => {
		const { container } = renderDashboardWithAi();

		// Tapping opens the camera directly; the mocked camera resolves and analysis
		// (deferred) begins, so the modal shows its loading state.
		await fireEvent.click(screen.getByLabelText(/estimate calories from a photo/i));
		await tick();
		await tick();

		expect(container.querySelector('[data-testid="intake-loading"]')).not.toBeNull();
	});

	it('[FR-038] cancelling during loading aborts cleanly — a late result does not pre-fill the mask', async () => {
		const { container } = renderDashboardWithAi();

		await fireEvent.click(screen.getByLabelText(/estimate calories from a photo/i));
		await tick();
		await tick();

		// User cancels while analysis is still in flight.
		await fireEvent.click(screen.getByRole('button', { name: /^Cancel$/ }));
		await tick();

		// The analysis result arrives late.
		analyzeControl.resolveWith({
			intake: { added: '2026-01-01', amount: 999, category: 'l', description: 'LatePizza' },
			lowConfidence: false,
			confidence: 0.9
		});
		await tick();
		await tick();

		// It must not re-open or pre-fill the mask.
		expect(screen.queryByText('LatePizza')).toBeNull();
		expect(container.querySelector('[data-testid="intake-loading"]')).toBeNull();
	});
});
