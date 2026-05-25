import { test } from '../fixtures/app';

/**
 * Data export e2e tests.
 *
 * Spec: openspec/specs/data-export/spec.md
 *
 * Note: export triggers Tauri's native save-file dialog. Playwright cannot
 * directly drive native dialogs through tauri-driver; these tests will likely
 * need to either (a) bypass the dialog via a test-only Tauri command that
 * writes to a fixed temp path, or (b) configure the Tauri plugin-dialog mock
 * mode. See data-import.spec.ts for the equivalent open-file-dialog problem.
 */

// [EX-001] [STG-001] [STG-002] CSV export happy path
// [EX-004] Export completion
// [EX-007] Close enabled after completion
test.skip('[EX-001] [STG-001] [STG-002] CSV export completes successfully', async () => {
	// TODO: requires test-mode override of the save-file dialog (or mock).
});

// [EX-002] [EX-005] Raw SQLite export contains all tables
test.skip('[EX-002] [EX-005] raw SQLite export contains seven application tables', async () => {
	// TODO: same dialog-mocking caveat; verify resulting file is a valid
	// SQLite database with the expected tables.
});

// [EX-003] [EX-006] [STG-003] Export cancellation
test.skip('[EX-003] [EX-006] [STG-003] cancel an active export', async () => {
	// TODO: start export, click Cancel before completion, assert cancelled
	// state in the progress modal.
});
