## Purpose

**ID prefix:** `IT`

Track daily food intake by logging calorie entries with categories, amounts, and descriptions. Provide visual feedback on progress toward daily calorie targets.

## Requirements

### Requirement: View daily intake summary

The system SHALL display a circular progress indicator showing total calories consumed today versus the intake target. The indicator color and shield icon SHALL reflect status: neutral (no data), primary (at or below target), warning (above target but below maximum), error (above maximum).

#### Scenario: [IT-001] No intake tracked

- **WHEN** no intake entries exist for today
- **THEN** the progress shows 0%, neutral color, and an empty shield icon

#### Scenario: [IT-002] Intake within target

- **WHEN** total intake is at or below the target
- **THEN** the progress shows the correct percentage with primary color and a ShieldCheck icon

#### Scenario: [IT-003] Intake above target but below maximum

- **WHEN** total intake exceeds the target but is at or below the maximum
- **THEN** the progress shows warning color and a Shield icon

#### Scenario: [IT-004] Intake above maximum

- **WHEN** total intake exceeds the maximum
- **THEN** the progress shows error color and a ShieldWarning icon

### Requirement: Add intake entry

The system SHALL allow adding an intake entry with category, calorie amount, and optional description. The category SHALL default based on the user's local time of day, picking one of Breakfast (`b`), Lunch (`l`), Dinner (`d`), or Snack (`s`); window boundaries are defined by the scenarios below. The date SHALL be set automatically to today and the time SHALL default to the current time. On save, the new entry SHALL appear in the intake stack and the intake score SHALL update immediately. On cancel, no entry SHALL be created. Field bounds and stepper behavior are defined by scenarios; see `_conv-validation`.

#### Scenario: [IT-005] Create intake from dashboard

- **WHEN** the user clicks the FAB button and fills in the intake form
- **THEN** a new intake entry is created with the specified category, amount, and description and the intake score updates

#### Scenario: [IT-006] Category auto-selection at breakfast time

- **WHEN** the add intake modal opens at 08:00
- **THEN** the category defaults to Breakfast (b)

#### Scenario: [IT-007] Category auto-selection at lunch time

- **WHEN** the add intake modal opens at 13:00
- **THEN** the category defaults to Lunch (l)

#### Scenario: [IT-008] Category auto-selection at dinner time

- **WHEN** the add intake modal opens at 18:00
- **THEN** the category defaults to Dinner (d)

#### Scenario: [IT-009] Category auto-selection outside meal hours

- **WHEN** the add intake modal opens at 02:00
- **THEN** the category defaults to Snack (s)

#### Scenario: [IT-010] Cancel without saving

- **WHEN** the user clicks Cancel in the create modal
- **THEN** no entry is created and the modal closes

#### Scenario: [IT-028] Breakfast window lower bound

- **WHEN** the add intake modal opens at 05:00
- **THEN** the category defaults to Breakfast (b)

#### Scenario: [IT-029] Breakfast/Lunch boundary

- **WHEN** the add intake modal opens at 10:59 (last minute before the lunch window)
- **THEN** the category defaults to Breakfast (b)
- **AND WHEN** the add intake modal opens at 11:00 (first minute of the lunch window)
- **THEN** the category defaults to Lunch (l)

#### Scenario: [IT-030] Lunch/Dinner boundary

- **WHEN** the add intake modal opens at 14:59 (last minute of the lunch window)
- **THEN** the category defaults to Lunch (l)
- **AND WHEN** the add intake modal opens at 15:00 (first minute of the dinner window)
- **THEN** the category defaults to Dinner (d)

#### Scenario: [IT-031] Dinner/Snack boundary

- **WHEN** the add intake modal opens at 20:59 (last minute of the dinner window)
- **THEN** the category defaults to Dinner (d)
- **AND WHEN** the add intake modal opens at 21:00 (first minute outside the dinner window)
- **THEN** the category defaults to Snack (s)

#### Scenario: [IT-032] Snack/Breakfast boundary

- **WHEN** the add intake modal opens at 04:59 (last minute before the breakfast window)
- **THEN** the category defaults to Snack (s)

### Requirement: Edit intake entry

The system SHALL allow editing an existing intake entry's category, amount, and description. Edit SHALL follow `_conv-gestures` and `_conv-modals`.

#### Scenario: [IT-011] Edit via long press

- **WHEN** the user long-presses an intake card on the dashboard
- **THEN** the device vibrates and the edit modal opens with pre-filled entry data

#### Scenario: [IT-012] Save edited entry

- **WHEN** the user modifies fields in the edit modal and clicks Save
- **THEN** the entry updates in the intake stack and the intake score recalculates

### Requirement: Delete intake entry

The system SHALL allow deleting an intake entry following `_conv-modals`. The delete control SHALL only be available from edit mode.

#### Scenario: [IT-013] Delete with confirmation

- **WHEN** the user clicks the trash icon in edit mode and confirms deletion
- **THEN** the entry is removed and the intake list and score update

#### Scenario: [IT-014] Cancel delete

- **WHEN** the user cancels the delete confirmation
- **THEN** the entry remains unchanged and the edit modal stays open

### Requirement: Intake categories

The system SHALL provide five intake categories selectable from the intake form: Breakfast (`b`), Lunch (`l`), Dinner (`d`), Snack (`s`), and Treat (`t`). Exactly one category SHALL be selected at a time.

#### Scenario: [IT-015] Five categories available

- **WHEN** the user opens the intake form
- **THEN** five category buttons are visible including Treat

#### Scenario: [IT-016] Single category selection

- **WHEN** the user selects a category
- **THEN** any previously selected category is deselected and the new one is highlighted

### Requirement: Intake entry swipeable cards

The system SHALL display today's intake entries in a swipeable card stack with slide animation (see `_conv-animations`, `_conv-gestures`). When no entries exist, the system SHALL show a warning alert (see `_conv-empty-states`).

#### Scenario: [IT-017] Navigate between cards

- **WHEN** the user swipes left or right on the intake stack
- **THEN** the displayed card changes to the next or previous entry

#### Scenario: [IT-018] Empty state

- **WHEN** no intake entries exist for today
- **THEN** a warning alert is displayed instead of the card stack

### Requirement: Calorie amount bounds

The system SHALL accept calorie amounts in the closed interval declared by these scenarios. The frontend NumberStepper offers step increments of 1, 5, 10, 100, and 250.

#### Scenario: [IT-019] Amount at lower bound accepted

- **WHEN** an intake amount of 1 kcal is submitted
- **THEN** the entry is created

#### Scenario: [IT-020] Amount at upper bound accepted

- **WHEN** an intake amount of 10,000 kcal is submitted
- **THEN** the entry is created

#### Scenario: [IT-021] Amount below lower bound rejected

- **WHEN** an intake amount of 0 kcal is submitted
- **THEN** the backend returns a validation error

#### Scenario: [IT-022] Amount above upper bound rejected

- **WHEN** an intake amount of 10,001 kcal is submitted
- **THEN** the backend returns a validation error

### Requirement: Description length bounds

The system SHALL accept descriptions up to a maximum length. The input UI SHALL display a live character count.

#### Scenario: [IT-023] Description at maximum length accepted

- **WHEN** a description of exactly 500 characters is submitted
- **THEN** the entry is created

#### Scenario: [IT-024] Description over maximum rejected

- **WHEN** a description of 501 characters is submitted
- **THEN** the backend returns a validation error

### Requirement: Intake entry temporal fields

The system SHALL validate intake date and time at the backend following `_conv-validation`.

#### Scenario: [IT-025] Date format YYYY-MM-DD accepted

- **WHEN** an intake with date `2026-05-25` is submitted
- **THEN** the entry is created

#### Scenario: [IT-026] Invalid date format rejected

- **WHEN** an intake with date `25/05/2026` is submitted
- **THEN** the backend returns a validation error

#### Scenario: [IT-027] Time defaults to now

- **WHEN** an intake is submitted without a time value
- **THEN** the system assigns the current time
