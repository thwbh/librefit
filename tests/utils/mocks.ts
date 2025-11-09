/**
 * Common mocks for testing
 *
 * Import this file in tests that need these mocks
 */
import { vi } from 'vitest';

/**
 * Mock for @thwbh/veilchen component library
 * Uses importOriginal to preserve all exports while allowing for overrides
 */
export function setupVeilchenMock() {
	vi.mock('@thwbh/veilchen', async (importOriginal) => {
		const actual = await importOriginal<typeof import('@thwbh/veilchen')>();
		return {
			...actual
			// Add any overrides here if needed for specific tests
		};
	});
}
