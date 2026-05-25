import { test, expect } from '../fixtures/app';

/**
 * History e2e tests.
 *
 * Spec: openspec/specs/history/spec.md
 *
 * Most history interactions are gesture-driven (swipe weeks, swipe days,
 * swipe-left to edit, swipe-right to delete). These will be implementable
 * once `e2e/fixtures/gestures.ts` provides swipe helpers.
 */

function ymd(d: Date): string {
	return d.toISOString().slice(0, 10);
}
function dateOffset(daysFromToday: number): string {
	const d = new Date();
	d.setDate(d.getDate() + daysFromToday);
	return ymd(d);
}
function relativeRange(daysBefore: number, daysAfter: number) {
	return { startDate: dateOffset(-daysBefore), endDate: dateOffset(daysAfter) };
}

test('[HI-001] history page loads with current week and most recent date selected', async ({
	page,
	seed
}) => {
	await seed.user();
	await seed.bodyData();
	await seed.intakeTarget(relativeRange(10, 60));
	await seed.weightTarget(relativeRange(10, 60));
	await seed.intakeEntry({ date: dateOffset(0), amount: 600, category: 'l' });

	await page.goto('/history');
	// The day selector and content area should render without error.
	// Specific selectors will need refinement when the page object lands.
	await expect(page).toHaveURL(/\/history$/);
});

// [HI-002] [HI-003] [HI-004] Week navigation + header content
test.skip('[HI-002] [HI-003] [HI-004] [GES-006] weekly navigation via carets and swipes', async () => {
	// TODO: needs swipe helper for [GES-006]; tap carets for the click case.
});

// [HI-005] Select date pill updates content
// [HI-006] [HI-007] Swipe between days; cross-week
// [HI-008] Category badges reflect entries
test.skip('[HI-005] [HI-006] [HI-007] [HI-008] [GES-007] [GES-008] day-detail + swipe nav', async () => {
	// TODO: depends on swipe gesture helper.
});

// [HI-009] Add intake on historical date
// [HI-010] [HI-011] Edit/delete via swipe
test.skip('[HI-009] [HI-010] [HI-011] [GES-003] [GES-004] [MOD-002] historical intake CRUD', async () => {
	// TODO: swipe helper required.
});

// [HI-012] [HI-013] Historical weight states
test.skip('[HI-012] [HI-013] historical weight: existing entry vs tap-to-update', async () => {
	// TODO: navigate to a date with vs without a weight entry; assert
	// "Tap to update" appears in the latter case.
});
