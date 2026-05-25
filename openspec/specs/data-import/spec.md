## Purpose

Restore or transfer data by importing intake or weight entries from CSV files with validation and progress tracking.

## Requirements

### Requirement: Import data from CSV

The system SHALL support importing intake or weight data from CSV files. The system SHALL validate each row against the target table's schema (see `_conv-validation`). Invalid rows SHALL be skipped but counted as failures. The import process SHALL follow `_conv-progress-stages` (streamed progress through stages: Initializing, ValidatingFile, ParsingData, ValidatingEntries, InsertingData, Complete). The system SHALL warn that no automatic deduplication is performed. Cancellation SHALL follow `_conv-progress-stages`.

#### Scenario: Import intake data

- **WHEN** the user selects Intake target, picks a valid CSV file, and clicks Import
- **THEN** rows are validated and inserted into the intake table with progress shown

#### Scenario: Import weight data

- **WHEN** the user selects Weight target, picks a valid CSV file, and clicks Import
- **THEN** rows are validated (date YYYY-MM-DD, weight 30-330 kg) and inserted into weight_tracker

#### Scenario: Partial import with failures

- **WHEN** some rows in the CSV fail validation
- **THEN** valid rows are imported, invalid rows are skipped, and the summary shows both counts

#### Scenario: Import cancellation

- **WHEN** the user clicks Cancel during an active import
- **THEN** the import operation stops via cancel_import

#### Scenario: File not selected

- **WHEN** no file has been selected
- **THEN** the Import button is disabled
