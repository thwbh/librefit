import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import WorkoutSummaryCard from './WorkoutSummaryCard.svelte';
import type { WorkoutDetail } from '$lib/api';

function detail(): WorkoutDetail {
	return {
		session: {
			id: 1,
			workoutType: 'wl',
			name: 'Push Day',
			startedAt: '2026-06-04T10:00:00.000Z',
			endedAt: '2026-06-04T10:30:00.000Z'
		},
		exercises: [
			{
				id: 1,
				exerciseId: 1,
				name: 'Bench Press',
				defaultRestSeconds: 90,
				sets: [{ id: 1, loggedAt: '2026-06-04T10:05:00.000Z', metrics: { reps: 10, weightKg: 80 } }]
			}
		],
		pauses: []
	} as WorkoutDetail;
}

describe('WorkoutSummaryCard', () => {
	it('[HI-019] [DH-013] tapping the card fires ontap', async () => {
		const ontap = vi.fn();
		render(WorkoutSummaryCard, { props: { detail: detail(), ontap } });
		await fireEvent.click(screen.getByText('Push Day'));
		expect(ontap).toHaveBeenCalledOnce();
	});

	it('[HI-020] long-press fires onedit (the swipe-left/long-press edit gesture)', () => {
		const onedit = vi.fn();
		const ondelete = vi.fn();
		const { container } = render(WorkoutSummaryCard, {
			props: { detail: detail(), onedit, ondelete }
		});
		// The longpress action dispatches a 'longpress' event on the card button.
		container.querySelector('button')!.dispatchEvent(new CustomEvent('longpress'));
		expect(onedit).toHaveBeenCalledOnce();
	});
});
