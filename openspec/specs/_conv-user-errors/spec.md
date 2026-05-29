## Purpose

**ID prefix:** `ERR`

Define consistent conventions for surfacing API and validation errors to users, and for logging failures for debugging.

## Requirements

### Requirement: Feedback for user-initiated operations

The system SHALL surface the outcome of every user-initiated API operation through a toast notification. Successful operations SHALL show a success toast; failures SHALL show an error or validation toast.

#### Scenario: [ERR-001] Successful user action

- **WHEN** a user-initiated create, update, or delete operation succeeds
- **THEN** a success toast confirms the action

#### Scenario: [ERR-002] Failed user action

- **WHEN** a user-initiated operation fails
- **THEN** an error toast is shown with a contextual message describing what failed

### Requirement: Silent handling of background operations

The system SHALL suppress error toasts for background data-fetching operations (history loads, dashboard refreshes, progress queries) so that automatic refreshes do not disrupt the user.

#### Scenario: [ERR-003] Background fetch fails

- **WHEN** a background data fetch fails
- **THEN** no toast is shown; the failure is logged
- **AND** the UI gracefully renders an empty or last-known state

### Requirement: Validation errors presented as warnings

The system SHALL present validation errors (including Zod schema violations) as warning toasts. The toast SHALL include the validator-supplied message so the user can correct the input.

#### Scenario: [ERR-004] Input violates validation rule

- **WHEN** a submitted value violates a validation rule
- **THEN** a warning toast is shown containing the validator's message

### Requirement: Error logging

The system SHALL log all errors — including those handled silently — to the Tauri logging system, with the error type and originating context.

#### Scenario: [ERR-005] Any error occurs

- **WHEN** any API call fails
- **THEN** the error is written to the Tauri log with its type and the context label of the calling operation

### Requirement: Toast interaction

Toast notifications SHALL be dismissible by the user via swipe or close button, and SHALL auto-dismiss after a duration appropriate to their severity. Multiple concurrent toasts SHALL stack without overlapping.

#### Scenario: [ERR-006] User dismisses a toast

- **WHEN** the user swipes or clicks the close button on a toast
- **THEN** the toast is removed immediately

#### Scenario: [ERR-007] Multiple toasts active

- **WHEN** more than one toast is active
- **THEN** they stack vertically and remain individually dismissible
