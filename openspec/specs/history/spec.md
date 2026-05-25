## Purpose

Browse and manage historical intake and weight entries by date, with week-based navigation and swipe gestures.

## Requirements

### Requirement: Browse weekly history

The system SHALL display history in 7-day increments with a date selector showing day pills. The most recent date SHALL be selected by default. The system SHALL allow navigating weeks via left/right caret buttons or by swiping the date selector. The right caret SHALL be hidden when no future data exists.

#### Scenario: Load current week

- **WHEN** the user navigates to the history page
- **THEN** the current week's data loads via getTrackerHistory and the most recent date is selected

#### Scenario: Navigate to previous week

- **WHEN** the user clicks the left caret or swipes the date selector right
- **THEN** the previous week's data loads and the appropriate date is selected

#### Scenario: No future data

- **WHEN** the selected week contains the most recent data
- **THEN** the right caret is hidden

### Requirement: View day detail

The system SHALL display the selected day's intake score, category badges, intake entry list, and weight section. Swiping the content area left/right SHALL navigate between days with slide animation (see `_conv-animations`) and load adjacent weeks at boundaries.

#### Scenario: Select a date

- **WHEN** the user clicks a date pill
- **THEN** the content area updates with that date's intake and weight data

#### Scenario: Swipe between days

- **WHEN** the user swipes the content area left
- **THEN** the next day is selected with a slide animation

#### Scenario: Swipe across week boundary

- **WHEN** the user swipes left on the last day of the current week and more data exists
- **THEN** the next week loads and the first day is selected

### Requirement: Historical intake CRUD

The system SHALL allow creating, editing, and deleting intake entries for any historical date. Creating an entry on a historical date SHALL set the added field to that date, not today. Edit and delete SHALL follow `_conv-gestures` (long-press 300ms with haptic, swipe left to edit, swipe right to delete) and `_conv-modals` (pre-filled edit, delete confirmation with read-only preview).

#### Scenario: Add intake on historical date

- **WHEN** the user adds an intake entry on a selected historical date
- **THEN** the entry is created with the historical date as the added field

#### Scenario: Edit via swipe

- **WHEN** the user swipes left on an intake entry in the history list
- **THEN** the edit modal opens with the entry's data

#### Scenario: Delete via swipe

- **WHEN** the user swipes right on an intake entry in the history list
- **THEN** a delete confirmation dialog appears

### Requirement: Historical weight tracking

The system SHALL display the weight entry for the selected date if it exists, or a "No weight tracked" state with a "Tap to update" prompt (see `_conv-empty-states`). Clicking the weight area SHALL open the weight modal for create or edit following `_conv-modals`.

#### Scenario: Weight exists for date

- **WHEN** a weight entry exists for the selected date
- **THEN** the weight value is displayed with a swipe-to-edit option

#### Scenario: No weight for date

- **WHEN** no weight entry exists for the selected date
- **THEN** "No weight tracked" is shown with a "Tap to update" prompt
