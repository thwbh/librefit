import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import DashboardWorkoutSurface from './DashboardWorkoutSurface.svelte';
import type { WorkoutDetail } from '$lib/api';

// The dashboard idle workout surface: cards (DH-013), refresh-on-update (DH-015),
// loading (DH-017), and error+retry (DH-018). Presentational, so we drive it by props.
function workout(id: number, name: string): WorkoutDetail {
	return {
		session: {
			id,
			workoutType: 'wl',
			name,
			startedAt: '2026-06-04T10:00:00.000Z',
			endedAt: '2026-06-04T10:30:00.000Z'
		},
		exercises: [
			{
				id,
				exerciseId: 1,
				name: 'Bench Press',
				defaultRestSeconds: 90,
				sets: [{ id, loggedAt: '2026-06-04T10:05:00.000Z', metrics: { reps: 10, weightKg: 80 } }]
			}
		],
		pauses: []
	} as WorkoutDetail;
}

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		workouts: [] as WorkoutDetail[],
		loading: false,
		error: null as string | null,
		ontap: vi.fn(),
		onretry: vi.fn(),
		...overrides
	};
}

describe('DashboardWorkoutSurface', () => {
	it('[DH-017] shows a loading spinner while fetching with no data yet', () => {
		render(DashboardWorkoutSurface, { props: baseProps({ loading: true, workouts: [] }) });
		expect(screen.getByLabelText('Loading workouts')).toBeInTheDocument();
	});

	it('[DH-013] renders a card per workout and tapping fires ontap', async () => {
		const ontap = vi.fn();
		render(DashboardWorkoutSurface, {
			props: baseProps({ workouts: [workout(1, 'Push Day')], ontap })
		});
		await fireEvent.click(screen.getByText('Push Day'));
		expect(ontap).toHaveBeenCalledOnce();
	});

	it('[DH-015] a newly completed workout appears when the list updates', async () => {
		const { rerender } = render(DashboardWorkoutSurface, { props: baseProps({ workouts: [] }) });
		expect(screen.queryByText('Push Day')).toBeNull();
		await rerender(baseProps({ workouts: [workout(1, 'Push Day')] }));
		expect(screen.getByText('Push Day')).toBeInTheDocument();
	});

	it('[DH-018] error shows a retry that calls onretry, keeping already-loaded cards', async () => {
		const onretry = vi.fn();
		render(DashboardWorkoutSurface, {
			props: baseProps({ error: 'boom', workouts: [workout(1, 'Push Day')], onretry })
		});
		expect(screen.getByText('Push Day')).toBeInTheDocument(); // existing data remains
		await fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
		expect(onretry).toHaveBeenCalledOnce();
	});
});
