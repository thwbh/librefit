import { test, expect } from '../fixtures/app';

/**
 * App shell e2e tests.
 *
 * Spec: openspec/specs/app-shell/spec.md
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

test.describe('Bottom dock navigation', () => {
	test('[AS-001] [ANI-001] dock items navigate to Home, Progress, History', async ({
		page,
		seed
	}) => {
		await seed.defaultProfile(relativeRange(10, 60));

		await page.goto('/');

		await page.getByRole('link', { name: 'Progress' }).click();
		await expect(page).toHaveURL(/\/progress$/);

		await page.getByRole('link', { name: 'History' }).click();
		await expect(page).toHaveURL(/\/history$/);

		await page.getByRole('link', { name: 'Home' }).click();
		await expect(page).toHaveURL(/\/$/);
	});

	test('[AS-002] [ANI-002] tapping Settings opens the floating menu instead of navigating', async ({
		page,
		seed
	}) => {
		await seed.defaultProfile(relativeRange(10, 60));

		await page.goto('/');
		const startUrl = page.url();

		await page.getByRole('button', { name: 'Settings' }).click();

		// Menu items are now visible.
		await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Export' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Import' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Wizard' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'About' })).toBeVisible();

		// URL did not change.
		expect(page.url()).toBe(startUrl);
	});
});

test.describe('Settings menu', () => {
	test('[AS-003] settings menu item navigates and closes the menu', async ({ page, seed }) => {
		await seed.defaultProfile(relativeRange(10, 60));

		await page.goto('/');
		await page.getByRole('button', { name: 'Settings' }).click();
		await page.getByRole('link', { name: 'Profile' }).click();

		await expect(page).toHaveURL(/\/profile$/);
		// After navigation the menu has closed; the menu links are no longer visible.
		await expect(page.getByRole('link', { name: 'Export' })).toBeHidden();
	});

	test('[AS-004] tapping the backdrop closes the settings menu', async ({ page, seed }) => {
		await seed.defaultProfile(relativeRange(10, 60));

		await page.goto('/');
		await page.getByRole('button', { name: 'Settings' }).click();
		await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible();

		await page.getByRole('button', { name: 'Close menu' }).click();
		await expect(page.getByRole('link', { name: 'Profile' })).toBeHidden();
	});
});

test.describe('About page', () => {
	test('[AS-005] about page displays logo, features, privacy info, version', async ({
		page,
		seed
	}) => {
		await seed.defaultProfile(relativeRange(10, 60));

		await page.goto('/about');

		await expect(page.getByAltText('LibreFit')).toBeVisible();
		await expect(page.getByText('Your data stays on your device')).toBeVisible();
		await expect(page.getByText(/Version /)).toBeVisible();
	});
});

test.describe('Global error page', () => {
	// [AS-006] Unhandled error renders the error page
	test.skip('[AS-006] error page shows status + message + Back button', async () => {
		// TODO: trigger a navigation error (e.g. a route that throws, or
		// a deliberate 500 from a load function). Without a known-faulty
		// route this requires fault injection — defer until a hook exists.
	});
});

test.describe('Data freshness', () => {
	// [AS-007] Page navigation refreshes data
	// [AS-008] CRUD triggers view refresh
	// [AS-009] Pull-to-refresh on dashboard
	test.skip('[AS-007] [AS-008] [AS-009] data freshness across navigation and mutations', async () => {
		// TODO: requires cross-spec test: seed initial state, navigate to
		// dashboard, mutate via Tauri command, observe UI reflect change
		// without manual reload. For pull-to-refresh, simulating the touch
		// drag gesture needs the swipe helper.
	});
});
