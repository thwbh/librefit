## Why

Workout tracking shipped in 26.23, but users can only see the current/active session — there is no way to review past workouts or track progress over time. This change surfaces logged workout data in the existing history, dashboard, and progress pages so the app presents a single fitness timeline alongside nutrition and weight.

## What Changes

- Add a workout "Activity" section to the history page: per-day summary cards (start time, active work time, total volume), with view / edit / delete and the ability to add a workout for a past date.
- Show today's completed workouts on the dashboard in the idle workout surface (replacing the Start Workout button when workouts exist).
- Add a two-segment control to the progress page — **Body** (the existing weight/intake/category charts, unchanged) and **Workout** — where the Workout segment summarises a selectable date range with a front/back **muscle coverage map** (colored not-targeted / secondary / primary) and a list of the workouts in range.
- Adapt the existing workout modal to a **flat-CRUD mode** (no rest timers / live controls) for adding and editing past workouts; the current-date "Start Workout" path stays live.
- **Deferred (out of scope):** richer workout analytics — per-exercise progression, personal records, weekly-volume trend charts, and subjective intensity/activation metrics — plus a combined nutrition↔workout correlation view (which would need calories-burned estimation). Captured in `openspec/explorations/workout-analytics`. Insight chips remain in `openspec/explorations/workout-insights`.

## Capabilities

This change modifies existing capabilities only; no new capabilities are introduced.

### Modified Capabilities

- `history`: add the workout activity section, summary cards, historical workout CRUD, and retrospective logging.
- `dashboard`: show today's completed workouts in the idle workout surface with load/error states.
- `progress`: add the Body/Workout segmented control and the Workout segment (muscle coverage map + workout overview).

## Impact

- **Backend (new commands required).** Contrary to the first draft, the current workout service exposes only `get_active_workout` and `get_exercise_library` plus active-session mutations — there is no history retrieval. This change requires:
  - `list_workouts` for a date or date range (completed sessions with detail) — powers history, dashboard, and progress aggregation.
  - `delete_workout` for a completed session.
  - Editing a completed session (reuse `log_workout_set` / `update_workout_set` / `delete_workout_set` against a non-active session, or a dedicated command) — completed workouts are edited in place, not resumed.
  - `create_workout_for_date` for retrospective logging (a session stamped to a past date rather than "now").
- **Database:** no schema changes; muscle data already exists (`exercise_muscle` / `muscle` tables with primary/secondary roles) so the coverage map is feasible. Muscle coverage is aggregated on the frontend from `list_workouts` results.
- **Frontend:** new `WorkoutSummaryCard`, `MuscleMap`, the Body/Workout segmented control, and a flat-CRUD mode for the existing workout modal.
- **Navigation:** the progress page gains the Body/Workout segmented control; the Body segment is the existing progress page unchanged.
