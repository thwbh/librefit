## ADDED Requirements

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
