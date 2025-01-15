import { expect, describe, it, vi } from 'vitest';
import { observeToggle } from '../../src/lib/theme-toggle';

describe('themeToggle', () => {
	/**
	 * @vitest-environment jsdom
	 */
	it('attributes mutation should trigger callback', async () => {
		// Mocking element and MutationObserver
		const mockElement = document.createElement('div');
		const mockCallback = vi.fn();
		const mockObserverMethods = {
			disconnect: vi.fn(),
			observe: vi.fn(),
			takeRecords: vi.fn(),
			unobserve: vi.fn()
		};

		const MutationObserverMock = vi.fn(function () {
			return mockObserverMethods;
		});

		vi.stubGlobal('MutationObserver', MutationObserverMock);

		// Calling function with mock element and mock callback
		observeToggle(mockElement, mockCallback);

		// Assert that observe was called on MutationObserver
		expect(mockObserverMethods.observe).toBeCalled();

		// Trigger callback manually
		const mutation = [{ type: 'attributes', attributeName: 'class', target: mockElement }];

		(MutationObserverMock.mock.calls[0] as any[])[0]?.(mutation);

		// Asserting that callback was called
		expect(mockCallback).toBeCalledWith(mockElement);
	});
});
