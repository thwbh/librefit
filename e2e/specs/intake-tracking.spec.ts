import { test, expect } from '../fixtures/app';

/**
 * Intake tracking e2e tests.
 *
 * Spec: openspec/specs/intake-tracking/spec.md
 *
 * Many of these tests are gesture-driven (long-press, swipe). Playwright does
 * not have first-class swipe helpers; once `e2e/fixtures/gestures.ts` lands
 * (long-press + swipe-left/right via touch events or mouse drag), unstub the
 * affected cases.
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

test('[IT-001] [EMP-001] no intake today shows empty state alert', async ({ page, seed }) => {
	await seed.user();
	await seed.bodyData();
	await seed.intakeTarget(relativeRange(10, 60));
	await seed.weightTarget(relativeRange(10, 60));
	await seed.weightEntry({ date: dateOffset(0), weight: 75 });
	// Deliberately no intake entries.

	await page.goto('/');
	// IntakeStack renders a warning alert when no entries exist.
	await expect(page.getByText(/no.*intake.*tracked|add.*your.*first.*meal/i).first()).toBeVisible({
		timeout: 5000
	});
});

// [IT-002] [IT-003] [IT-004] Progress/shield by intake bucket
test.skip('[IT-002] [IT-003] [IT-004] intake score colors and shield icons by bucket', async () => {
	// TODO: seed three permutations of intake totals (within target, between
	// target and max, over max), navigate to dashboard each time, assert
	// the shield icon and colors match. Three sub-tests or a parameterized
	// loop.
});

// [IT-005] Create intake from dashboard
// [IT-006..009] Category auto-selection by time of day
// [IT-010] Cancel without saving
// [IT-015] [IT-016] Five categories incl. Treat; single selection
test.skip('[IT-005] [IT-015] [IT-016] add intake via FAB happy path', async () => {
	// TODO: click FAB, select category, adjust amount via NumberStepper,
	// optionally add description, save, assert entry appears.
});

// [IT-011] [IT-012] Edit via long press; save updates
// [IT-013] [IT-014] [MOD-002] [MOD-003] Delete with confirmation; cancel delete
test.skip('[IT-011] [IT-012] [IT-013] [IT-014] [GES-001] [MOD-002] [MOD-003] edit and delete cycle', async () => {
	// TODO: depends on long-press gesture helper.
});

// [IT-017] [GES-005] Navigate between intake stack cards via swipe
test.skip('[IT-017] [GES-005] swipe between intake stack cards', async () => {
	// TODO: depends on swipe gesture helper.
});

// [IT-018] Empty state — covered by [IT-001] above. Marked here for citation.
test.skip('[IT-018] empty state alert when no intake exists for today', async () => {
	// Covered above by [IT-001]; keeping this stub so the IT-018 ID has its
	// own dedicated declaration when the spec text says "warning alert".
});
