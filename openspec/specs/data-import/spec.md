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

### Requirement: Import application settings

The JSON import SHALL restore non-secret application settings present in the backup's `app_config` section, validated per `_conv-validation`. Restoring settings SHALL NOT enable AI intake on its own: because the API key is never part of a backup, an imported configuration SHALL report as not configured until the user re-enters the key.

#### Scenario: [IM-012] Non-secret settings restored from backup

- **WHEN** the user imports a backup containing `app_config` settings
- **THEN** the non-secret settings (enabled flag, base URL, model name) are restored

#### Scenario: [IM-013] Imported config stays unconfigured without a key

- **WHEN** a backup with AI intake settings is imported but no key exists in the keystore
- **THEN** the feature reports as not configured until the user re-enters the API key
