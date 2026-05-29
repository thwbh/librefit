import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { longpress } from './long-press';

vi.mock('@tauri-apps/plugin-log', () => ({
	trace: vi.fn()
}));

function touch(type: string): TouchEvent {
	return new Event(type, { bubbles: true }) as TouchEvent;
}

describe('longpress action', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('[GES-001] holding for the 300ms threshold dispatches a longpress event', () => {
		const node = document.createElement('div');
		document.body.appendChild(node);
		const onlongpress = vi.fn();
		node.addEventListener('longpress', onlongpress);

		longpress(node);

		node.dispatchEvent(touch('touchstart'));
		vi.advanceTimersByTime(300);

		expect(onlongpress).toHaveBeenCalledTimes(1);
		node.remove();
	});

	it('[GES-002] releasing before the threshold does NOT dispatch longpress', () => {
		const node = document.createElement('div');
		document.body.appendChild(node);
		const onlongpress = vi.fn();
		node.addEventListener('longpress', onlongpress);

		longpress(node);

		node.dispatchEvent(touch('touchstart'));
		vi.advanceTimersByTime(200); // under the 300ms threshold
		node.dispatchEvent(touch('touchend'));
		vi.advanceTimersByTime(200); // even after more time, the timer was cleared

		expect(onlongpress).not.toHaveBeenCalled();
		node.remove();
	});

	it('[GES-002] a touchmove before the threshold cancels the long press (treated as a swipe)', () => {
		const node = document.createElement('div');
		document.body.appendChild(node);
		const onlongpress = vi.fn();
		node.addEventListener('longpress', onlongpress);

		longpress(node);

		node.dispatchEvent(touch('touchstart'));
		window.dispatchEvent(touch('touchmove'));
		vi.advanceTimersByTime(300);

		expect(onlongpress).not.toHaveBeenCalled();
		node.remove();
	});

	it('destroy() removes the touch listeners', () => {
		const node = document.createElement('div');
		document.body.appendChild(node);
		const onlongpress = vi.fn();
		node.addEventListener('longpress', onlongpress);

		const action = longpress(node);
		action?.destroy?.();

		node.dispatchEvent(touch('touchstart'));
		vi.advanceTimersByTime(300);

		expect(onlongpress).not.toHaveBeenCalled();
		node.remove();
	});
});
