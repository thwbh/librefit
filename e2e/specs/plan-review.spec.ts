import { test, expect } from '../fixtures/app';
import { DashboardPage } from '../pages/dashboard';

/**
 * Plan review e2e tests.
 *
 * Spec: openspec/specs/plan-review/spec.md
 *
 * Date strategy: tests pick dates relative to "now at test start" so the
 * seeded plan period contains today regardless of when the suite runs. The
 * seed layer itself never observes the clock (see src-tauri/src/cmd/seed.rs).
 */

function ymd(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function relativeRange(
	daysBefore: number,
	daysAfter: number
): { startDate: string; endDate: string } {
	const now = new Date();
	const start = new Date(now);
	start.setDate(now.getDate() - daysBefore);
	const end = new Date(now);
	end.setDate(now.getDate() + daysAfter);
	return { startDate: ymd(start), endDate: ymd(end) };
}

test.describe('Plan review accordion', () => {
	test('[PR-001] [PR-002] expand and collapse the Review plan section', async ({ page, seed }) => {
		await seed.defaultProfile(relativeRange(30, 60));

		const dashboard = new DashboardPage(page);
		await dashboard.goto();

		// Collapsed by default — toggle is visible, content is not.
		await expect(dashboard.reviewPlanToggle).toBeVisible();
		await expect(dashboard.reviewPlanContent).toBeHidden();

		// [PR-001] Expand
		await dashboard.reviewPlanToggle.click();
		await expect(dashboard.reviewPlanContent).toBeVisible();

		// [PR-002] Collapse
		await dashboard.reviewPlanToggle.click();
		await expect(dashboard.reviewPlanContent).toBeHidden();
	});
});

test.describe('Encouragement messages', () => {
	// [PR-003] Goal reached — current weight ≥ target weight
	test.skip('[PR-003] goal reached shows celebratory message', async () => {
		// TODO: seed with current weight equal to (or past) target weight,
		// then expand plan review and assert celebratory message content.
	});

	// [PR-004] Early days — first 3 days of plan
	test.skip('[PR-004] first three days shows habit-building message', async () => {
		// TODO: seed with startDate = today, advance to dashboard, expand.
	});

	// [PR-005] Over target intake — average exceeds target
	test.skip('[PR-005] over-target intake shows adjustment suggestion', async () => {
		// TODO: seed several intake entries summing above the target across
		// the past few days, expand plan review, assert suggestion message.
	});

	// [PR-006] Near finish line — 14 or fewer days remaining
	test.skip('[PR-006] near finish line shows motivational message', async () => {
		// TODO: seed plan with endDate 10 days from now, expand, assert.
	});
});
