## MODIFIED Requirements

### Requirement: Seeded exercise library

The exercise library SHALL combine **system-seeded** exercises with **user-created** ones, and both SHALL be selectable when logging a set. Seeded exercises are system-owned and read-only. Each seeded or verified exercise belongs to exactly one category, targets one or more muscles (each marked primary or secondary), and carries a default rest target; user-created exercises MAY be incomplete until verified (see "Exercise verification status").

#### Scenario: [WO-012] The exercise library is seeded and selectable

- **WHEN** the user opens the exercise picker while logging a set
- **THEN** the seeded exercises are listed and one can be selected

#### Scenario: [WO-013] A seeded or verified exercise exposes its category, muscles, and default rest

- **WHEN** a seeded or verified exercise is inspected
- **THEN** it reports exactly one category, one or more muscles each tagged primary or secondary, and a default rest target

#### Scenario: [WO-028] Seeded exercises are read-only

- **WHEN** an edit or delete of a seeded (system-owned) exercise is attempted
- **THEN** the backend rejects it and the seeded exercise is unchanged

### Requirement: Exercise library search

During an active session, the exercise picker SHALL provide a unified search that filters the exercise library by name, category, and muscle groups using a single search term. Before any term is entered the list is not shown (a prompt invites searching); an empty result is handled distinctly from the initial prompt. This prompt-until-typed behavior is specific to the in-session picker; the library management screen reuses the same matching but lists the full library by default (see "Exercise library management screen").

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

## ADDED Requirements

### Requirement: Create, edit, and delete user exercises

The system SHALL allow a user to add an exercise to their library, edit a user-created exercise's name, category, muscles (each primary or secondary), and default rest target, and delete a user-created exercise. User exercises are owned by the user and visually distinguished from seeded exercises in the picker and search. Add and edit follow `_conv-modals` and `_conv-validation`; the full add/edit screen is the path that supplies complete metadata. Deleting an exercise that is referenced by a logged set SHALL be handled per `_conv-user-errors` rather than silently orphaning data. Deleting an unreferenced user exercise SHALL be reversible via a grace-period Undo per `_conv-undo`.

#### Scenario: [WO-029] Create a user exercise with full metadata

- **WHEN** the user submits the add-exercise screen with a name, category, one or more muscles tagged primary/secondary, and a default rest target
- **THEN** a user-owned exercise is created with those values and appears in the library, distinguished from seeded exercises

#### Scenario: [WO-030] Edit a user exercise

- **WHEN** the user edits a user-owned exercise's fields and saves
- **THEN** the exercise is updated with the new values, following `_conv-validation`

#### Scenario: [WO-031] Delete a user exercise

- **WHEN** the user deletes a user-owned exercise that is not referenced by any logged set
- **THEN** the exercise is removed from the library

#### Scenario: [WO-032] Deleting a referenced exercise is guarded

- **WHEN** the user attempts to delete a user-owned exercise that is referenced by a logged set
- **THEN** the deletion is refused and the failure is surfaced per `_conv-user-errors`, leaving the exercise and its references intact

#### Scenario: [WO-033] User exercises are distinguished from seeded ones

- **WHEN** the exercise picker or search lists both seeded and user-created exercises
- **THEN** user-created exercises carry a visual marker distinguishing them from seeded exercises

#### Scenario: [WO-048] Deleting a user exercise is reversible

- **WHEN** the user deletes an unreferenced user-owned exercise and taps Undo on the grace-period snackbar (per `_conv-undo`)
- **THEN** the exercise is restored to the library with its category, muscles, and rest target

### Requirement: Exercise verification status

A user-created exercise SHALL carry a verification status. An exercise created with a name only (no category or muscles) is **unverified** ("Ghost") and is immediately selectable for logging. Supplying its category and muscles (and, where required, rest target) via the add/edit screen promotes it to **verified**. Seeded exercises are always considered verified. The verification status SHALL be exposed so other surfaces can count and act on unverified exercises.

#### Scenario: [WO-034] Name-only creation produces an unverified exercise

- **WHEN** an exercise is created with a name and no category or muscles
- **THEN** it is persisted as a user-owned, unverified exercise and is selectable for logging

#### Scenario: [WO-035] Completing metadata promotes an exercise to verified

- **WHEN** the user supplies the missing category and muscles for an unverified exercise and saves
- **THEN** the exercise becomes verified and is no longer counted among unverified exercises

### Requirement: Mid-workout quick-add exercise

During an active session, the exercise picker SHALL offer a quick-add affordance that creates a name-only, unverified exercise and selects it in place, without ending, pausing, or navigating away from the session. The quick-add captures a name only — no metadata form is shown mid-session.

#### Scenario: [WO-036] Quick-add creates and selects an exercise without leaving the session

- **WHEN** the user taps quick-add in the in-session exercise picker and enters a name
- **THEN** a name-only unverified exercise is created, selected for the current exercise, and the session remains active with no metadata form shown

### Requirement: Batch-tagging quick-fix for unverified exercises

The system SHALL provide a quick-fix workspace listing the user's unverified exercises in which the user can select multiple exercises and apply a category and/or one or more muscle tags (each primary or secondary) to all selected at once, promoting them toward verified without a full per-exercise form. The workspace is edit-only — it does not create exercises. Confirming applies the staged tags, and the application SHALL be reversible via a grace-period Undo per `_conv-undo`. When no unverified exercises remain, the workspace SHALL show the empty state per `_conv-empty-states`.

#### Scenario: [WO-041] Apply tags to multiple selected exercises at once

- **WHEN** the user selects several unverified exercises in the quick-fix workspace, stages a category and/or one or more muscle tags, and confirms the application
- **THEN** every staged tag is applied to each selected exercise, and they leave the unverified list once their required metadata is complete

#### Scenario: [WO-042] Undo a batch tag application

- **WHEN** the user taps Undo on the grace-period snackbar shown after a batch tag application (per `_conv-undo`)
- **THEN** the tag application is reverted and the affected exercises return to their prior state

#### Scenario: [WO-043] Nothing-to-verify empty state

- **WHEN** the quick-fix workspace is opened and no unverified exercises remain
- **THEN** the empty state is shown per `_conv-empty-states` and no exercise rows are listed

### Requirement: Exercise library management screen

The system SHALL provide a dedicated screen for managing user-created exercises, reachable from Settings and separate from the in-session picker — the two serve different use-cases (session selection vs. library maintenance). The screen lists all user-created exercises (seeded exercises are read-only and excluded), offers a floating action to add a new exercise, and surfaces edit and delete through the `_conv-gestures` entry-row gestures (swipe-left/long-press edit, swipe-right delete). Its search lists the full library by default and filters it as a term is entered, distinct from the picker's prompt-until-typed behavior.

#### Scenario: [WO-044] Management screen lists user-created exercises

- **WHEN** the user opens the exercise-library management screen
- **THEN** all user-created exercises are listed and seeded exercises are excluded

#### Scenario: [WO-045] Add an exercise from the management screen

- **WHEN** the user taps the floating add action on the management screen
- **THEN** the full add-exercise screen opens for creating a new user exercise

#### Scenario: [WO-046] Edit and delete via row gestures

- **WHEN** the user swipes a row left or long-presses it
- **THEN** the edit screen opens for that exercise
- **AND WHEN** the user swipes a row right
- **THEN** the delete-confirm flow for that exercise opens (per `_conv-gestures`)

#### Scenario: [WO-047] Management search lists all by default and filters

- **WHEN** the management screen is shown with an empty search term
- **THEN** the full list of user-created exercises is shown (no prompt)
- **AND WHEN** a term is entered
- **THEN** the list filters by name, category, and muscle, showing the no-match message when nothing matches
