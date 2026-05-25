import { test, expect } from '../fixtures/app';
import { WelcomePage } from '../pages/welcome';

/**
 * Onboarding e2e tests.
 *
 * Spec:        openspec/specs/onboarding/spec.md
 * Conventions: _conv-animations (welcome entrance), _conv-modals (n/a for wizard)
 */

test.describe('Welcome screen', () => {
	test('[OB-001] [ANI-001] welcome screen renders for first launch with no profile', async ({
		page
	}) => {
		const welcome = new WelcomePage(page);

		await expect(page).toHaveTitle(/welcome to librefit/i);

		// Required elements per spec
		await expect(welcome.logo).toBeVisible();
		await expect(welcome.tagline).toBeVisible();
		await expect(welcome.privacyBadge).toBeVisible();
		await expect(welcome.versionLine).toBeVisible();
		await expect(welcome.getStartedButton).toBeEnabled();

		for (const card of welcome.featureCards) {
			await expect(card).toBeVisible();
		}
	});

	test('[OB-002] Get Started navigates to /setup', async ({ page }) => {
		const welcome = new WelcomePage(page);

		await welcome.clickGetStarted();

		await expect(page).toHaveURL(/\/setup$/);
		// Setup page renders its own sr-only heading.
		await expect(page.getByRole('heading', { name: 'Setup Wizard' })).toBeAttached();
		await expect(page.getByText('Step 1 of 5')).toBeVisible();
		await expect(page.getByText('Body Parameters')).toBeVisible();
	});
});

test.describe('Route guard', () => {
	// [OB-003] Direct access to protected route redirects to welcome
	test('[OB-003] direct access to / redirects to /welcome', async ({ page }) => {
		// With no profile in the freshly-reset DB, the layout guard should
		// redirect any (app) route to /welcome.
		await page.goto('/');
		await expect(page).toHaveURL(/\/welcome$/);
	});

	// [OB-004] /welcome and /setup remain accessible without a profile
	test('[OB-004] /setup is accessible without a profile', async ({ page }) => {
		await page.goto('/setup');
		await expect(page).toHaveURL(/\/setup$/);
		await expect(page.getByText('Body Parameters')).toBeVisible();
	});
});

test.describe('Setup wizard happy path', () => {
	// [OB-005] Valid body information advances wizard
	// [OB-006] Sex must be explicitly selected
	// [OB-007] Avatar defaults to name seed
	// [OB-008] Activity level selection advances to results
	// [OB-009] [OB-010] [OB-011] Recommendation by BMI category
	// [OB-013] Rate selection for weight loss
	// [OB-015] Successful setup completion
	// [OB-017] Atomic target creation
	test.skip('completes 5-step wizard end-to-end and lands on dashboard', async () => {
		// TODO: requires Body.svelte / ActivityLevel.svelte / Rate.svelte / Finish.svelte
		// inspection to derive accurate selectors. Implement as: navigate to /setup,
		// fill body (nickname, sex, age/height/weight sliders), choose activity,
		// observe results, pick a rate, finish; assert URL is "/" and welcome
		// animation appears briefly.
	});

	// [OB-012] Low-normal BMI alert
	test.skip('low-normal BMI shows special GAIN alert on Step 3', async () => {
		// TODO: seed body data with weight/height yielding BMI 18.5–19.9;
		// advance to Step 3; assert the special alert is visible.
	});

	// [OB-014] Step 4 title changes for HOLD users
	test.skip('Step 4 title is "Select Your Target Weight" when recommendation is HOLD', async () => {
		// TODO: seed body data yielding a HOLD recommendation (BMI 20–25);
		// advance to Step 4; assert title is "Select Your Target Weight".
	});

	// [OB-016] Setup failure with rollback
	test.skip('setup failure shows retry without partial persistence', async () => {
		// TODO: simulate a failure mid-save (e.g. via a Tauri-side fault
		// injection point, or by submitting an invalid target combination)
		// and assert: error state visible, retry button visible, no LibreUser
		// persisted (verify by relaunching app and checking /welcome is shown).
	});
});
