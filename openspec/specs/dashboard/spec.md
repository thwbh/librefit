## Purpose

**ID prefix:** `DH`

Compose the home dashboard's feature surfaces and own its adaptive states. Arrange the calorie card, weight card, and Start Workout module when idle, and morph the layout in response to the workout session lifecycle — promoting the workout module, collapsing metric cards, and switching between focus and rest visuals — with optimistic transitions.

## Requirements

### Requirement: Idle dashboard composition

The home dashboard SHALL compose the feature surfaces it hosts. When no workout session is active, it SHALL display the calorie card, then the weight card, then the workout surface, in that order. The workout surface SHALL show summary cards for today's completed workouts when any exist, followed by the Start Workout module; when none exist it SHALL show the Start Workout module alone. The Start Workout module remains available with completed workouts so a further session can be started. The internal behavior of each card is owned by its feature spec; this capability owns only their arrangement and the dashboard's adaptive states.

#### Scenario: [DH-001] Idle layout order

- **WHEN** the dashboard is shown and no workout session is active
- **THEN** the calorie card, the weight card, and the workout surface appear in that order

#### Scenario: [DH-011] Completed workouts shown above Start Workout

- **WHEN** the dashboard is idle and one or more workouts have been completed today
- **THEN** the workout surface shows a summary card for each, ordered most recent first
- **AND** the Start Workout module remains below them so another session can be started

#### Scenario: [DH-012] Start Workout shown when none completed

- **WHEN** the dashboard is idle and no workouts have been completed today
- **THEN** the workout surface shows the Start Workout module

### Requirement: Active-workout dashboard morph

While a workout session is active and the workout overlay is minimized, the dashboard SHALL promote the workout module to the top and collapse the calorie and weight cards into micro-progress-bar rows that retain a visual fill rather than plain text. The active layout SHALL be selected by the session's type; weight lifting (the only type in this change) uses the working/rest layout with the high-energy (focus) palette. Future types may define their own active layouts.

#### Scenario: [DH-002] Workout module promoted to the top

- **WHEN** a workout session is active and the overlay is minimized
- **THEN** the workout module is rendered at the top of the dashboard in the active palette, above the calorie and weight rows

#### Scenario: [DH-003] Calorie and weight cards collapse to micro-progress rows

- **WHEN** the dashboard is in the active-workout state
- **THEN** the calorie and weight cards are shown as slim rows, each containing a micro-progress bar, not text alone

### Requirement: Contextual expansion of collapsed cards

The dashboard SHALL expand a collapsed calorie or weight row into its full card in place when tapped, and collapse it again on dismissal, without leaving the dashboard.

#### Scenario: [DH-004] Tapping a collapsed row expands it to the full card

- **WHEN** the user taps a collapsed calorie or weight row in the active-workout state
- **THEN** that row expands into its full card view in place
- **AND WHEN** the user dismisses it
- **THEN** it collapses back to the slim row

### Requirement: Dashboard state follows the session lifecycle

The dashboard SHALL switch to the active-workout layout when a workout session becomes active, and return to the idle layout when the active session ends.

#### Scenario: [DH-005] Starting a session switches the dashboard to the active layout

- **WHEN** a workout session becomes active
- **THEN** the dashboard adopts the active-workout layout (workout module promoted, metric cards collapsed)

#### Scenario: [DH-006] Ending a session returns the dashboard to the idle layout

- **WHEN** the active workout session ends and its post-workout summary is dismissed
- **THEN** the dashboard returns to the idle layout with the calorie and weight cards expanded and the Start Workout module restored

### Requirement: Rest recovery visual mode

While the active session is in its rest sub-mode (a rest countdown is running), the dashboard's promoted workout module SHALL adopt a recovery visual — timer-centric with a softer palette — distinct from the focus visual used while working, and SHALL return to the focus visual when work resumes.

#### Scenario: [DH-007] Resting shows the recovery visual

- **WHEN** a rest countdown is running during an active session
- **THEN** the promoted workout module is rendered in the recovery visual (timer-centric, softer palette)

#### Scenario: [DH-008] Resuming work restores the focus visual

- **WHEN** the rest countdown ends and the user resumes working (logs the next set or dismisses rest)
- **THEN** the workout module returns to the focus visual

### Requirement: Responsive (optimistic) transition morphs

The dashboard SHALL begin its morph at the moment a workout state transition is initiated by the user, concurrently with the persisting command, rather than waiting for the persisted result to settle. This optimistic transitional state is transient and not persisted; the committed session state remains the source of truth for durability and recovery. If an initiated transition fails to commit, the dashboard SHALL revert the morph to the prior layout and surface the failure per `_conv-user-errors`.

#### Scenario: [DH-009] Morph begins on transition initiation

- **WHEN** the user initiates a workout state transition (e.g. starting or ending a session, or entering/leaving the rest sub-mode)
- **THEN** the dashboard begins the corresponding morph immediately, concurrently with the persisting command, not after the persisted state settles

#### Scenario: [DH-010] A failed transition reverts the morph

- **WHEN** an initiated transition fails to commit (e.g. a start refused because a session is already active)
- **THEN** the dashboard reverts to the pre-transition layout and the failure is surfaced per `_conv-user-errors`

### Requirement: Today's workout cards on the dashboard

Workout summary cards on the dashboard SHALL show the same content as their history-page counterparts (start time, active work time, total volume) and support the same interactions: tap opens the read-only detail modal, and the `_conv-gestures` entry-card gestures apply (swipe-left/long-press edit, swipe-right delete with confirmation). Editing SHALL update the card without a manual refresh. A workout completed through workout tracking SHALL appear on the dashboard without a manual refresh. While a session is active, the active-workout layout (see "Active-workout dashboard morph") takes priority and completed cards are hidden.

#### Scenario: [DH-013] Tap card opens the read-only detail

- **WHEN** the user taps a completed workout card on the dashboard
- **THEN** a view-only modal opens showing all of the workout's information

#### Scenario: [DH-014] Edit reflects immediately

- **WHEN** the user edits a workout from the dashboard (swipe-left/long-press) and saves
- **THEN** the card updates to reflect the change without a manual refresh

#### Scenario: [DH-015] Newly completed workout appears

- **WHEN** a workout is completed through workout tracking
- **THEN** a card for it appears in the dashboard workout surface without a manual refresh

#### Scenario: [DH-016] Active session hides completed cards

- **WHEN** a workout session is active
- **THEN** completed workout cards are hidden and the active-workout layout is shown

### Requirement: Dashboard workout load and error states

The dashboard workout surface SHALL show a loading state while today's workouts are being fetched and, on failure, an error state with a retry action following `_conv-user-errors`, without discarding any already-visible data.

#### Scenario: [DH-017] Loading state

- **WHEN** today's workouts are being fetched
- **THEN** the workout surface shows a loading indicator and reserves layout space

#### Scenario: [DH-018] Load failure offers retry

- **WHEN** fetching today's workouts fails
- **THEN** the workout surface shows an error with a retry action per `_conv-user-errors`
- **AND** any already-visible data remains
