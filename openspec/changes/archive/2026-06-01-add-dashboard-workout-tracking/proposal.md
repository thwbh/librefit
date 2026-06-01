## Why

LibreFit is currently a calorie/weight tracker with no notion of training. Users who lift have to leave the app to log a workout, and the dashboard — the app's home surface — has nothing to offer them mid-session. This change introduces **workout tracking** as a first-class, standalone capability: a live training session that is started, run, and finished from the dashboard itself via a fullscreen overlay, with the dashboard morphing to act as a live status monitor while a session is active.

Workout tracking is **standalone**: it does not feed or modify the calorie budget. Intake and weight remain exactly as they are; the only thing that changes about them on the dashboard is _presentation_ (the cards collapse to summary rows while a session runs), and that presentation is owned by the workout-aware dashboard, not by the intake/weight specs.

## What Changes

- **New `workout-tracking` capability** (prefix `WO`). Brand-new feature; introduces its own data model and dashboard surface.
- **Live session from the dashboard.** An idle dashboard shows a Start Workout module beneath the calorie and weight cards. Starting opens a fullscreen overlay (not a new route) for logging sets; the session is a durable row, active while `ended_at IS NULL`.
- **Structured `workout → exercise → set` data model.** A workout groups exercises; an exercise groups sets; a set is the leaf (for lifting: reps × weight). The relational **skeleton** (FKs, ordering, timestamps) is typed SQL; only the type-varying **set metrics** live in a flexible payload whose schema is a **Rust struct (the SSOT)** that also generates the frontend Zod validator via `tauri-typegen`. Sessions carry a `type` (seeded lookup; weight lifting `wl` only) that selects both the layout and the metric schema. Adding a metric or a future type (cardio's `{distance,pace}`) needs no `ALTER TABLE` on shipped devices. (Explicitly _not_ polymorphic over the calorie entry, _not_ EAV, _not_ a DB-stored template — see design.)
- **Mutable, not append-only.** Sets can be edited and deleted, and an active session can be discarded (cascade-deleted) as distinct from ended (kept) — following intake's existing CRUD pattern, `_conv-modals`, and `_conv-validation`. Ending and discarding are guarded by a **slide-to-confirm** gesture (per `_conv-gestures`) to prevent accidental termination in the gym.
- **Active work time + rest timer.** The primary duration is _active work time_ (`(now − started_at) − Σ paused intervals`), so phone-call pauses don't inflate it; pauses are stored as intervals. Logging a set auto-starts an in-app rest countdown against the exercise's rest target; Rest is a sub-mode with its own recovery visual. In-app only — backgrounded rest alerts are out of scope.
- **Stale-session auto-completion.** A session left active with no activity past an inactivity threshold auto-completes (end set to last activity), protecting trends from "zombie" sessions.
- **In-session set prefill + finish summary.** Logging a set pre-fills reps/weight from that exercise's previous set in the session (editable). Ending shows a post-workout summary (this session's total volume, active work time, sets) before revealing the dashboard. Cross-session ghosting, PR/comparison, and share cards are deferred (history-dependent).
- **Adaptive dashboard (Idle ↔ Active).** While a session is active and the overlay is minimized, the workout module moves to the top with a high-energy palette, and the calorie/weight cards collapse into **micro-progress-bar** rows. Tapping a collapsed row expands it back to its full card (contextual expansion).
- **Durable, derived timing.** Active work time is recomputed from persisted timestamps + pause intervals, never an incrementing counter, so it survives screen lock, backgrounding, and app restart.
- **Seeded exercise library.** Exercises belong to a category, target one or more muscles (primary/secondary), and carry a default rest target — seeded lookup tables plus a join table.

## Capabilities

### New Capabilities

- `workout-tracking` (`WO`): live workout sessions started and run from the dashboard overlay, with a `workout → exercise → set` skeleton, a Rust-compiled flexible metric payload, active-work-time tracking, rest timer, stale-session auto-completion, and a seeded exercise library. Owns the workout domain only.
- `dashboard` (`DH`): the home dashboard's cross-feature composition and its Idle↔Active adaptive states (layout/ordering, the workout morph, micro-row collapse, contextual expansion). This is the first capability to own behavior that belongs to no single feature — it exists because the morph cannot be stated without naming the calorie, weight, and workout surfaces at once. Discriminator: a scenario that must name two or more features lives here; a single-feature scenario stays in that feature's spec. Existing single-region placements (the plan-review panel, header) stay with their owners.

### Modified Capabilities

None. Intake and weight tracking are untouched — the collapsed-row presentation is owned by the new `dashboard` capability (which composes those cards), not by the intake/weight specs. Modal behavior continues to follow `_conv-modals`.

## Impact

- **Backend (Rust/Diesel):** one migration adding `exercise_category`, `muscle`, `workout_type` (lookups), `exercise`, `exercise_muscle`, and the skeleton `workout_session`, `workout_exercise`, `workout_set` (+ `metrics`/`payload_ver`), `workout_pause` (seed data for lookups/library); per-type metric structs (SSOT) validated on write with Lenient read/upcast; new repository functions and Tauri commands for session lifecycle, set logging, pause/resume, and auto-completion.
- **API bindings (TS):** new `workout` API module mirroring the commands; set-metric types/Zod generated from the Rust structs via `tauri-typegen` (CI-regenerated, not committed).
- **Frontend (SvelteKit 5):** workout overlay components, the Start Workout module, and the Idle↔Active dashboard morph in `src/routes/(app)/+page.svelte`. Existing intake FAB and modals are unchanged.
- **Out of scope (future changes):** browsing past workouts / per-exercise history and stats (no route is added), performance ghosting / progressive-overload feedback (now data-feasible since workout history is persisted, but deferred with the history surface), post-workout PR detection / cross-session comparison / shareable summary cards (the finish summary ships this-session totals only), workout templates / routines / "continue last workout", calorie coupling, after-the-fact session entry, workout types beyond weight lifting (the `type` seam exists, but cardio/yoga layouts and metrics are separate), time-of-day dashboard states, a cross-route persistent session bar (the "Spotify bridge"), and any Android foreground-service/notification timer (including backgrounded rest alerts).
