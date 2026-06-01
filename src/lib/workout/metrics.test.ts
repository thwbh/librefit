import { describe, it, expect } from 'vitest';
import {
	computeActiveWorkTime,
	computeRestRemaining,
	computeSetsCompleted,
	computeTotalVolume,
	DEFAULT_REST_SECONDS,
	isPaused,
	isResting,
	prefillFromPrevious,
	summarize,
	validateLiftingSet
} from './metrics';
import type { LoggedSet, WorkoutDetail, WorkoutExerciseView, WorkoutPauseView } from '$lib/api';

const at = (iso: string) => Date.parse(iso);

function set(id: number, reps: number, weightKg: number, loggedAt: string): LoggedSet {
	return { id, loggedAt, metrics: { reps, weightKg } };
}

function exercise(id: number, sets: LoggedSet[], defaultRestSeconds?: number): WorkoutExerciseView {
	return { id, exerciseId: id, name: `ex-${id}`, defaultRestSeconds, sets };
}

function detail(
	startedAt: string,
	exercises: WorkoutExerciseView[],
	pauses: WorkoutPauseView[] = [],
	endedAt?: string
): WorkoutDetail {
	return {
		session: { id: 1, workoutType: 'wl', name: undefined, startedAt, endedAt },
		exercises,
		pauses
	};
}

describe('workout derived metrics', () => {
	it('[WO-005] active work time excludes paused intervals', () => {
		// started 10:00, paused 10:05–10:08 (3 min), now 10:10 → 10 min − 3 min.
		const started = '2026-06-01T10:00:00.000Z';
		const pauses: WorkoutPauseView[] = [
			{ pausedAt: '2026-06-01T10:05:00.000Z', resumedAt: '2026-06-01T10:08:00.000Z' }
		];
		const active = computeActiveWorkTime(started, pauses, at('2026-06-01T10:10:00.000Z'));
		expect(active).toBe(7 * 60 * 1000);
	});

	it('[WO-008] [WO-009] active work time is recomputed from timestamps, not carried over', () => {
		// Same persisted facts, evaluated at two different "now"s (as after a long
		// background or an app restart): the value tracks now − started − paused,
		// never a frozen prior reading.
		const started = '2026-06-01T10:00:00.000Z';
		const pauses: WorkoutPauseView[] = [
			{ pausedAt: '2026-06-01T10:05:00.000Z', resumedAt: '2026-06-01T10:08:00.000Z' }
		];
		const beforeBg = computeActiveWorkTime(started, pauses, at('2026-06-01T10:10:00.000Z'));
		const afterBg = computeActiveWorkTime(started, pauses, at('2026-06-01T10:40:00.000Z'));
		expect(beforeBg).toBe(7 * 60 * 1000);
		expect(afterBg).toBe(37 * 60 * 1000); // 40 min elapsed − 3 min paused
	});

	it('[WO-010] an open pause freezes active work time', () => {
		// An open pause (no resumedAt) is measured up to now, so active time holds
		// steady while paused. isPaused reflects the open interval.
		const started = '2026-06-01T10:00:00.000Z';
		const pauses: WorkoutPauseView[] = [
			{ pausedAt: '2026-06-01T10:05:00.000Z', resumedAt: undefined }
		];
		const a = computeActiveWorkTime(started, pauses, at('2026-06-01T10:10:00.000Z'));
		const b = computeActiveWorkTime(started, pauses, at('2026-06-01T10:12:00.000Z'));
		expect(a).toBe(5 * 60 * 1000);
		expect(b).toBe(a);
		expect(isPaused(pauses)).toBe(true);
	});

	it('[WO-006] total volume sums reps × weight over all sets', () => {
		const exercises = [
			exercise(1, [
				set(1, 10, 80, '2026-06-01T10:01:00.000Z'),
				set(2, 8, 80, '2026-06-01T10:03:00.000Z')
			]),
			exercise(2, [set(3, 5, 100, '2026-06-01T10:06:00.000Z')])
		];
		expect(computeTotalVolume(exercises)).toBe(10 * 80 + 8 * 80 + 5 * 100);
	});

	it('[WO-007] sets completed counts logged sets across the workout', () => {
		const exercises = [
			exercise(1, [
				set(1, 10, 80, '2026-06-01T10:01:00.000Z'),
				set(2, 8, 80, '2026-06-01T10:03:00.000Z')
			]),
			exercise(2, [set(3, 5, 100, '2026-06-01T10:06:00.000Z')])
		];
		expect(computeSetsCompleted(exercises)).toBe(3);
	});

	it('[WO-014] editing a set recomputes total volume', () => {
		const before = [exercise(1, [set(1, 10, 80, '2026-06-01T10:01:00.000Z')])];
		expect(computeTotalVolume(before)).toBe(800);
		// Edit the set's reps 10 → 12.
		const after = [exercise(1, [set(1, 12, 80, '2026-06-01T10:01:00.000Z')])];
		expect(computeTotalVolume(after)).toBe(960);
	});

	it('[WO-015] deleting a set recomputes total volume without it', () => {
		const before = [
			exercise(1, [
				set(1, 10, 80, '2026-06-01T10:01:00.000Z'),
				set(2, 8, 80, '2026-06-01T10:03:00.000Z')
			])
		];
		expect(computeTotalVolume(before)).toBe(1440);
		const after = [exercise(1, [set(1, 10, 80, '2026-06-01T10:01:00.000Z')])];
		expect(computeTotalVolume(after)).toBe(800);
	});

	it('[WO-017] rest countdown starts from the set against the exercise target', () => {
		const now = at('2026-06-01T10:00:30.000Z');
		const remaining = computeRestRemaining('2026-06-01T10:00:00.000Z', 90, now);
		expect(remaining).toBe(60 * 1000); // 90s target − 30s elapsed
		expect(isResting('2026-06-01T10:00:00.000Z', 90, now)).toBe(true);
	});

	it('[WO-017] rest target falls back to the global default', () => {
		const now = at('2026-06-01T10:00:00.000Z');
		const loggedAt = '2026-06-01T10:00:00.000Z';
		expect(computeRestRemaining(loggedAt, null, now)).toBe(DEFAULT_REST_SECONDS * 1000);
		expect(computeRestRemaining(loggedAt, undefined, now)).toBe(DEFAULT_REST_SECONDS * 1000);
	});

	it('[WO-018] rest ends once the countdown elapses', () => {
		const now = at('2026-06-01T10:02:00.000Z'); // 120s after the set
		expect(computeRestRemaining('2026-06-01T10:00:00.000Z', 90, now)).toBe(0);
		expect(isResting('2026-06-01T10:00:00.000Z', 90, now)).toBe(false);
	});

	it('[WO-021] a new set prefills from the previous set, else empty', () => {
		const withSets = exercise(1, [
			set(1, 10, 80, '2026-06-01T10:01:00.000Z'),
			set(2, 8, 82.5, '2026-06-01T10:03:00.000Z')
		]);
		expect(prefillFromPrevious(withSets)).toEqual({ reps: 8, weightKg: 82.5 });
		expect(prefillFromPrevious(exercise(2, []))).toBeNull();
	});

	it('[WO-022] summarize reports volume, active time, and sets for the session', () => {
		const d = detail(
			'2026-06-01T10:00:00.000Z',
			[
				exercise(1, [
					set(1, 10, 80, '2026-06-01T10:01:00.000Z'),
					set(2, 8, 80, '2026-06-01T10:03:00.000Z')
				])
			],
			[{ pausedAt: '2026-06-01T10:05:00.000Z', resumedAt: '2026-06-01T10:07:00.000Z' }],
			'2026-06-01T10:10:00.000Z'
		);
		const s = summarize(d, at('2026-06-01T11:00:00.000Z'));
		expect(s.totalVolume).toBe(1440);
		expect(s.setsCompleted).toBe(2);
		// Anchored to endedAt, not the later "now": 10 min − 2 min paused.
		expect(s.activeWorkTimeMs).toBe(8 * 60 * 1000);
	});

	it('[WO-019] client validation rejects out-of-range metrics, accepts valid', () => {
		expect(validateLiftingSet({ reps: 10, weightKg: 80 })).toBeNull();
		expect(validateLiftingSet({ reps: 0, weightKg: 80 })).toMatch(/Reps/);
		expect(validateLiftingSet({ reps: 1.5, weightKg: 80 })).toMatch(/Reps/);
		expect(validateLiftingSet({ reps: 10, weightKg: -1 })).toMatch(/Weight/);
		expect(validateLiftingSet({ reps: 10, weightKg: 1001 })).toMatch(/Weight/);
	});
});
