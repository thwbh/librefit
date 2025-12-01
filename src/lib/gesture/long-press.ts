import { trace } from '@tauri-apps/plugin-log';
import type { Action } from 'svelte/action';

export const longpress: Action<
	HTMLElement,
	undefined,
	{ onlongpress: (e: CustomEvent) => void }
> = (node: HTMLElement) => {
	const TIME_MS = 300;
	let timeoutPtr: number;

	const handleTouchStart = (e: TouchEvent) => {
		// Don't prevent default or stop propagation - let parent components handle swipes
		window.addEventListener('touchmove', handleMoveBeforeLong);
		timeoutPtr = window.setTimeout(() => {
			trace('looooong press!');

			window.removeEventListener('touchmove', handleMoveBeforeLong);
			node.dispatchEvent(new CustomEvent('longpress'));

			// TODO - ideally make this not trigger long press again
			// window.setTimeout(() => node.dispatchEvent(e), 0);
		}, TIME_MS);
	};

	const handleMoveBeforeLong = (e: TouchEvent) => {
		// Cancel long press if user moves their finger (likely a swipe gesture)
		window.clearTimeout(timeoutPtr);
		window.removeEventListener('touchmove', handleMoveBeforeLong);
	};

	const handleTouchEnd = (e: TouchEvent) => {
		// Don't prevent default or stop propagation - let parent components handle swipes
		window.clearTimeout(timeoutPtr);
		window.removeEventListener('touchmove', handleMoveBeforeLong);
	};

	node.addEventListener('touchstart', handleTouchStart);
	node.addEventListener('touchend', handleTouchEnd);
	node.addEventListener('touchcancel', handleTouchEnd);

	return {
		destroy: () => {
			node.removeEventListener('touchstart', handleTouchStart);
			node.removeEventListener('touchend', handleTouchEnd);
			node.removeEventListener('touchcancel', handleTouchEnd);
		}
	};
};
