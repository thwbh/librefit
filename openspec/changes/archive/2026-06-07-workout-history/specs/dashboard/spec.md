## MODIFIED Requirements

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

## ADDED Requirements

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
