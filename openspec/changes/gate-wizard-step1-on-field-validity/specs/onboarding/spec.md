## MODIFIED Requirements

### Requirement: Setup wizard body information (Step 1)

The system SHALL collect the user's nickname, biological sex, age, height, weight, and an optional avatar. Biological sex SHALL have no default for first-time users; on wizard re-run, the previously-saved sex SHALL be preloaded. If no avatar is selected, the system SHALL use the user's name as the avatar seed. The wizard SHALL NOT advance from Step 1 until all required fields satisfy the backend validator. Per-field validity rules and bounds are owned by the backend struct annotations (`validator` crate) and surfaced to the client via the generated Zod schemas; see `_conv-validation` for the authoritative-bound principle.

#### Scenario: [OB-005] Valid body information advances wizard

- **WHEN** the user fills in all required fields with valid values and clicks Next
- **THEN** the wizard advances to Step 2

#### Scenario: [OB-006] Sex must be explicitly selected to advance

- **WHEN** the user has not selected a biological sex and clicks Next
- **THEN** the wizard does not advance from Step 1
- **AND WHEN** the user selects Male or Female and all other required fields are valid and clicks Next
- **THEN** the wizard advances to Step 2

#### Scenario: [OB-007] Avatar defaults to name seed

- **WHEN** the user does not select an avatar
- **THEN** the avatar is generated using the user's nickname as the seed

#### Scenario: [OB-018] Nickname shorter than minimum prevents advance

- **WHEN** the nickname is shorter than the backend-declared minimum length (including empty) and the user clicks Next
- **THEN** the wizard does not advance from Step 1

#### Scenario: [OB-019] Nickname within bounds permits advance

- **WHEN** the nickname length is within the backend-declared bounds
- **AND** all other required fields are valid (including sex selected)
- **AND** the user clicks Next
- **THEN** the wizard advances to Step 2
