## Context

Workout tracking shipped in 26.23 but exposes no history: the only retrieval commands are `get_active_workout` and `get_exercise_library`. Users can see the active session and nothing else. This change extends the history, dashboard, and progress pages to display logged workouts, reusing existing UI patterns. It requires new read/edit/delete/retrospective backend commands (see proposal Impact); it does not touch the schema.

## Goals / Non-Goals

**Goals:**

- Integrate logged workouts into the history page for daily review.
- Show today's completed workouts on the dashboard.
- Add a Body/Workout segmented control to the progress page, with a muscle coverage map and workout overview under Workout.
- Stay consistent with existing UI patterns; keep it mobile-friendly.

**Non-Goals:**

- New workout _tracking_ functionality (already shipped).
- Calories-burned / energy-expenditure estimation (no data; deferred).
- Richer workout analytics — per-exercise progression, PRs, volume-trend charts, intensity metrics (split to `explorations/workout-analytics`).
- Workout insight chips (split to `explorations/workout-insights`).
- A combined nutrition↔workout correlation view; social features, sharing, or ML.

## Decisions

### 1. History page integration

Add a workout "Activity" section to the day detail, between the intake list and the weight section, using the same card pattern as intake entries. A `WorkoutSummaryCard` shows start time, **active work time**, and total volume behind a barbell icon. (A per-session heatmap was rejected as meaningless; a per-card muscle silhouette was prototyped and dropped — on the phone-width card the three metric columns leave too little room for a legible figure, and it shifted the card's affordance toward "tap" over the swipe-row pattern. The full worked-muscle map lives in the fullscreen detail and editor modals instead.) Tapping opens a modal with full detail and edit/delete. The button is contextual: current date → "Start Workout" (live); historical date → "Add Workout" (flat CRUD). Editing a completed workout happens in place — it is **not** resumed (see Decision 5).

### 2. Dashboard integration

Reuse `WorkoutSummaryCard` in the dashboard's idle workout surface. When today has completed workouts, show their cards (most recent first) instead of the Start Workout button; otherwise show the button. While a session is active, the existing active-workout morph takes priority and completed cards are hidden. Load and error (retry) states follow `_conv-user-errors`.

### 3. Progress page structure

A two-segment control — **Body** and **Workout** — sits at the top. Body is the default and is the _existing_ progress page (weight, intake, category charts) unchanged. The active segment is reflected in the URL hash for deep linking and persisted in `localStorage` so it survives navigation **and** app restarts. Workout data is fetched lazily — only when Workout is first selected. There is no "Combined" segment: with calories-burned out of scope, a nutrition↔workout correlation view has no honest basis, and a single-axis overlay of unrelated units would imply one anyway.

### 4. Workout segment content

The Workout segment summarises a selectable range (default 30 days; the range governs the whole segment):

1. **Muscle coverage map** — front/back SVG; each muscle colored by the strongest role it was trained with over the range — not targeted / secondary / primary — from `exercise_muscle`. Tap a group for its name and role. We deliberately avoid "intensity %" / "activation %": those numbers are subjective and, as users of other apps, undecipherable. Primary/secondary is honest and sufficient for this iteration.
2. **Workout overview list** — the workouts in range as `WorkoutSummaryCard`s (most recent first), reusing the history card and detail modal.

When no workouts fall in range, an empty state replaces both (parallel to the Body segment's existing insufficient-data state). Aggregation runs on the frontend over `list_workouts` results.

### 5. Editing vs resuming; the modal's two modes

Completed workouts are **editable, never resumable.** The session model allows one active session at a time (`WorkoutSession::active` returns an `Option`); reopening an ended session would conflict with that and with the dashboard morph. Two distinct surfaces handle the two intents:

- **Live** ("Start Workout", current date) — the existing `WorkoutOverlay` on the dashboard: rest timers, pause/resume, slide-to-confirm end, active session. The history "Start Workout" button starts a session via `workoutStore.start()` and navigates to the dashboard.
- **Flat CRUD** ("Add Workout" / "Edit Workout", any past session) — a dedicated `WorkoutEditModal` that composes the existing `ExercisePicker` + `SetMask`: add/edit/delete exercises and sets with no timers or live controls, writing a completed session directly. It reuses the backend's "edit a set during _or after_ the session" support (WO-014/015) and creates the session lazily (`create_workout_for_date`) on the first set, so an abandoned editor persists nothing. (A separate component rather than a runtime flag on the live overlay — the overlay is tightly coupled to the active-session store, so a flat editor stays simpler and decoupled.)

## Risks / Trade-offs

- **Mobile performance.** Mitigation: lazy-load workout data on first Workout-segment selection (Decision 3), bound the range (default 30 days), build the muscle map as a static SVG with region fills. (Scroll-into-view lazy mounting was considered and dropped as gold-plating for a single-user app.)
- **Data freshness across views.** A workout logged/edited in one surface must appear in the others without a manual refresh. Mitigation: drive all surfaces off the shared workout store; invalidate on mutation.
- **Muscle map asset.** Needs a front/back body SVG with regions keyed to the seeded `muscle` shortvalues. Mitigation: one-time asset + lookup table; coverage logic is trivial (max role per muscle).
- **Backend surface growth.** Four new commands (proposal Impact). Mitigation: keep them thin — `list_workouts` plus reuse of existing set-level mutations where possible.

## Resolved questions

- **Segments:** Body (existing charts, default) and Workout; no Combined.
- **Segment persistence:** `localStorage`, surviving navigation and restarts; default Body for everyone.
- **Workout range:** default 30 days, user-selectable, governing the whole segment.
- **Muscle coverage semantics:** strongest role per muscle over the range — not targeted / secondary / primary; no subjective intensity/activation numbers.
- **Empty Workout segment:** when no workouts fall in range, an empty state replaces the map and list (`_conv-empty-states`).
- **Out of scope (deferred):** per-exercise progression, PRs, weekly-volume trend charts, intensity metrics, calories-burned, combined correlation, insight chips — see `explorations/workout-analytics` and `explorations/workout-insights`.
