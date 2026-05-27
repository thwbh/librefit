import { expect, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import * as matchers from '@testing-library/jest-dom/matchers';
import { setupDialogPolyfill } from './utils/dialog-polyfill';

expect.extend(matchers);

afterEach(() => cleanup());

// Setup polyfills for jsdom
beforeAll(() => {
	setupDialogPolyfill();

	// jsdom does not implement Element.animate (Web Animations API). Stub it so that Svelte's
	// `fly` / `fade` / `slide` transitions don't throw when components mount in tests.
	// jsdom does not implement ResizeObserver; several @thwbh/veilchen components use it.
	if (typeof globalThis.ResizeObserver === 'undefined') {
		(globalThis as { ResizeObserver: unknown }).ResizeObserver = class {
			observe() {}
			unobserve() {}
			disconnect() {}
		};
	}

	// jsdom queues a real navigation when an <a href> is clicked, then logs
	// "Error: Not implemented: navigation (except hash changes)" asynchronously
	// (the test has already passed by then, but the noise pollutes test output).
	// Suppress at the source by canceling link clicks at the capture phase —
	// component tests assert the click handler ran via spies / state, not via
	// real navigation.
	if (typeof document !== 'undefined') {
		document.addEventListener(
			'click',
			(event) => {
				const target = event.target as HTMLElement | null;
				const anchor = target?.closest?.('a[href]');
				if (anchor) event.preventDefault();
			},
			true
		);
	}

	if (typeof Element !== 'undefined' && !Element.prototype.animate) {
		Element.prototype.animate = function () {
			return {
				cancel: () => {},
				finish: () => {},
				play: () => {},
				pause: () => {},
				reverse: () => {},
				addEventListener: () => {},
				removeEventListener: () => {},
				finished: Promise.resolve(),
				onfinish: null,
				oncancel: null,
				currentTime: 0,
				playbackRate: 1,
				playState: 'finished',
				effect: null,
				timeline: null,
				id: '',
				replaceState: 'active',
				pending: false,
				ready: Promise.resolve(),
				updatePlaybackRate: () => {},
				commitStyles: () => {},
				persist: () => {}
			} as unknown as Animation;
		};
	}
});
