import { describe, it, expect } from 'vitest';
import {
	dayBoundsUtc,
	workoutActiveMinutes,
	workoutSets,
	workoutTitle,
	workoutVolume
} from '$lib/workout/history';
import type { WorkoutDetail } from '$lib/api';

function detail(overrides: Partial<WorkoutDetail['session']> = {}, exercises = []): WorkoutDetail {
	return {
		session: {
			id: 1,
			workoutType: 'wl',
			name: null,
			startedAt: '2026-05-01T10:00:00.000Z',
			endedAt: '2026-05-01T10:40:00.000Z',
			...overrides
		},
		exercises,
		pauses: []
	} as WorkoutDetail;
}

describe('dayBoundsUtc', () => {
	it('[HI-016] produces a one-day [from, to) window around the local day', () => {
		const { from, to } = dayBoundsUtc('2026-05-01');
		// 24h span, to is exclusive next-day boundary.
		expect(new Date(to).getTime() - new Date(from).getTime()).toBe(24 * 60 * 60 * 1000);
		// The local midnight of 2026-05-01 falls within [from, to).
		const localMidnight = new Date(2026, 4, 1).toISOString();
		expect(from).toBe(localMidnight);
	});
});

describe('workout card derivations', () => {
	it('[HI-017] derives start-time-independent metrics from session facts', () => {
		const d = detail({ name: 'Push Day' }, [
			{
				id: 1,
				exerciseId: 1,
				name: 'Bench Press',
				defaultRestSeconds: 90,
				sets: [
					{ id: 1, loggedAt: '2026-05-01T10:05:00.000Z', metrics: { reps: 10, weightKg: 80 } },
					{ id: 2, loggedAt: '2026-05-01T10:10:00.000Z', metrics: { reps: 8, weightKg: 85 } }
				]
			}
		] as never);
		expect(workoutTitle(d)).toBe('Push Day');
		expect(workoutVolume(d)).toBe(10 * 80 + 8 * 85);
		expect(workoutSets(d)).toBe(2);
		// 10:00 → 10:40, no pauses → 40 active minutes.
		expect(workoutActiveMinutes(d)).toBe(40);
	});

	it('[HI-017] flat-logged retrospective workout reads 0 active minutes', () => {
		// startedAt === endedAt (created via create_workout_for_date).
		const d = detail({ endedAt: '2026-05-01T10:00:00.000Z' });
		expect(workoutActiveMinutes(d)).toBe(0);
		expect(workoutTitle(d)).toBe('Workout');
	});
});
