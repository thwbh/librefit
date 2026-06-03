/**
 * Helpers for presenting *completed* workouts in history / dashboard / progress.
 *
 * The backend `list_workouts` command takes an RFC3339 `[from, to)` window and
 * returns `WorkoutDetail`s; these helpers convert a local calendar day to that
 * window and derive the few card-facing numbers (start time, active minutes,
 * total volume, set count) from a session's persisted facts. Framework-free so
 * they unit-test directly and are reused by the card and the day page.
 */
import { addDays, format } from 'date-fns';
import { parseStringAsDate, display_time_format } from '$lib/date';
import { computeSetsCompleted, computeTotalVolume, summarize } from '$lib/workout/metrics';
import type { WorkoutDetail } from '$lib/api';

export interface DayBounds {
	/** Inclusive lower bound (RFC3339 UTC). */
	from: string;
	/** Exclusive upper bound (RFC3339 UTC). */
	to: string;
}

/**
 * RFC3339 `[from, to)` bounds covering the local calendar day `dateStr`
 * (`yyyy-MM-dd`). Converting through the local Date keeps a workout logged at
 * 23:00 local on the right day even though the store is UTC.
 */
export function dayBoundsUtc(dateStr: string): DayBounds {
	const start = parseStringAsDate(dateStr); // local midnight
	return { from: start.toISOString(), to: addDays(start, 1).toISOString() };
}

/** The card title: the session's name if set, otherwise a generic label. */
export function workoutTitle(detail: WorkoutDetail): string {
	return detail.session.name?.trim() || 'Workout';
}

/** Local start time of the session, `HH:mm`. */
export function workoutStartTime(detail: WorkoutDetail): string {
	return format(new Date(detail.session.startedAt), display_time_format);
}

/** Total volume (Σ reps × weight) across the session. */
export function workoutVolume(detail: WorkoutDetail): number {
	return computeTotalVolume(detail.exercises);
}

/** Logged set count across the session. */
export function workoutSets(detail: WorkoutDetail): number {
	return computeSetsCompleted(detail.exercises);
}

/**
 * Active work time in whole minutes. For a flat-logged retrospective workout
 * (`startedAt === endedAt`) this is 0, shown as `0m` by design.
 */
export function workoutActiveMinutes(detail: WorkoutDetail): number {
	return Math.floor(summarize(detail, Date.now()).activeWorkTimeMs / 60000);
}
