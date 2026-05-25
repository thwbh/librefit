## Purpose

**ID prefix:** `EX`

Export all user data for backup or transfer, supporting CSV and raw SQLite formats with real-time progress tracking.

## Requirements

### Requirement: Export data

The system SHALL support exporting all user data in CSV format (zipped CSV files) or Raw format (SQLite database file). The export process SHALL follow `_conv-progress-stages`. The system SHALL open a file save dialog for the user to choose the destination.

#### Scenario: [EX-001] CSV export

- **WHEN** the user selects CSV format and clicks Start Export
- **THEN** the system exports all data as zipped CSV files with real-time progress

#### Scenario: [EX-002] Raw SQLite export

- **WHEN** the user selects Raw format and clicks Start Export
- **THEN** the system exports a valid SQLite database file containing all tables

#### Scenario: [EX-003] Export cancellation

- **WHEN** the user clicks Cancel during an active export
- **THEN** the export operation stops

#### Scenario: [EX-004] Export completion

- **WHEN** the export finishes successfully
- **THEN** a success message with the saved file path is displayed and the Close button becomes enabled

### Requirement: Raw SQLite export completeness

The Raw SQLite export SHALL produce a valid SQLite database file containing all application tables.

#### Scenario: [EX-005] Raw export contains all tables

- **WHEN** the Raw SQLite export completes
- **THEN** the exported file is a valid SQLite database containing the tables `libre_user`, `body_data`, `intake`, `intake_target`, `weight_tracker`, `weight_target`, and `food_category`

### Requirement: Cancel and Close button availability

The Cancel button SHALL be available during an active export. The Close button SHALL be disabled until the export reaches a terminal state.

#### Scenario: [EX-006] Cancel during export

- **WHEN** an export is in progress and the user clicks Cancel
- **THEN** the export operation stops and the modal moves to a cancelled state

#### Scenario: [EX-007] Close enabled after completion

- **WHEN** the export reaches the Complete stage
- **THEN** the Close button becomes enabled
