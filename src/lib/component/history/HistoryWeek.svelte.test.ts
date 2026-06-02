import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import HistoryWeek from './HistoryWeek.svelte';

function makeWeek(): string[] {
	return [
		'2026-05-18',
		'2026-05-19',
		'2026-05-20',
		'2026-05-21',
		'2026-05-22',
		'2026-05-23',
		'2026-05-24'
	];
}

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		dates: makeWeek(),
		selectedDateStr: '2026-05-21',
		showRightCaret: true,
		caloriesAverage: 1850,
		onselect: vi.fn(),
		onweekchange: vi.fn(),
		...overrides
	};
}

describe('HistoryWeek', () => {
	it('[HI-001] current week renders one pill per date', () => {
		const { container } = render(HistoryWeek, { props: baseProps() });

		const dayPills = container.querySelectorAll('.rounded-field');
		expect(dayPills.length).toBe(7);
	});

	it('[HI-001] selected date pill carries the active class', () => {
		const { container } = render(HistoryWeek, {
			props: baseProps({ selectedDateStr: '2026-05-20' })
		});

		// Active styling applies background. The active pill is the one whose
		// text content includes day-number "20".
		const pills = container.querySelectorAll('.rounded-field');
		const active = Array.from(pills).find((p) => p.textContent?.includes('20'));
		expect(active?.className).toContain('bg-primary-content');
	});

	it('[HI-002] previous-week caret click fires onweekchange("previous")', async () => {
		const user = userEvent.setup();
		const onweekchange = vi.fn();
		render(HistoryWeek, { props: baseProps({ onweekchange }) });

		await user.click(screen.getByRole('button', { name: /Previous week/i }));

		expect(onweekchange).toHaveBeenCalledWith('previous');
	});

	it('[HI-002] next-week caret click fires onweekchange("next") when available', async () => {
		const user = userEvent.setup();
		const onweekchange = vi.fn();
		render(HistoryWeek, { props: baseProps({ onweekchange, showRightCaret: true }) });

		await user.click(screen.getByRole('button', { name: /Next week/i }));

		expect(onweekchange).toHaveBeenCalledWith('next');
	});

	it('[HI-003] no future data: right caret affordance is not rendered when showRightCaret=false', () => {
		render(HistoryWeek, { props: baseProps({ showRightCaret: false }) });

		expect(screen.queryByRole('button', { name: /Next week/i })).toBeNull();
		// Previous-week caret stays visible regardless.
		expect(screen.queryByRole('button', { name: /Previous week/i })).not.toBeNull();
	});

	it('[HI-004] header surfaces the month label derived from the selected date', () => {
		const { container } = render(HistoryWeek, {
			props: baseProps({ selectedDateStr: '2026-05-21' })
		});
		// May 2026 — the format string is "MMMM yyyy".
		expect(container.textContent).toContain('May 2026');
	});

	it('[HI-004] header surfaces the average kcal label', () => {
		const { container } = render(HistoryWeek, { props: baseProps() });
		// NumberFlow renders the value through a custom element jsdom can't
		// execute; the surrounding "avg kcal/day" label is the structural
		// signal that the average block rendered.
		expect(container.textContent).toContain('avg kcal/day');
	});

	it('[GES-006] swiping the date selector fires onweekchange (left→next, right→previous)', () => {
		// The actual touch→swipe detection is svelte-gestures' job; we verify our
		// handler's direction→action mapping by dispatching the `swipe` event the
		// action emits. (jsdom can't synthesize the underlying touch sequence.)
		const onweekchange = vi.fn();
		const { container } = render(HistoryWeek, {
			props: baseProps({ onweekchange, showRightCaret: true })
		});
		const selector = container.querySelector('.grid') as HTMLElement;

		selector.dispatchEvent(
			new CustomEvent('swipe', { detail: { direction: 'right' }, bubbles: true })
		);
		expect(onweekchange).toHaveBeenLastCalledWith('previous');

		selector.dispatchEvent(
			new CustomEvent('swipe', { detail: { direction: 'left' }, bubbles: true })
		);
		expect(onweekchange).toHaveBeenLastCalledWith('next');
	});

	it('[GES-006] swiping left at the latest week (no future data) does not change week', () => {
		const onweekchange = vi.fn();
		const { container } = render(HistoryWeek, {
			props: baseProps({ onweekchange, showRightCaret: false })
		});
		const selector = container.querySelector('.grid') as HTMLElement;

		selector.dispatchEvent(
			new CustomEvent('swipe', { detail: { direction: 'left' }, bubbles: true })
		);
		expect(onweekchange).not.toHaveBeenCalled();
	});

	it('[HI-005] clicking a day pill fires onselect with the date string (content area updates for that date)', async () => {
		const user = userEvent.setup();
		const onselect = vi.fn();
		const { container } = render(HistoryWeek, { props: baseProps({ onselect }) });

		const pills = container.querySelectorAll('.rounded-field');
		// The 3rd pill (index 2) corresponds to dates[2] === '2026-05-20'.
		await user.click(pills[2] as HTMLElement);

		expect(onselect).toHaveBeenCalledWith('2026-05-20');
	});
});
