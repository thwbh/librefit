import { test, expect } from '../fixtures/app';

/**
 * Smoke test — verifies the e2e harness can launch the Tauri app and reach
 * the welcome screen. Does not cite a specific scenario ID; this is harness
 * verification, not behavior coverage.
 */

test.skip('app launches and renders welcome screen', async ({ page }) => {
	await expect(page).toHaveTitle(/librefit/i);
});
