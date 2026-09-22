/**
 * Common mocks for testing
 *
 * Import this file (side-effect import) in tests that need these mocks.
 *
 * Vitest 5 requires `vi.mock()` calls to live at a module's top level — the
 * call below is hoisted above this module's imports, so importing this file
 * registers the mock before anything the importing test file loads. Keep the
 * side-effect import first, before any import that (transitively) pulls in
 * the mocked module.
 */
import { vi } from 'vitest';

/**
 * Mock for @thwbh/veilchen component library
 * Uses importOriginal to preserve all exports while allowing for overrides
 */
vi.mock('@thwbh/veilchen', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@thwbh/veilchen')>();
	return {
		...actual
		// Add any overrides here if needed for specific tests
	};
});
