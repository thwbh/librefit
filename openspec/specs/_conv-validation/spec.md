## Purpose

Define consistent backend validation conventions applied to all user-submitted data.

## Requirements

### Requirement: Date validation

The system SHALL validate all date fields against the format YYYY-MM-DD. Invalid date formats SHALL be rejected with a validation error.

#### Scenario: Valid date accepted

- **WHEN** a date in YYYY-MM-DD format is submitted
- **THEN** the value is accepted

#### Scenario: Invalid date rejected

- **WHEN** a date in any other format is submitted
- **THEN** the backend returns a validation error

### Requirement: Time validation and defaults

The system SHALL validate all time fields against the format HH:MM:SS. If no time is provided, the system SHALL default to the current time.

#### Scenario: Time defaults to now

- **WHEN** an entry is submitted without a time value
- **THEN** the system assigns the current time

### Requirement: Text length validation

The system SHALL enforce maximum character limits on text fields. The input UI SHALL show a live character count when a limit applies.

#### Scenario: Text within limit

- **WHEN** a text field value is within its maximum length
- **THEN** the value is accepted

#### Scenario: Text exceeds limit

- **WHEN** a text field value exceeds its maximum length
- **THEN** the backend returns a validation error
