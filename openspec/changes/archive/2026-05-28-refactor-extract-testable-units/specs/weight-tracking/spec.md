## MODIFIED Requirements

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
