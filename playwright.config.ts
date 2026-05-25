import { defineConfig } from '@playwright/test';

/**
 * Playwright config for LibreFit e2e tests.
 *
 * Tests drive the Tauri desktop binary through tauri-driver (a WebDriver
 * shim). The Tauri app is spawned per test via fixtures in e2e/fixtures/app.ts;
 * Playwright does not launch a browser itself.
 *
 * Requires `tauri-driver` to be installed on the host:
 *   cargo install tauri-driver
 */
export default defineConfig({
	testDir: './e2e/specs',
	testMatch: '**/*.spec.ts',

	fullyParallel: false, // tauri-driver does not support parallel sessions
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1, // single-worker because tauri-driver binds a fixed port

	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

	use: {
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},

	timeout: 30_000,
	expect: {
		timeout: 5_000
	}
});
