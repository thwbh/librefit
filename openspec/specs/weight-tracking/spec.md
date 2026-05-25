## Purpose

Track body weight over time by logging daily measurements. Display current weight with trend indicators and progress toward weight targets.

## Requirements

### Requirement: View current weight

The system SHALL display the latest weight measurement with a trend icon (TrendUp if gaining, TrendDown if losing), the last update date, and progress percentage against the weight target. If no weight has been tracked today, the system SHALL show a pulsing prompt (see `_conv-empty-states`).

#### Scenario: Weight tracked today

- **WHEN** a weight entry exists for today
- **THEN** the weight score displays the value with trend, date, and progress percentage

#### Scenario: Weight stale

- **WHEN** no weight entry exists for today
- **THEN** a pulsing HandTap icon appears prompting the user to update

### Requirement: Log weight

The system SHALL allow logging weight via a NumberStepper (range 0.5-330 kg). The date SHALL be set to the context date (today on dashboard, selected date on history). If a weight entry already exists for the date, the system SHALL open the existing entry for editing following `_conv-modals` (pre-filled edit modal).

#### Scenario: Create new weight entry

- **WHEN** the user sets a weight value and clicks Save with no existing entry for the date
- **THEN** a new weight tracker entry is created and the weight score updates

#### Scenario: Edit existing weight entry

- **WHEN** a weight entry already exists for the selected date
- **THEN** the edit modal opens with the current value pre-filled

### Requirement: Backend weight validation

The system SHALL validate weight entries at the backend following `_conv-validation`: date format YYYY-MM-DD, weight 30-330 kg, time format HH:MM:SS with default to current time.

#### Scenario: Valid weight entry

- **WHEN** a valid NewWeightTracker is submitted
- **THEN** the entry is created with an auto-assigned ID

#### Scenario: Out-of-range weight rejected

- **WHEN** a weight below 30 kg or above 330 kg is submitted
- **THEN** the backend returns a validation error
