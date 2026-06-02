## Purpose

**ID prefix:** `IM`

Restore or transfer data by importing intake or weight entries from CSV files with validation and progress tracking.

## Requirements

### Requirement: Import data from CSV

The system SHALL support importing intake or weight data from CSV files. The system SHALL validate each row against the target table's schema (see `_conv-validation`). Invalid rows SHALL be skipped but counted as failures. The import process SHALL follow `_conv-progress-stages`. The system SHALL warn that no automatic deduplication is performed.

#### Scenario: [IM-001] Import intake data

- **WHEN** the user selects Intake target, picks a valid CSV file, and clicks Import
- **THEN** rows are validated and inserted into the intake table with progress shown

#### Scenario: [IM-002] Import weight data

- **WHEN** the user selects Weight target, picks a valid CSV file, and clicks Import
- **THEN** rows are validated and inserted into the weight tracker with progress shown

#### Scenario: [IM-003] Partial import with failures

- **WHEN** some rows in the CSV fail validation
- **THEN** valid rows are imported, invalid rows are skipped, and the summary shows both counts

#### Scenario: [IM-004] Import cancellation

- **WHEN** the user clicks Cancel during an active import
- **THEN** the import operation stops

#### Scenario: [IM-005] File not selected

- **WHEN** no file has been selected
- **THEN** the Import button is disabled
