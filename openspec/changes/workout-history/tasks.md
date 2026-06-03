## 1. Backend: workout history commands

- [ ] 1.1 Add `list_workouts` (completed sessions with detail) for a date / date range
- [ ] 1.2 Add `delete_workout` for a completed session
- [ ] 1.3 Support editing a completed (non-active) session's sets/metrics (reuse `log_workout_set` / `update_workout_set` / `delete_workout_set` or add a thin command)
- [ ] 1.4 Add `create_workout_for_date` for adding a past workout (completed session stamped to a past date, no active state)
- [ ] 1.5 Register new commands in `lib.rs`; regenerate `$lib/api` bindings
- [ ] 1.6 Write Rust integration tests for the new commands (list/edit/delete/add-past), citing the scenarios they back

## 2. Workout modal: flat-CRUD mode

- [ ] 2.1 Add a mode parameter to the workout modal: live (timers, pause/resume, slide-to-confirm) vs flat CRUD (no timers/live controls)
- [ ] 2.2 Flat-CRUD add/edit/delete of exercises and sets against a completed session
- [ ] 2.3 Wire "Start Workout" → live, "Add Workout" / "Edit Workout" → flat CRUD
- [ ] 2.4 Write Vitest tests for the two modes

## 3. History page integration

- [ ] 3.1 Create `WorkoutSummaryCard` (start time, active work time, total volume)
- [ ] 3.2 Add the "Activity" section to the day detail, between intake and weight, with empty state [HI-014][HI-015]
- [ ] 3.3 Fetch and render the selected day's workouts; update on day navigation [HI-016]
- [ ] 3.4 Render single and multiple cards chronologically [HI-017][HI-018]
- [ ] 3.5 Tap card → detail modal; wire edit (flat CRUD) and delete [HI-019][HI-020][HI-021]
- [ ] 3.6 Add-on-past-date with contextual button label [HI-022][HI-023]
- [ ] 3.7 Write Vitest tests for [HI-014]–[HI-023]

## 4. Dashboard integration

- [ ] 4.1 Show today's completed workout cards in the idle workout surface; hide Start Workout when present [DH-001][DH-011][DH-012]
- [ ] 4.2 Reuse card interactions: tap → modal, edit updates in place [DH-013][DH-014]
- [ ] 4.3 Reflect newly completed/edited workouts without manual refresh (shared store invalidation) [DH-015]
- [ ] 4.4 Hide completed cards while a session is active (defer to the active-workout morph) [DH-016]
- [ ] 4.5 Loading and error/retry states [DH-017][DH-018]
- [ ] 4.6 Write Vitest tests for [DH-011]–[DH-018]

## 5. Progress page: Body/Workout segments

- [ ] 5.1 Add the Body/Workout segmented control; Body default hosting existing charts unchanged [PG-005]
- [ ] 5.2 Segment switching updates view + URL hash [PG-006]
- [ ] 5.3 Lazy-load workout data on first Workout selection [PG-007]
- [ ] 5.4 Persist selection in `localStorage` across navigation and restarts [PG-008]
- [ ] 5.5 Selectable range governing the segment, default 30 days [PG-009]
- [ ] 5.6 Write Vitest tests for [PG-005]–[PG-009]

## 6. Muscle coverage map and workout overview

- [ ] 6.1 Front/back body SVG asset with regions keyed to seeded `muscle` shortvalues
- [ ] 6.2 `MuscleMap` colored by strongest role per muscle over the range (not targeted / secondary / primary) [PG-010]
- [ ] 6.3 Muscle group tap → name + role [PG-011]
- [ ] 6.4 Frontend coverage aggregation over `list_workouts` results
- [ ] 6.5 Workout overview list reusing `WorkoutSummaryCard` and detail modal [PG-012][PG-013]
- [ ] 6.6 Workout-segment empty state [PG-014]
- [ ] 6.7 Write Vitest tests for [PG-010]–[PG-014]

## 7. Finalization

- [ ] 7.1 Verify data consistency across history, dashboard, and progress
- [ ] 7.2 Test on an Android device
- [ ] 7.3 Update changelog
- [ ] 7.4 Final review and cleanup
