## ADDED Requirements

### Requirement: AI photo capture entry point

The add-intake flow SHALL offer an optional AI photo-capture entry point when the `food-recognition` feature is enabled and configured. The entry point SHALL produce a candidate that pre-fills the existing intake mask; the save path, field bounds, and validation SHALL be unchanged from manual entry. The analysis behavior itself is owned by the `food-recognition` capability.

#### Scenario: [IT-033] Capture button present when feature configured

- **WHEN** the add-intake flow is opened and the `food-recognition` feature is enabled and configured
- **THEN** a photo-capture button is shown alongside manual entry

#### Scenario: [IT-034] Captured candidate pre-fills the mask

- **WHEN** a photo-capture produces a candidate
- **THEN** the intake mask opens pre-filled with the candidate's category, amount, and description
- **AND** the user saves through the same `create_intake` path as manual entry

#### Scenario: [IT-035] Capture button absent when feature off

- **WHEN** the add-intake flow is opened and the `food-recognition` feature is disabled or unconfigured
- **THEN** no capture button is shown and manual entry is unaffected
