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

### Requirement: Inline feedback for invalid input

The system SHALL defer validation feedback until the user has signaled intent to submit, then surface it inline at the offending input and keep it live (visible while invalid, hidden once valid) until the form is dismissed. This applies project-wide to any user-editable form input — text fields, numeric inputs, pickers — regardless of which feature owns the form. The submit affordance remains visually enabled; submission while invalid is blocked client-side without round-tripping to the backend, and the act of attempting reveals the message. The backend remains authoritative; this requirement only governs what the UI does between modal open and submit.

#### Scenario: [VAL-012] Validation message is deferred until first submit attempt, then live

- **WHEN** a modal or form opens with an invalid initial value (e.g. an empty required field, or a numeric default outside its declared range)
- **THEN** no validation message is shown to the user yet
- **AND WHEN** the user clicks Save / Confirm while the value is still invalid
- **THEN** the validation message appears inline at the offending input
- **AND WHEN** the user subsequently brings the value into a valid state
- **THEN** the message disappears
- **AND WHEN** the user later makes the value invalid again without dismissing the modal
- **THEN** the message reappears live (no second attempt needed)

#### Scenario: [VAL-013] Submit attempt with invalid input is blocked client-side and gives feedback

- **WHEN** the user clicks Save / Confirm while any required field is invalid
- **THEN** the underlying save operation is NOT invoked
- **AND** the Save / Confirm button shakes briefly to draw attention to the form
- **AND** the validation message becomes visible (per [VAL-012])
- **AND** the user's typed value is preserved (no silent snap to a bound)
- **AND WHEN** the user clicks Save again while still invalid without otherwise changing the value
- **THEN** the button does not re-shake (one shake per "still invalid" period; a value transitioning to valid then back to invalid allows the next attempt to shake again)

### Requirement: Frontend validation uses generated schemas

The system SHALL drive frontend validation from the Zod schemas in `$lib/api/gen/types`. Those schemas are generated by `tauri-typegen` from the same Rust type definitions that govern backend validation, so the message returned by `safeParse(...)` is identical to what the backend would emit on rejection. Hand-rolled frontend predicates SHALL NOT duplicate bounds or messages already expressed in the generated schemas. The backend remains authoritative per [VAL-008] / [VAL-011]; this requirement governs how the UI arrives at its preflight check before submit.

#### Scenario: [VAL-014] Frontend validation message matches the backend message

- **WHEN** the frontend surfaces a client-side validation error
- **THEN** the displayed message is sourced from the generated schema's `safeParse(...).error.issues[0].message`
- **AND** the same input submitted to the backend would produce the same message string
