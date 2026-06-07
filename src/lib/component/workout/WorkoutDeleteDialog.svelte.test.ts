import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import WorkoutDeleteDialog from './WorkoutDeleteDialog.svelte';
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

describe('WorkoutDeleteDialog', () => {
	it('[HI-021] shows a read-only preview of the workout to be deleted', () => {
		render(WorkoutDeleteDialog, {
			props: { detail: detail(), onconfirm: vi.fn(), oncancel: vi.fn() }
		});
		expect(screen.getByText('Delete workout?')).toBeInTheDocument();
		expect(screen.getByText(/Push Day/)).toBeInTheDocument();
		expect(screen.getByText(/800 kg · 1 set/)).toBeInTheDocument();
	});

	it('[HI-021] confirm fires onconfirm', async () => {
		const onconfirm = vi.fn();
		render(WorkoutDeleteDialog, { props: { detail: detail(), onconfirm, oncancel: vi.fn() } });
		await fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
		expect(onconfirm).toHaveBeenCalledOnce();
	});

	it('[HI-021] cancel fires oncancel', async () => {
		const oncancel = vi.fn();
		render(WorkoutDeleteDialog, { props: { detail: detail(), onconfirm: vi.fn(), oncancel } });
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(oncancel).toHaveBeenCalledOnce();
	});
});
