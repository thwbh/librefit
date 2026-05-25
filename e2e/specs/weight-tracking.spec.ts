import { test, expect } from '../fixtures/app';

/**
 * Weight tracking e2e tests.
 *
 * Spec: openspec/specs/weight-tracking/spec.md
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

test.describe('Weight score display', () => {
	test('[WT-001] weight tracked today shows current value', async ({ page, seed }) => {
		await seed.user();
		await seed.bodyData();
		await seed.intakeTarget(relativeRange(10, 60));
		await seed.weightTarget(relativeRange(10, 60));
		await seed.weightEntry({ date: dateOffset(0), weight: 74.5 });

		await page.goto('/');
		await expect(page.getByText('Current Weight')).toBeVisible();
		await expect(page.getByText(/74[.,]5/)).toBeVisible();
		// No "Tap to update" hint when an entry exists for today.
		await expect(page.getByText('Tap to update')).toBeHidden();
	});

	test('[WT-002] [EMP-003] no entry today shows pulsing tap-to-update prompt', async ({
		page,
		seed
	}) => {
		await seed.user();
		await seed.bodyData();
		await seed.intakeTarget(relativeRange(10, 60));
		await seed.weightTarget(relativeRange(10, 60));
		// No weight entry → stale state.
		// (Note: weight target carries an initialWeight that may be shown as a
		// fallback display value; the spec's contract is that the "Tap to
		// update" hint is visible.)

		await page.goto('/');
		await expect(page.getByText('Tap to update')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Update weight' })).toBeVisible();
	});
});

test.describe('Log weight (modal-driven)', () => {
	// [WT-003] Create new weight entry
	// [WT-004] Edit existing weight entry for the date
	// [MOD-001] Edit modal pre-fill
	test.skip('[WT-003] [MOD-001] tap Update weight, set value, save, score updates', async () => {
		// TODO: trigger the WeightScore button, interact with NumberStepper
		// (use page.keyboard or +/- buttons), click Save, assert the new
		// weight appears on the dashboard.
	});

	test.skip('[WT-004] existing entry opens edit modal pre-filled', async () => {
		// TODO: seed weight entry, navigate to dashboard, tap to update,
		// assert modal opens with the seeded value pre-filled.
	});

	// [WT-009] UI permits value below backend lower bound
	test.skip('[WT-009] [ERR-002] [ERR-004] UI allows 25 kg input; backend rejects on submit', async () => {
		// TODO: open weight modal, set stepper to 25 (or send keyboard input),
		// click Save, assert validation warning toast appears with the
		// validator message; no weight entry persisted.
	});
});
