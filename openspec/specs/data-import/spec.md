## Purpose

**ID prefix:** `IM`

Restore or transfer data by importing a JSON backup document with validation and progress tracking.

## Requirements

### Requirement: Import data from JSON backup

The system SHALL support importing a JSON backup document produced by the JSON export. The system SHALL ingest the whole document and restore every user-data table it contains in a single operation, without requiring the user to select a target table. The system SHALL validate each entry against its table's schema (see `_conv-validation`); invalid entries SHALL be skipped but counted as failures. The import process SHALL follow `_conv-progress-stages`. Imports SHALL append to existing data — no rows are deleted and no automatic deduplication is performed — and the system SHALL warn the user of this before importing.

#### Scenario: [IM-006] Import a JSON backup document

- **WHEN** the user picks a valid JSON backup file and clicks Import
- **THEN** entries from every supported table in the document are validated and appended, with progress shown and per-table imported counts reported on completion

#### Scenario: [IM-007] Partial import with invalid entries

- **WHEN** some entries in the document fail validation
- **THEN** valid entries are imported, invalid entries are skipped, and the summary shows both the successful and failed counts

#### Scenario: [IM-008] Import cancellation

- **WHEN** the user clicks Cancel during an active import
- **THEN** the import operation stops

#### Scenario: [IM-009] File not selected

- **WHEN** no file has been selected
- **THEN** the Import button is disabled

#### Scenario: [IM-010] Lookup data not restored

- **WHEN** a JSON backup document contains a `foodCategory` array
- **THEN** the import does not write food categories back (they are seed data the app ships) and reports no imported count for that table

#### Scenario: [IM-011] Append semantics warning

- **WHEN** the user is about to import a JSON backup
- **THEN** the system warns that importing appends to existing data and performs no deduplication, so re-importing a backup duplicates its entries
