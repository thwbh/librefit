## Purpose

**ID prefix:** `EMP`

Define consistent empty state conventions for screens and sections with no data to display.

## Requirements

### Requirement: Empty state messaging

The system SHALL display a contextual message when a section has no data. The message SHALL be encouraging and guide the user toward the relevant action.

#### Scenario: [EMP-001] No entries for today

- **WHEN** a tracking section (intake or weight) has no entries for the current date
- **THEN** a prompt or alert is shown guiding the user to add data

#### Scenario: [EMP-002] Insufficient data for analytics

- **WHEN** a visualization requires a minimum data threshold
- **THEN** a "Not enough data yet" message is shown instead of empty or broken charts

### Requirement: Pulsing prompt for stale data

The system SHALL display a pulsing icon when a daily tracking value is missing for the current day, prompting the user to update.

#### Scenario: [EMP-003] Weight not tracked today

- **WHEN** no weight entry exists for today
- **THEN** a pulsing HandTap icon appears prompting the user to update
