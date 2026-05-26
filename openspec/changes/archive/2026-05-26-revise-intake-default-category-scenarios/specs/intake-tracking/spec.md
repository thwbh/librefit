## MODIFIED Requirements

### Requirement: Add intake entry

The system SHALL allow adding an intake entry with category, calorie amount, and optional description. The category SHALL default based on the user's local time of day, picking one of Breakfast (`b`), Lunch (`l`), Dinner (`d`), or Snack (`s`); window boundaries are defined by the scenarios below. The date SHALL be set automatically to today and the time SHALL default to the current time. On save, the new entry SHALL appear in the intake stack and the intake score SHALL update immediately. On cancel, no entry SHALL be created. Field bounds and stepper behavior are defined by scenarios; see `_conv-validation`.

#### Scenario: [IT-005] Create intake from dashboard

- **WHEN** the user clicks the FAB button and fills in the intake form
- **THEN** a new intake entry is created with the specified category, amount, and description and the intake score updates

#### Scenario: [IT-006] Breakfast window (05:00 – 10:59)

- **WHEN** the add intake modal opens at 05:00 (window start)
- **THEN** the category defaults to Breakfast (b)
- **AND WHEN** the add intake modal opens at 10:59 (window end)
- **THEN** the category defaults to Breakfast (b)

#### Scenario: [IT-007] Lunch window (11:00 – 14:59)

- **WHEN** the add intake modal opens at 11:00 (window start)
- **THEN** the category defaults to Lunch (l)
- **AND WHEN** the add intake modal opens at 14:59 (window end)
- **THEN** the category defaults to Lunch (l)

#### Scenario: [IT-008] Dinner window (15:00 – 20:59)

- **WHEN** the add intake modal opens at 15:00 (window start)
- **THEN** the category defaults to Dinner (d)
- **AND WHEN** the add intake modal opens at 20:59 (window end)
- **THEN** the category defaults to Dinner (d)

#### Scenario: [IT-009] Snack window (all hours outside the meal windows)

- **WHEN** the add intake modal opens at 21:00 (first hour after the dinner window ends)
- **THEN** the category defaults to Snack (s)
- **AND WHEN** the add intake modal opens at 04:59 (last hour before the breakfast window starts)
- **THEN** the category defaults to Snack (s)
- **AND WHEN** the add intake modal opens at 02:00 (middle of the snack window)
- **THEN** the category defaults to Snack (s)

#### Scenario: [IT-010] Cancel without saving

- **WHEN** the user clicks Cancel in the create modal
- **THEN** no entry is created and the modal closes

<!--
Note: scenarios IT-028..IT-032 are removed from the `Add intake entry` requirement
by their absence from the MODIFIED block above (the schema replaces the requirement
block in full). Their IDs are burned per the `_conv-test-traceability` no-reuse rule.
No requirement-level REMOVED entry is needed.
-->
