## 1. Spec & registry

- [ ] 1.1 Register prefixes `WO` (`workout-tracking`) and `DH` (`dashboard`) in `CLAUDE.md`'s prefix registry table.

## 2. Backend — schema & migration

- [ ] 2.1 New Diesel migration adding `exercise_category`, `muscle`, and `workout_type` lookup tables (`shortvalue` PK / `longvalue`), mirroring `food_category`.
- [ ] 2.2 Add `exercise` (`id`, `name`, `category` FK → `exercise_category`, `default_rest_seconds` NULL) and `exercise_muscle` join table (`exercise_id` FK, `muscle` FK, `role`) with composite PK.
- [ ] 2.3 Add the workout skeleton (`workout → exercise → set`): `workout_session` (`id`, `type` FK → `workout_type`, `name?`, `started_at`, `ended_at` NULL); `workout_exercise` (`id`, `session_id` FK, `exercise_id` FK, `sequence`); `workout_set` (`id`, `workout_exercise_id` FK, `sequence`, `logged_at`, `payload_ver`, `metrics` TEXT); `workout_pause` (`id`, `session_id` FK, `paused_at`, `resumed_at` NULL).
- [ ] 2.4 Seed `exercise_category`, `muscle`, `exercise` (with `default_rest_seconds`), `exercise_muscle` (initial library), and `workout_type` (`wl` → Weight lifting).
- [ ] 2.5 Update Diesel `schema.rs` and add models for the new tables.

## 3. Backend — metric payload (compiled schema)

- [ ] 3.1 Define the per-type metric struct (e.g. `LiftingSetMetrics { reps, weight_kg, … }`) as the SSOT; wire `tauri-typegen` so the same struct generates the frontend Zod validator (regenerated in CI, not committed).
- [ ] 3.2 Validate `metrics` against the active session's type schema on write; reject invalid payloads (`[WO-019]`) per `_conv-validation`.
- [ ] 3.3 Reads use Lenient read / migration-on-read: parse permissively, upcast by `payload_ver`, expose the strict current struct. Document the JSON1-SQL-migration path for structural blob changes.

## 4. Backend — repository & commands

- [ ] 4.1 Repository: start session as type `wl` (refuse if one is active → `[WO-002]`); add exercise to workout + log set under it with validated metrics + `logged_at` (`[WO-003]`, `[WO-004]`); edit set; delete set; pause/resume (write `workout_pause` intervals); end session; discard session (cascade delete exercises + sets); fetch active session with exercises + sets; list library exercises with category + muscles + default rest.
- [ ] 4.2 Stale-session auto-complete: on app open / active-session read, if no set logged and no pause/resume past the inactivity threshold, set `ended_at` to last activity and mark inactive (`[WO-020]`).
- [ ] 4.3 Tauri commands wrapping the repository functions; register them.
- [ ] 4.4 Rust integration tests under `src-tauri/tests/` citing `[WO-001]`, `[WO-002]`, `[WO-003]`, `[WO-004]`, `[WO-011]`, `[WO-012]`, `[WO-013]`, `[WO-014]`, `[WO-015]`, `[WO-016]`, `[WO-019]`, `[WO-020]` via the `scenario!` macro.

## 5. Frontend — API bindings & live state

- [ ] 5.1 New `src/lib/api/workout.ts` bindings + types mirroring the commands (set metrics typed via the generated schema); export from `$lib/api`.
- [ ] 5.2 Active-session state with derived metrics: `activeWorkTime = (now − started_at) − Σ(paused intervals)`, `totalVolume = Σ(reps × weight_kg)`, `setsCompleted` — derived, never an incrementing counter (`[WO-005]`, `[WO-006]`, `[WO-007]`).
- [ ] 5.3 Recompute active work time on resume (`visibilitychange` / Tauri resume event) from `started_at` + persisted pause intervals (`[WO-008]`, `[WO-009]`).

## 6. Frontend — workout overlay

- [ ] 6.1 Fullscreen overlay component (per `_conv-modals`): exercise picker, set logging (reps + weight, pre-validated by the generated Zod), live active-time/volume/sets, Pause, End, Discard, and minimize. Prefill reps/weight from the exercise's previous set in the session (`[WO-021]`).
- [ ] 6.2 Pause records an interval (display freezes); resume recomputes active work time (`[WO-010]`). End and Discard are guarded by a slide-to-confirm gesture with threshold haptics per `_conv-gestures` (`[WO-023]`, `[WO-024]`); a tap/partial slide does nothing. End records `ended_at`, session inactive (`[WO-011]`). Discard cascade-deletes over a read-only preview (`[WO-016]`).
- [ ] 6.3 Edit and delete logged sets via the modal pattern, recomputing metrics (`[WO-014]`, `[WO-015]`); validation per `_conv-validation`.
- [ ] 6.4 Rest timer: auto-start an in-app countdown on set log, derived from `logged_at` against the exercise's rest target (global fallback); end on expiry/dismiss/next set (`[WO-017]`, `[WO-018]`).
- [ ] 6.5 Post-workout summary on End: show this session's total volume, active work time, and sets completed; dismiss reveals the dashboard idle layout (`[WO-022]`, `[DH-006]`). PR/comparison/share deferred.

## 7. Frontend — adaptive dashboard (`dashboard` capability)

- [ ] 7.1 Idle layout: calorie card, weight card, then Start Workout module, in that order (`[DH-001]`); tapping the module starts a session and opens the overlay (`[WO-001]`).
- [ ] 7.2 Active layout: workout module promoted to top in the high-energy palette; calorie/weight cards collapse to micro-progress-bar rows (`[DH-002]`, `[DH-003]`); transitions per `_conv-animations`.
- [ ] 7.3 Contextual expansion: tapping a collapsed row expands it to the full card in place and collapses on dismissal (`[DH-004]`).
- [ ] 7.4 State machine: enter the active layout when a session becomes active (`[DH-005]`); return to the idle layout when it ends (`[DH-006]`). The active layout is selected by session type (`wl`).
- [ ] 7.5 Rest recovery visual: switch the promoted module to the recovery visual while resting and back to focus on resume (`[DH-007]`, `[DH-008]`).
- [ ] 7.6 Optimistic transitions: begin the morph on transition initiation, concurrently with the command (`[DH-009]`); revert + surface error on commit failure (`[DH-010]`). Transitional state is transient (not persisted); committed state reconciles it.

## 8. Tests — frontend

- [ ] 8.1 Colocated Vitest tests citing the dashboard composition scenarios: `[DH-001]`, `[DH-002]`, `[DH-003]`, `[DH-004]`, `[DH-005]`, `[DH-006]`, `[DH-007]`, `[DH-008]`, `[DH-009]`, `[DH-010]`.
- [ ] 8.2 Colocated Vitest tests for workout UI/state: active work time + total volume + sets `[WO-005]`, `[WO-006]`, `[WO-007]`; resume-recompute `[WO-008]`, `[WO-009]`; pause-interval `[WO-010]`; rest countdown `[WO-017]`, `[WO-018]`; set edit/delete metric recompute `[WO-014]`, `[WO-015]`; set prefill `[WO-021]`; finish summary `[WO-022]`; slide-to-confirm end/discard `[WO-023]`, `[WO-024]`.

## 9. Verify

- [ ] 9.1 `npm run test` green; `npm run test:traceability` credits all `[WO-NNN]` and `[DH-NNN]`.
- [ ] 9.2 `cargo nextest run` from `src-tauri/` green (no regression).

## 10. Archive

- [ ] 10.1 `openspec archive add-dashboard-workout-tracking` once merged.
