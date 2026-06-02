## Purpose

**ID prefix:** `WO`

Track live weight-lifting workouts as a structured `workout → exercise → set` hierarchy. Start a single active session from the dashboard, log sets against a seeded exercise library with validated metrics, observe derived live metrics, rest between sets, and end or discard the session — surviving the app lifecycle and auto-completing if abandoned.

## Requirements

### Requirement: Start a live workout session

The system SHALL allow starting a live workout session from the dashboard's Start Workout module. Starting records the session's start timestamp and type, and leaves it active until ended. Weight lifting (`wl`) is the only type available to start in this change; the type is recorded to select the active layout (owned by `dashboard`), to choose the metric schema validated on each set, and to admit future types. At most one session SHALL be active at a time; starting while a session is already active SHALL be refused. (The module's placement and the dashboard's reaction to start are owned by the `dashboard` capability.)

#### Scenario: [WO-001] Start a session from the dashboard module

- **WHEN** the user taps the Start Workout module while no session is active
- **THEN** a weight-lifting session is created, its start timestamp and type are recorded, it is left active, and the workout overlay opens

#### Scenario: [WO-002] Only one active session at a time

- **WHEN** a session is already active and a request to start another is made
- **THEN** the backend rejects it and no second active session is created

### Requirement: Log exercises and sets within a workout

A workout is structured as `workout → exercise → set`. During an active session the system SHALL allow adding an exercise (referencing the library) to the workout and logging sets under it. A set is the leaf unit: for weight lifting it records a repetition count and a weight, plus the timestamp it was logged. Exercises within a workout, and sets within an exercise, SHALL each preserve their logged order. The set's variable metrics are carried in a validated payload (see "Validated set metrics").

#### Scenario: [WO-003] Log a set under an exercise

- **WHEN** the user selects a library exercise during an active session and submits a set with a repetition count and weight
- **THEN** the exercise is present in the workout (added if new) and a set is recorded under it with the given reps, weight, and logged-at timestamp

#### Scenario: [WO-004] Multiple exercises and sets accumulate in order

- **WHEN** the user logs several sets across one or more exercises
- **THEN** each set is associated with its exercise, exercises and sets each preserve the order they were logged, and the workout reflects the full structure

### Requirement: Validated set metrics

A set's variable metrics SHALL be validated against the schema for the session's workout type before persistence. The schema is defined by a Rust type (the single source of truth); the same definition generates the frontend Zod validator via `tauri-typegen`, so the frontend pre-validates and the Rust command re-validates on write. Metrics that do not satisfy the type's schema SHALL be rejected and not persisted.

#### Scenario: [WO-019] Invalid set metrics are rejected

- **WHEN** a set is submitted whose metrics do not satisfy the active workout type's schema (e.g. a missing or wrong-typed field, or a value outside its declared bounds)
- **THEN** the backend rejects the set, nothing is persisted, and the failure follows `_conv-validation` / `_conv-user-errors`

### Requirement: Live session metrics

The active session SHALL display derived metrics — active work time, total volume, and sets completed — computed from persisted session and set data rather than an incrementing counter. Active work time is the primary duration shown. Total volume SHALL equal the sum of repetition count × weight across all sets in the workout.

#### Scenario: [WO-005] Active work time excludes paused intervals

- **WHEN** the active work time is displayed for a session
- **THEN** it equals (current time − start timestamp) minus the total of the session's paused intervals

#### Scenario: [WO-006] Total volume sums reps times weight

- **WHEN** a workout has sets of (reps, weight)
- **THEN** the displayed total volume equals the sum of reps × weight over all sets in the workout

#### Scenario: [WO-007] Sets completed reflects the logged set count

- **WHEN** sets are logged during a session
- **THEN** the sets-completed metric equals the number of logged sets across the workout

### Requirement: Session durability across the app lifecycle

An active session SHALL survive screen lock, app backgrounding, and app restart. On return, the displayed active work time SHALL be recomputed from the persisted start timestamp and paused intervals, and the session SHALL still be active.

#### Scenario: [WO-008] Active work time survives backgrounding

- **WHEN** a session is active and the app is backgrounded or the screen is locked for a period
- **THEN** on resume the displayed active work time is recomputed from the start timestamp and paused intervals, not carried over from the value shown before suspension

#### Scenario: [WO-009] Active session resumes after app restart

- **WHEN** the app is closed and reopened while a session is active
- **THEN** the session is still active and its active work time continues from the persisted timestamps

### Requirement: Pause and end a session

The system SHALL allow pausing and ending an active session. Pausing SHALL record a pause interval; resuming closes it; active work time excludes the summed paused intervals while wall-clock duration (start to end) remains available in session details. Ending SHALL be guarded by a slide-to-confirm gesture (see "Slide-to-confirm for ending and discarding"), then record the end timestamp, mark the session no longer active, and present the post-workout summary (see "Post-workout summary") before the dashboard is revealed. (The dashboard's return to the idle layout is owned by the `dashboard` capability.)

#### Scenario: [WO-010] Pausing records an interval excluded from active work time

- **WHEN** the user pauses an active session and later resumes
- **THEN** a pause interval is recorded, the on-screen active-time display freezes while paused, and on resume the active work time reflects (elapsed − paused intervals); the wall-clock duration still includes the paused time

#### Scenario: [WO-011] Ending a session records the end timestamp

- **WHEN** the user ends an active session
- **THEN** the session's end timestamp is recorded and the session is no longer active

### Requirement: Seeded exercise library

The system SHALL provide a seeded library of exercises selectable when logging a set. Each exercise SHALL belong to one category, target one or more muscles (each marked primary or secondary), and carry a default rest target.

#### Scenario: [WO-012] The exercise library is seeded and selectable

- **WHEN** the user opens the exercise picker while logging a set
- **THEN** the seeded exercises are listed and one can be selected

#### Scenario: [WO-013] An exercise exposes its category, muscles, and default rest

- **WHEN** an exercise is inspected
- **THEN** it reports exactly one category, one or more muscles each tagged primary or secondary, and a default rest target

### Requirement: Exercise library search

The system SHALL provide a unified search that filters the exercise library by name, category, and muscle groups using a single search term. Before any term is entered the list is not shown (a prompt invites searching); an empty result is handled distinctly from the initial prompt.

#### Scenario: [WO-025] Unified search filters by name, category, and muscles

- **WHEN** the user enters a search term (e.g., "press") in the exercise search bar
- **THEN** the exercise list filters to show exercises that match ANY of:
  - Exercise name contains the search term (case-insensitive)
  - Exercise category contains the search term
  - Any primary or secondary muscle group contains the search term

#### Scenario: [WO-026] Search clears to initial prompt state

- **WHEN** the user clears the search bar (backspace to empty or tap clear icon)
- **THEN** the "Type to search exercises." prompt is displayed
- **AND** no exercises are listed (empty query state)

#### Scenario: [WO-027] Empty search results state

- **WHEN** a search term matches no exercises
- **THEN** a text message "No exercises match `{search_term}`" is displayed
- **AND** the message follows the visual style: small text (text-sm) with reduced opacity (opacity-60)
- **AND** the message appears in the same container as search results would
- **AND** no exercises are listed below the message

### Requirement: Correct logged sets

The system SHALL allow editing a logged set's reps and weight, and deleting a logged set, during or after the session. Edits and deletions SHALL follow `_conv-modals` and `_conv-validation`, and the session's derived metrics SHALL update to reflect the change.

#### Scenario: [WO-014] Edit a logged set

- **WHEN** the user edits an existing set's reps or weight
- **THEN** the set is updated with the new values and the session's total volume and metrics recompute accordingly

#### Scenario: [WO-015] Delete a logged set

- **WHEN** the user deletes an existing set
- **THEN** the set is removed and the session's metrics recompute without it

### Requirement: Discard an active session

The system SHALL allow discarding an active session, which deletes the session and all its exercises and sets. Discarding is distinct from ending: ending preserves the session with an end timestamp, while discarding removes it entirely. Discarding SHALL be confirmed via the slide-to-confirm gesture (see "Slide-to-confirm for ending and discarding") over a read-only preview of what will be removed, per `_conv-modals`.

#### Scenario: [WO-016] Discard an active session

- **WHEN** the user discards the active session and confirms
- **THEN** the session and all its exercises and sets are deleted, no completed session is recorded, and no session remains active

### Requirement: Rest timer between sets

When a set is logged, the system SHALL start an in-app rest countdown derived from the set's logged-at timestamp against a rest target. The rest target SHALL resolve from the logged exercise's default rest, falling back to a global default when the exercise defines none. The countdown SHALL end when it expires or when the user dismisses it or logs the next set. The rest timer is in-app only; alerting while the app is backgrounded is out of scope.

> **Note (deferred refinement — not yet a requirement).** Recommended rest is really a function of the **rep range / training intent**, not the exercise alone: the same lift wants ~3 min at a hypertrophy range (8–12 reps) but ~5 min at a strength range (5–7 reps). That intent is a property of the **workout plan** (templates / target rep ranges per exercise), which is an unimplemented future domain. The exercise's `default_rest_seconds` is therefore a static approximation that silently assumes one intent per exercise. When the plan feature lands, the rest target should resolve in this precedence: **plan/intent-derived > per-set manual override > exercise `default_rest_seconds` > global default**. Until then, the exercise default is the best available signal and remains the behavior above. (Both the plan-derived target and the per-set override are deferred; see the change's design "Deferred enhancements".)

#### Scenario: [WO-017] Logging a set starts the rest countdown against the exercise's target

- **WHEN** the user logs a set during an active session
- **THEN** an in-app rest countdown starts, using the exercise's default rest target (or the global default if none), showing time remaining derived from the set's logged-at timestamp

#### Scenario: [WO-018] Rest ends on expiry or user action

- **WHEN** the rest countdown reaches zero, or the user dismisses it or logs the next set
- **THEN** the rest countdown ends and the session returns to the working state

### Requirement: Stale session auto-completion

To prevent an indefinitely-active ("zombie") session from polluting metrics and trends, the system SHALL auto-complete a session after a prolonged inactivity threshold. If no set is logged and no pause or resume occurs for the threshold, the session SHALL transition from active to completed, with its end timestamp set to the last activity, preserving all logged data for later review.

#### Scenario: [WO-020] Inactive session auto-completes

- **WHEN** an active session has had no set logged and no pause/resume for longer than the inactivity threshold
- **THEN** the session is auto-completed with its end timestamp set to the last activity time, its logged data is preserved, and it no longer appears active

### Requirement: Set entry prefill

When logging a set, the system SHALL pre-fill the reps and weight inputs from the previous set of the same exercise in the current session, when one exists; the user MAY adjust the values before confirming. This is an in-session convenience only — cross-session prefill ("ghosting" from prior workouts) depends on workout history and is out of scope.

#### Scenario: [WO-021] Next set prefills from the previous set

- **WHEN** the user begins logging a set for an exercise that already has a prior set in the active session
- **THEN** the reps and weight inputs are pre-filled from that exercise's previous set, editable before confirming
- **AND WHEN** it is the first set of that exercise in the session
- **THEN** the inputs start from their empty/default state

### Requirement: Post-workout summary

On ending a session, the system SHALL present a summary of that session before returning to the dashboard, showing at least total volume, active work time, and sets completed. The summary covers the just-completed session only; personal-record detection, cross-session comparison, and sharing are out of scope (they depend on workout history).

#### Scenario: [WO-022] Ending shows the session summary

- **WHEN** the user ends an active session
- **THEN** a summary of that session is shown with its total volume, active work time, and sets completed
- **AND WHEN** the user dismisses the summary
- **THEN** the dashboard is revealed in its idle layout

### Requirement: Slide-to-confirm for ending and discarding

Ending and discarding an active session SHALL require a deliberate **slide-to-confirm** gesture rather than a single tap, to prevent accidental session termination in the high-motion gym context. A tap, or an incomplete slide, SHALL NOT trigger the action; completing the slide commits it. The gesture follows `_conv-gestures`, including haptic feedback at the confirmation threshold. Completing the slide is the transition _initiation_ that drives the optimistic morph (see `dashboard` `DH-009`).

#### Scenario: [WO-023] Ending requires a completed slide-to-confirm

- **WHEN** the user taps the End control or only partially slides the confirm track
- **THEN** the session does not end
- **AND WHEN** the user completes the slide-to-confirm gesture
- **THEN** haptic feedback fires at the threshold and the session ends (recording the end timestamp and presenting the post-workout summary)

#### Scenario: [WO-024] Discarding requires a completed slide-to-confirm

- **WHEN** the user taps Discard or only partially slides the confirm track
- **THEN** nothing is discarded
- **AND WHEN** the user completes the slide-to-confirm gesture over the read-only preview
- **THEN** the session and all its exercises and sets are deleted and no session remains active
