/**
 * Active-workout rune store.
 *
 * Holds the active session (`WorkoutDetail`) and exposes derived metrics
 * (active work time, total volume, sets completed) computed from persisted
 * facts — never stored counters. The rest countdown and the dashboard's
 * optimistic active flag also live here so the overlay and the dashboard share
 * one source of truth. All persistence goes through the generated `$lib/api`
 * commands, each of which returns the full `WorkoutDetail` we reconcile against.
 */
import {
	deleteWorkoutSet,
	discardWorkoutSession,
	endWorkoutSession,
	getActiveWorkout,
	getExerciseLibrary,
	logWorkoutSet,
	pauseWorkoutSession,
	resumeWorkoutSession,
	startWorkoutSession,
	updateWorkoutSet,
	type LiftingSetMetrics,
	type WorkoutDetail,
	type WorkoutExerciseView
} from '$lib/api';
import {
	computeActiveWorkTime,
	computeSetsCompleted,
	computeTotalVolume,
	computeRestRemaining,
	isPaused as pausedOf,
	prefillFromPrevious,
	summarize,
	type SessionSummary
} from '$lib/workout/metrics';

const TICK_MS = 1000;

interface RestState {
	loggedAt: string;
	restSeconds: number | null;
}

export class WorkoutStore {
	session = $state<WorkoutDetail | null>(null);
	/** Optimistic active flag: true the instant a transition begins. */
	optimisticActive = $state(false);
	error = $state<string | null>(null);
	now = $state(Date.now());
	summary = $state<SessionSummary | null>(null);
	/** Muscles worked in the just-finished session (for the summary visual). */
	summaryMuscles = $state<{ muscle: string; primary: boolean }[]>([]);

	#rest = $state<RestState | null>(null);
	#restDismissed = $state(false);
	#timer: ReturnType<typeof setInterval> | null = null;

	/** Whether the dashboard should render the active layout. */
	active = $derived(this.optimisticActive || this.session !== null);

	paused = $derived(this.session ? pausedOf(this.session.pauses) : false);

	activeWorkTimeMs = $derived(
		this.session
			? computeActiveWorkTime(this.session.session.startedAt, this.session.pauses, this.now)
			: 0
	);

	totalVolume = $derived(this.session ? computeTotalVolume(this.session.exercises) : 0);

	setsCompleted = $derived(this.session ? computeSetsCompleted(this.session.exercises) : 0);

	/**
	 * The exercise currently being worked on: the one holding the most recent
	 * set, falling back to the last one added. Drives the minimized dashboard
	 * module and the "Start Set" quick-repeat default.
	 */
	currentExercise = $derived.by<WorkoutExerciseView | null>(() => {
		if (!this.session || this.session.exercises.length === 0) return null;
		let best: { ex: WorkoutExerciseView; at: number } | null = null;
		for (const ex of this.session.exercises) {
			for (const s of ex.sets) {
				const at = Date.parse(s.loggedAt);
				if (!best || at > best.at) best = { ex, at };
			}
		}
		return best?.ex ?? this.session.exercises[this.session.exercises.length - 1];
	});

	restRemainingMs = $derived(
		this.#rest && !this.#restDismissed
			? computeRestRemaining(this.#rest.loggedAt, this.#rest.restSeconds, this.now)
			: 0
	);

	/** A rest countdown is active (drives the dashboard recovery visual). */
	resting = $derived(this.restRemainingMs > 0);

	/** Bump the clock — call on tick and on app resume to recompute time. */
	tick() {
		this.now = Date.now();
	}

	#startTimer() {
		if (this.#timer) return;
		this.#timer = setInterval(() => this.tick(), TICK_MS);
	}

	#stopTimer() {
		if (this.#timer) {
			clearInterval(this.#timer);
			this.#timer = null;
		}
	}

	#reconcile(detail: WorkoutDetail | null) {
		this.session = detail;
		this.optimisticActive = detail !== null;
		this.tick();
		if (detail) this.#startTimer();
		else this.#stopTimer();
	}

	/** Track the rest countdown anchored to an exercise's most recent set. */
	#armRest(exerciseId: number) {
		if (!this.session) return;
		const ex = this.session.exercises.find((e) => e.exerciseId === exerciseId);
		const last = ex?.sets.at(-1);
		if (ex && last) {
			this.#rest = { loggedAt: last.loggedAt, restSeconds: ex.defaultRestSeconds ?? null };
			this.#restDismissed = false;
		}
	}

	/** Load any active session from the backend (auto-completes stale ones). */
	async load(): Promise<void> {
		this.#reconcile(await getActiveWorkout());
	}

	/** Start a workout, morphing the dashboard optimistically. */
	async start(name?: string): Promise<void> {
		this.error = null;
		this.summary = null;
		this.optimisticActive = true; // begin the morph immediately
		this.#startTimer();
		try {
			this.#reconcile(await startWorkoutSession({ name }));
		} catch (e) {
			this.#reconcile(null); // revert on commit failure
			this.error = String(e);
			throw e;
		}
	}

	/** Log a set for a library exercise (added to the workout if new). */
	async logSet(exerciseId: number, metrics: LiftingSetMetrics): Promise<void> {
		this.#reconcile(await logWorkoutSet({ exerciseId, metrics }));
		this.#armRest(exerciseId);
		this.tick();
	}

	async editSet(setId: number, metrics: LiftingSetMetrics): Promise<void> {
		this.#reconcile(await updateWorkoutSet({ setId, metrics }));
	}

	async deleteSet(setId: number): Promise<void> {
		this.#reconcile(await deleteWorkoutSet({ setId }));
	}

	async pause(): Promise<void> {
		this.#reconcile(await pauseWorkoutSession());
		this.#stopTimer(); // display freezes; the open pause interval grows with now anyway
	}

	async resume(): Promise<void> {
		this.#reconcile(await resumeWorkoutSession());
	}

	async end(): Promise<void> {
		const ended = await endWorkoutSession();
		this.summary = summarize(ended, Date.now());
		this.summaryMuscles = await this.#workedMuscles(ended);
		this.#clear();
	}

	async discard(): Promise<void> {
		await discardWorkoutSession();
		this.summary = null;
		this.summaryMuscles = [];
		this.#clear();
	}

	/** Dismiss the summary, returning the dashboard to its idle layout. */
	dismissSummary() {
		this.summary = null;
		this.summaryMuscles = [];
	}

	/**
	 * Join the just-ended session's exercises with the library to list the
	 * muscles worked (primary if any exercise targeted them as primary). The
	 * `WorkoutDetail` doesn't carry muscles, so we look them up by exerciseId.
	 */
	async #workedMuscles(detail: WorkoutDetail): Promise<{ muscle: string; primary: boolean }[]> {
		try {
			const library = await getExerciseLibrary();
			const byId = new Map(library.map((e) => [e.id, e]));
			const agg = new Map<string, boolean>();
			for (const ex of detail.exercises) {
				const lib = byId.get(ex.exerciseId);
				if (!lib) continue;
				for (const m of lib.muscles) {
					agg.set(m.muscle, (agg.get(m.muscle) ?? false) || m.role === 'primary');
				}
			}
			return [...agg].map(([muscle, primary]) => ({ muscle, primary }));
		} catch {
			return [];
		}
	}

	/** Prefill a new set from the exercise's previous set, if any. */
	prefill(exercise: WorkoutExerciseView) {
		return prefillFromPrevious(exercise);
	}

	/** End the rest countdown (dismiss/expiry/next set). */
	dismissRest() {
		this.#restDismissed = true;
	}

	#clear() {
		this.session = null;
		this.optimisticActive = false;
		this.#rest = null;
		this.#restDismissed = false;
		this.#stopTimer();
	}

	dispose() {
		this.#stopTimer();
	}
}

export const workoutStore = new WorkoutStore();
