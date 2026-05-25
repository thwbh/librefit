import { test, expect } from '../fixtures/app';

/**
 * Data import e2e tests.
 *
 * Spec: openspec/specs/data-import/spec.md
 *
 * Note: import triggers Tauri's open-file dialog. Driving native dialogs from
 * Playwright is not directly possible; tests that require an actual file pick
 * will need a test-mode override or a mocked plugin-dialog. The "Import
 * button disabled before file selection" test does NOT require the dialog and
 * is implemented below.
 */

function ymd(d: Date): string {
	return d.toISOString().slice(0, 10);
}
function relativeRange(daysBefore: number, daysAfter: number) {
	const now = new Date();
	const start = new Date(now);
	start.setDate(now.getDate() - daysBefore);
	const end = new Date(now);
	end.setDate(now.getDate() + daysAfter);
	return { startDate: ymd(start), endDate: ymd(end) };
}

test('[IM-005] Import button is disabled before a file is selected', async ({ page, seed }) => {
	await seed.defaultProfile(relativeRange(10, 60));

	await page.goto('/import');

	const importButton = page.getByRole('button', { name: /^import$/i });
	await expect(importButton).toBeDisabled();
});

// [IM-001] Import intake CSV happy path
// [IM-002] Import weight CSV happy path
test.skip('[IM-001] [IM-002] [STG-001] [STG-002] import intake/weight CSV happy paths', async () => {
	// TODO: requires open-file-dialog override. Once the dialog mock is in
	// place, exercise both target selections with a small CSV fixture file
	// shipped alongside the test.
});

// [IM-003] Partial import with failures
test.skip('[IM-003] partial import surfaces success and failure counts', async () => {
	// TODO: import a CSV with a mix of valid and invalid rows; assert both
	// counts surface in the summary.
});

// [IM-004] Import cancellation
test.skip('[IM-004] [STG-003] cancel an in-flight import', async () => {
	// TODO: similar to EX-003.
});
