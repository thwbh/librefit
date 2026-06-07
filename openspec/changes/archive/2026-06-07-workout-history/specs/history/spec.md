## ADDED Requirements

### Requirement: Workout activity section

The history page SHALL display a workout activity section for the selected day, positioned between the intake list and the weight section, with a header labeled "Activity" that is visually consistent with other section headers. The section SHALL update to the new day's workouts when the user navigates between days. When the selected day has no workouts, the section SHALL show an empty state with a call-to-action to add a workout (see `_conv-empty-states`).

#### Scenario: [HI-014] Activity section placement

- **WHEN** the user views a day's detail in history
- **THEN** an "Activity" section is shown between the intake list and the weight section

#### Scenario: [HI-015] Empty activity section

- **WHEN** the selected day has no logged workouts
- **THEN** the activity section shows an empty state with an add-workout call-to-action (labeled per [HI-023])

#### Scenario: [HI-016] Section updates on day navigation

- **WHEN** the user navigates to a different day
- **THEN** the activity section updates to show that day's workouts

### Requirement: Workout summary cards in history

For each workout logged on the selected day, the activity section SHALL display a summary card showing the workout's start time, active work time, and total volume behind a barbell icon. (For weight lifting, active work time — wall-clock minus paused intervals — is the duration shown, consistent with the live session and post-workout summary.) Multiple workouts on the same day SHALL be shown as separate cards in chronological order.

#### Scenario: [HI-017] Single workout card content

- **WHEN** the selected day has one logged workout
- **THEN** a summary card shows its start time, active work time, and total volume

#### Scenario: [HI-018] Multiple workouts shown chronologically

- **WHEN** the selected day has more than one logged workout
- **THEN** a separate summary card is shown for each, in chronological order

### Requirement: Historical workout CRUD

The history page SHALL allow viewing, editing, and deleting logged workouts, and SHALL allow adding a workout for any historical date. Tapping a summary card SHALL open a read-only detail modal (all exercises, sets, and metrics) following `_conv-modals`. Edit and delete follow the entry-card gestures in `_conv-gestures`: swipe-left or long-press opens the flat-CRUD editor; swipe-right opens a delete confirmation. Adding and editing use the workout modal in its flat-CRUD mode (no rest timers or live session controls); completed workouts are edited in place, not resumed. A logged or edited workout SHALL be reflected in the history view without a manual refresh. Adding a workout on a historical date SHALL associate it with that date, not today.

#### Scenario: [HI-019] Tap card opens the read-only detail

- **WHEN** the user taps a workout summary card
- **THEN** a view-only modal opens showing all of the workout's exercises, sets, and metrics

#### Scenario: [HI-020] Edit a logged workout via swipe/long-press

- **WHEN** the user swipes left on (or long-presses) a workout card
- **THEN** the flat-CRUD editor opens for that workout
- **AND** on save the summary card reflects the change without a manual refresh

#### Scenario: [HI-021] Delete a logged workout via swipe with confirmation

- **WHEN** the user swipes right on a workout card
- **THEN** a delete confirmation with a read-only preview appears (`_conv-modals`)
- **AND WHEN** the user confirms
- **THEN** the workout is removed and its summary card disappears from the activity section

#### Scenario: [HI-022] Add a workout on a historical date

- **WHEN** the user adds a workout while viewing a historical date
- **THEN** the workout is created (via the flat-CRUD modal) associated with the selected date

#### Scenario: [HI-023] Contextual button label

- **WHEN** the user views a historical date
- **THEN** the workout button reads "Add Workout" and opens the flat-CRUD modal
- **AND WHEN** the user views the current date
- **THEN** the workout button reads "Start Workout" and opens the live session
