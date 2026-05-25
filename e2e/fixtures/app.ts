import { test as base } from '@playwright/test';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetDatabase } from './db';
import { makeSeedHelpers, type SeedHelpers } from './seed';

/**
 * Fixtures for e2e tests.
 *
 * Each test:
 *   1. Resets the SQLite database to a clean state (file deletion).
 *   2. Spawns tauri-driver on its default WebDriver port (4444).
 *   3. The Tauri debug binary is launched by tauri-driver and exposes the
 *      `e2e-seed` Tauri commands (binary must be built with that feature).
 *   4. Tests receive a `seed` fixture for composable state setup.
 *
 * Build the binary before running:
 *   cargo tauri build --debug --features e2e-seed
 *
 * See e2e/README.md.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const TAURI_BINARY = path.resolve(REPO_ROOT, 'src-tauri/target/debug/librefit');

interface Fixtures {
	tauriDriver: ChildProcess;
	seed: SeedHelpers;
}

export const test = base.extend<Fixtures>({
	tauriDriver: [
		// eslint-disable-next-line no-empty-pattern
		async ({}, use) => {
			await resetDatabase();

			const driver = spawn('tauri-driver', [], {
				stdio: 'pipe',
				env: { ...process.env, TAURI_AUTOMATION: '1' }
			});

			await wait(500);

			try {
				await use(driver);
			} finally {
				driver.kill('SIGTERM');
			}
		},
		{ auto: true }
	],
	seed: async ({ page }, use) => {
		await use(makeSeedHelpers(page));
	}
});

export { expect } from '@playwright/test';
