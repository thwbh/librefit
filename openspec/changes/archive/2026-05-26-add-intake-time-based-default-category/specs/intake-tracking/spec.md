## MODIFIED Requirements

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
