/**
 * Pure derived-metric helpers for workout sessions.
 *
 * Every metric is derived from persisted facts (`startedAt`, pause intervals,
 * the set list) — never an incrementing counter — so they stay correct across
 * resume, edit, and delete. Kept framework-free so they can be unit-tested
 * directly and reused by the rune store. Types come from the generated
 * `$lib/api` bindings (the backend stays authoritative).
 */
import type {
	LiftingSetMetrics,
	WorkoutDetail,
	WorkoutExerciseView,
	WorkoutPauseView
} from '$lib/api';

const parse = (iso: string): number => Date.parse(iso);

/**
 * Active work time in milliseconds: (now − startedAt) − Σ(paused intervals).
 * An open pause (no `resumedAt`) is measured up to `now`, which freezes the
 * display while paused.
 */
export function computeActiveWorkTime(
	startedAt: string,
	pauses: WorkoutPauseView[],
	nowMs: number
): number {
	const elapsed = nowMs - parse(startedAt);
	const paused = pauses.reduce((acc, p) => {
		const start = parse(p.pausedAt);
		const end = p.resumedAt ? parse(p.resumedAt) : nowMs;
		return acc + Math.max(0, end - start);
	}, 0);
	return Math.max(0, elapsed - paused);
}

/** Whether the session currently has an open (unresolved) pause interval. */
export function isPaused(pauses: WorkoutPauseView[]): boolean {
	return pauses.some((p) => !p.resumedAt);
}

/** Total volume: Σ(reps × weightKg) across all logged sets. */
export function computeTotalVolume(exercises: WorkoutExerciseView[]): number {
	return exercises.reduce(
		(acc, ex) => acc + ex.sets.reduce((s, set) => s + set.metrics.reps * set.metrics.weightKg, 0),
		0
	);
}

/** Sets completed: the count of logged sets in the session. */
export function computeSetsCompleted(exercises: WorkoutExerciseView[]): number {
	return exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
}

export interface SessionSummary {
	totalVolume: number;
	activeWorkTimeMs: number;
	setsCompleted: number;
}

/** Post-workout summary derived from a session's detail. */
export function summarize(detail: WorkoutDetail, nowMs: number): SessionSummary {
	const end = detail.session.endedAt ? parse(detail.session.endedAt) : nowMs;
	return {
		totalVolume: computeTotalVolume(detail.exercises),
		activeWorkTimeMs: computeActiveWorkTime(detail.session.startedAt, detail.pauses, end),
		setsCompleted: computeSetsCompleted(detail.exercises)
	};
}

/** Global fallback rest target (seconds) when an exercise defines none. */
export const DEFAULT_REST_SECONDS = 90;

/**
 * Remaining rest in milliseconds, derived from the last set's `loggedAt`
 * against the exercise's rest target (or the global fallback). Zero once the
 * countdown has elapsed.
 */
export function computeRestRemaining(
	loggedAt: string,
	restSeconds: number | null | undefined,
	nowMs: number
): number {
	const target = (restSeconds ?? DEFAULT_REST_SECONDS) * 1000;
	return Math.max(0, target - (nowMs - parse(loggedAt)));
}

/** Whether a rest countdown is still running. */
export function isResting(
	loggedAt: string,
	restSeconds: number | null | undefined,
	nowMs: number
): boolean {
	return computeRestRemaining(loggedAt, restSeconds, nowMs) > 0;
}

/**
 * Prefill values for a new set under an exercise: the metrics of its previous
 * (most recent) set, or null when the exercise has no sets yet.
 */
export function prefillFromPrevious(exercise: WorkoutExerciseView): LiftingSetMetrics | null {
	if (exercise.sets.length === 0) return null;
	const last = exercise.sets[exercise.sets.length - 1];
	return { reps: last.metrics.reps, weightKg: last.metrics.weightKg };
}

// Bounds mirror the backend `LiftingSetMetrics` validator (reps 1–1000,
// weight 0–1000 kg). The generated Zod schema coerces/bounds too; these are
// checked here for inline pre-submit feedback per `_conv-validation`; the Rust
// command stays authoritative.
const REPS_MIN = 1;
const REPS_MAX = 1000;
const WEIGHT_MIN = 0;
const WEIGHT_MAX = 1000;

/** Validate set metrics; returns an error message, or `null` when valid. */
export function validateLiftingSet(metrics: LiftingSetMetrics): string | null {
	if (!Number.isInteger(metrics.reps) || metrics.reps < REPS_MIN || metrics.reps > REPS_MAX) {
		return `Reps must be between ${REPS_MIN} and ${REPS_MAX}`;
	}
	if (
		!Number.isFinite(metrics.weightKg) ||
		metrics.weightKg < WEIGHT_MIN ||
		metrics.weightKg > WEIGHT_MAX
	) {
		return `Weight must be between ${WEIGHT_MIN} and ${WEIGHT_MAX} kg`;
	}
	return null;
}
