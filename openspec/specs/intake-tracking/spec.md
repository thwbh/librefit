## Purpose

Track daily food intake by logging calorie entries with categories, amounts, and descriptions. Provide visual feedback on progress toward daily calorie targets.

## Requirements

### Requirement: View daily intake summary

The system SHALL display a circular progress indicator showing total calories consumed today versus the intake target. The indicator color SHALL reflect status: neutral (no data), primary (at or below target), warning (above target but below maximum), error (above maximum). The system SHALL display a shield icon reflecting the same status.

#### Scenario: No intake tracked

- **WHEN** no intake entries exist for today
- **THEN** the progress shows 0%, neutral color, and an empty shield icon

#### Scenario: Intake within target

- **WHEN** total intake is at or below targetCalories
- **THEN** the progress shows the correct percentage with primary color and a ShieldCheck icon

#### Scenario: Intake above target but below maximum

- **WHEN** total intake exceeds targetCalories but is at or below maximumCalories
- **THEN** the progress shows warning color and a Shield icon

#### Scenario: Intake above maximum

- **WHEN** total intake exceeds maximumCalories
- **THEN** the progress shows error color and a ShieldWarning icon

### Requirement: Add intake entry

The system SHALL allow adding an intake entry with category, calorie amount, and optional description. The category SHALL default based on time of day (Breakfast 5-11, Lunch 12-15, Dinner 16-20, Snack otherwise). The amount input SHALL use a NumberStepper with range 1-10,000 kcal. The description SHALL be limited to 500 characters with a live character count (see `_conv-validation`). The date SHALL be set automatically and the time SHALL default to the current time.

#### Scenario: Create intake from dashboard

- **WHEN** the user clicks the FAB button and fills in the intake form
- **THEN** a new intake entry is created with the specified category, amount, and description
- **THEN** the entry appears in the intake stack and the intake score updates

#### Scenario: Category auto-selection by time

- **WHEN** the add intake modal opens at 8:00
- **THEN** the category defaults to Breakfast (b)

#### Scenario: Category auto-selection at lunch time

- **WHEN** the add intake modal opens at 13:00
- **THEN** the category defaults to Lunch (l)

### Requirement: Edit intake entry

The system SHALL allow editing an existing intake entry's category, amount, and description. Edit SHALL follow `_conv-gestures` (long-press 300ms with haptic) and `_conv-modals` (pre-filled edit modal).

#### Scenario: Edit via long press

- **WHEN** the user long-presses an intake card for 300ms on the dashboard
- **THEN** the device vibrates and the edit modal opens with pre-filled entry data

#### Scenario: Save edited entry

- **WHEN** the user modifies fields in the edit modal and clicks Save
- **THEN** the entry updates in the intake stack and the intake score recalculates

### Requirement: Delete intake entry

The system SHALL allow deleting an intake entry following `_conv-modals` (delete confirmation with read-only preview, only available from edit mode).

#### Scenario: Delete with confirmation

- **WHEN** the user clicks the trash icon in edit mode and confirms deletion
- **THEN** the entry is removed and the intake list and score update

#### Scenario: Cancel delete

- **WHEN** the user cancels the delete confirmation
- **THEN** the entry remains unchanged and the edit modal stays open

### Requirement: Intake entry swipeable cards

The system SHALL display today's intake entries in a swipeable card stack with slide animation (see `_conv-animations`). Each card SHALL show the category icon, calorie amount, description, and time. When no entries exist, the system SHALL show a warning alert (see `_conv-empty-states`).

#### Scenario: Navigate between cards

- **WHEN** the user swipes left or right on the intake stack
- **THEN** the displayed card changes to the next or previous entry

#### Scenario: Empty state

- **WHEN** no intake entries exist for today
- **THEN** a warning alert is displayed instead of the card stack

### Requirement: Backend intake validation

The system SHALL validate all intake entries at the backend following `_conv-validation`: date format YYYY-MM-DD, amount 1-10,000 kcal, category 1-50 characters, description max 500 characters, time format HH:MM:SS with default to current time.

#### Scenario: Valid intake creation

- **WHEN** a valid NewIntake is submitted
- **THEN** the entry is created with an auto-assigned ID and the current time if not specified

#### Scenario: Invalid amount rejected

- **WHEN** an intake with amount 0 or above 10,000 is submitted
- **THEN** the backend returns a validation error
