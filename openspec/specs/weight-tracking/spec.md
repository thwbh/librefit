## Purpose

**ID prefix:** `WT`

Track body weight over time by logging daily measurements. Display current weight with trend indicators and progress toward weight targets.

## Requirements

### Requirement: View current weight

The system SHALL display the latest weight measurement with a trend icon, the last update date, and progress percentage against the weight target. If no weight has been tracked today, the system SHALL show a pulsing prompt (see `_conv-empty-states`).

#### Scenario: [WT-001] Weight tracked today

- **WHEN** a weight entry exists for today
- **THEN** the weight score displays the value with trend, date, and progress percentage

#### Scenario: [WT-002] Weight stale

- **WHEN** no weight entry exists for today
- **THEN** a pulsing HandTap icon appears prompting the user to update

### Requirement: Log weight

The system SHALL allow logging weight via a NumberStepper. The date SHALL be set to the context date (today on dashboard, selected date on history). If a weight entry already exists for the date, the system SHALL open the existing entry for editing following `_conv-modals`.

#### Scenario: [WT-003] Create new weight entry

- **WHEN** the user sets a weight value and clicks Save with no existing entry for the date
- **THEN** a new weight tracker entry is created and the weight score updates

#### Scenario: [WT-004] Edit existing weight entry

- **WHEN** a weight entry already exists for the selected date
- **THEN** the edit modal opens with the current value pre-filled

### Requirement: Weight value bounds

The system SHALL accept weight values within the closed interval declared by these scenarios. The frontend weight modal surfaces a validation message and disables Save while the typed value is outside the bound (per `_conv-validation` [VAL-012] / [VAL-013]); the backend remains authoritative.

#### Scenario: [WT-005] Weight at backend lower bound accepted

- **WHEN** a weight of 30.0 kg is submitted
- **THEN** the entry is created

#### Scenario: [WT-006] Weight at upper bound accepted

- **WHEN** a weight of 330.0 kg is submitted
- **THEN** the entry is created

#### Scenario: [WT-007] Weight below backend lower bound rejected

- **WHEN** a weight of 29.9 kg is submitted
- **THEN** the backend returns a validation error

#### Scenario: [WT-008] Weight above upper bound rejected

- **WHEN** a weight of 330.1 kg is submitted
- **THEN** the backend returns a validation error

#### Scenario: [WT-009] UI prevents submission of out-of-bounds weight

- **WHEN** the user types 25 kg into the weight input
- **THEN** a validation message describing the allowed range is shown inline at the input
- **AND** Save is disabled until the value is brought into range
- **AND** the typed value is preserved (the input does not silently snap to a bound)

### Requirement: Weight entry temporal fields

The system SHALL validate weight date and time at the backend following `_conv-validation`.

#### Scenario: [WT-010] Date format YYYY-MM-DD accepted

- **WHEN** a weight with date `2026-05-25` is submitted
- **THEN** the entry is created

#### Scenario: [WT-011] Invalid date format rejected

- **WHEN** a weight with date `2026/05/25` is submitted
- **THEN** the backend returns a validation error

#### Scenario: [WT-012] Time defaults to now

- **WHEN** a weight entry is submitted without a time value
- **THEN** the system assigns the current time
