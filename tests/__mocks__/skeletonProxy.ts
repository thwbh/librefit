import { Mock, vi } from 'vitest';
import { writable } from 'svelte/store';

interface ModalStoreSettingsMock {
	meta: any;
	callback?: Mock;
	trigger?: Mock;
	close?: Mock;
	clear?: Mock;
}

const defaultModalStoreMock = {
	...writable([
		{
			response: vi.fn(),
			meta: {}
		}
	]),
	trigger: vi.fn(),
	close: vi.fn(),
	clear: vi.fn()
};

let modalStoreMock = { ...defaultModalStoreMock };

export const updateModalStoreMock = (settings: ModalStoreSettingsMock) => {
	modalStoreMock = {
		...writable([
			{
				response: settings.callback ? settings.callback : vi.fn(),
				meta: settings.meta ? settings.meta : {}
			}
		]),
		trigger: settings.trigger ? settings.trigger : vi.fn(),
		close: settings.close ? settings.close : vi.fn(),
		clear: settings.clear ? settings.clear : vi.fn()
	};
};

export const extractModalStoreMockTriggerCallback = () => {
	// Get the 'response' function from the last call to the 'trigger' mock.
	const mockTrigger = modalStoreMock.trigger;
	const lastCallArgs = mockTrigger.mock.calls[mockTrigger.mock.calls.length - 1];

	return lastCallArgs[0].response;
};

vi.mock('@skeletonlabs/skeleton', async (importOriginal) => {
	const actualSkeleton = await importOriginal();

	return {
		// @ts-ignore
		...actualSkeleton,
		getModalStore: vi.fn(() => modalStoreMock),
		initializeModalStore: vi.fn(() => modalStoreMock)
	};
});
