## Purpose

**ID prefix:** `VAL`

Define consistent backend validation conventions applied to all user-submitted data. Concrete per-field bounds live in each owning feature spec; this convention defines the rule shapes those specs draw on.

## Requirements

### Requirement: Date validation

The system SHALL validate all date fields against the format YYYY-MM-DD. Invalid date formats SHALL be rejected with a validation error.

#### Scenario: [VAL-001] Valid date accepted

- **WHEN** a date in YYYY-MM-DD format is submitted
- **THEN** the value is accepted

#### Scenario: [VAL-002] Invalid date rejected

- **WHEN** a date in any other format is submitted
- **THEN** the backend returns a validation error

### Requirement: Time validation and defaults

The system SHALL validate all time fields against the format HH:MM:SS. If no time is provided, the system SHALL default to the current time.

#### Scenario: [VAL-003] Valid time accepted

- **WHEN** a time in HH:MM:SS format is submitted
- **THEN** the value is accepted

#### Scenario: [VAL-004] Time defaults to now

- **WHEN** an entry is submitted without a time value
- **THEN** the system assigns the current time

### Requirement: Text length validation

The system SHALL enforce maximum character limits on text fields. The input UI SHALL show a live character count when a limit applies. Concrete length bounds are declared by the owning feature spec.

#### Scenario: [VAL-005] Text within declared limit

- **WHEN** a text field value is within the limit declared by its owning spec
- **THEN** the value is accepted

#### Scenario: [VAL-006] Text exceeds declared limit

- **WHEN** a text field value exceeds the limit declared by its owning spec
- **THEN** the backend returns a validation error

### Requirement: Numeric range validation

The system SHALL enforce numeric range constraints declared by feature specs at the backend. The frontend UI MAY constrain a tighter range than the backend for ergonomic reasons; in that case, the backend SHALL still reject any value outside its own range.

#### Scenario: [VAL-007] Backend rejects out-of-range numeric value

- **WHEN** a numeric field value is submitted outside the field's declared backend range
- **THEN** the backend returns a validation error citing the violated bound

#### Scenario: [VAL-008] Tighter UI range does not override backend

- **WHEN** the UI permits a value within its own range but outside the backend range
- **THEN** the value reaches the backend on submit and is rejected with a validation error

### Requirement: Enum value validation

The system SHALL enforce discrete-set (enum) constraints declared by feature specs at the backend. Submitting a value outside the allowed set SHALL be rejected with a validation error.

#### Scenario: [VAL-009] Value within allowed set accepted

- **WHEN** an enum-constrained field value is in the allowed set
- **THEN** the value is accepted

#### Scenario: [VAL-010] Value outside allowed set rejected

- **WHEN** an enum-constrained field value is outside the allowed set
- **THEN** the backend returns a validation error

### Requirement: Authoritative-bound principle

When a feature spec declares both a frontend UI constraint and a backend validation rule for the same field, the backend rule SHALL be the authoritative contract. The UI constraint SHALL be treated as an ergonomic affordance, not a security boundary.

#### Scenario: [VAL-011] Backend rule binds clients and tests

- **WHEN** a feature spec declares range or length for a field
- **THEN** the backend rule referenced is the contract clients and tests are bound to
