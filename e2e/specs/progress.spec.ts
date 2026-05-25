import { test, expect } from '../fixtures/app';
import { ProgressPage } from '../pages/progress';

/**
 * Progress page e2e tests.
 *
 * Spec: openspec/specs/progress/spec.md
 */

function ymd(d: Date): string {
	return d.toISOString().slice(0, 10);
}
function dateOffset(daysFromToday: number): string {
	const d = new Date();
	d.setDate(d.getDate() + daysFromToday);
	return ymd(d);
}

test('[PG-004] [EMP-002] insufficient data state — only one day tracked', async ({
	page,
	seed
}) => {
	const startDate = dateOffset(0);
	const endDate = dateOffset(60);
	await seed.user();
	await seed.bodyData();
	await seed.intakeTarget({ startDate, endDate });
	await seed.weightTarget({ startDate, endDate });
	// Single weight entry → daysPassed < 2 → "Not enough data yet"
	await seed.weightEntry({ date: startDate, weight: 75 });

	const progress = new ProgressPage(page);
	await progress.goto();

	await expect(progress.insufficientDataMessage).toBeVisible();
	await expect(progress.chartCanvases).toHaveCount(0);
});

test('[PG-001] [PG-002] [PG-003] charts render when 2+ days of data exist', async ({
	page,
	seed
}) => {
	const startDate = dateOffset(-5);
	const endDate = dateOffset(60);
	await seed.user();
	await seed.bodyData();
	await seed.intakeTarget({ startDate, endDate, targetCalories: 2000, maximumCalories: 2500 });
	await seed.weightTarget({ startDate, endDate, initialWeight: 75, targetWeight: 70 });
	// Span multiple days to satisfy the 2-day threshold.
	await seed.weightEntry({ date: dateOffset(-5), weight: 75 });
	await seed.weightEntry({ date: dateOffset(-3), weight: 74.5 });
	await seed.weightEntry({ date: dateOffset(-1), weight: 74 });
	await seed.intakeEntry({ date: dateOffset(-5), amount: 1800, category: 'l' });
	await seed.intakeEntry({ date: dateOffset(-3), amount: 1900, category: 'd' });
	await seed.intakeEntry({ date: dateOffset(-1), amount: 1850, category: 'b' });

	const progress = new ProgressPage(page);
	await progress.goto();

	// [PG-003] Header shows day counter.
	await expect(progress.dayCounter).toBeVisible();
	// [PG-001] Charts rendered. Expect at least the weight + intake canvases.
	await expect(progress.chartCanvases.first()).toBeVisible();
	// [PG-002] Legend labels include "Target" — the actual/target distinction.
	await expect(page.getByText('Target').first()).toBeVisible();
});
