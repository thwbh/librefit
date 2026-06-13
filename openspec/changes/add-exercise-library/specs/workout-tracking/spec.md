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

## ADDED Requirements

### Requirement: Create, edit, and delete user exercises

The system SHALL allow a user to add an exercise to their library, edit a user-created exercise's name, category, muscles (each primary or secondary), and default rest target, and delete a user-created exercise. User exercises are owned by the user and visually distinguished from seeded exercises in the picker and search. Add and edit follow `_conv-modals` and `_conv-validation`; the full add/edit screen is the path that supplies complete metadata. Deleting an exercise that is referenced by a logged set SHALL be handled per `_conv-user-errors` rather than silently orphaning data.

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

The system SHALL provide a quick-fix workspace listing the user's unverified exercises in which the user can select multiple exercises and apply a category or muscle tag to all selected at once, promoting them toward verified without a full per-exercise form. A tag application SHALL be reversible via an Undo affordance per `_conv-user-errors`. When no unverified exercises remain, the workspace SHALL show the empty state per `_conv-empty-states`.

#### Scenario: [WO-041] Apply a tag to multiple selected exercises at once

- **WHEN** the user selects several unverified exercises in the quick-fix workspace and taps a category or muscle tag
- **THEN** that tag is applied to every selected exercise and they leave the unverified list once their required metadata is complete

#### Scenario: [WO-042] Undo a batch tag application

- **WHEN** the user taps Undo on the snackbar shown after a batch tag application
- **THEN** the tag application is reverted and the affected exercises return to their prior state

#### Scenario: [WO-043] Nothing-to-verify empty state

- **WHEN** the quick-fix workspace is opened and no unverified exercises remain
- **THEN** the empty state is shown per `_conv-empty-states` and no exercise rows are listed
