## Purpose

Export all user data for backup or transfer, supporting CSV and raw SQLite formats with real-time progress tracking.

## Requirements

### Requirement: Export data

The system SHALL support exporting all user data in CSV format (zipped CSV files) or Raw format (SQLite database file). The export process SHALL follow `_conv-progress-stages` (streamed real-time progress through stages: Initializing, AnalyzingDatabase, CreatingBackup, ReadingFile, Finalizing, Complete). The system SHALL open a file save dialog for the user to choose the destination. Cancellation SHALL follow `_conv-progress-stages`.

#### Scenario: CSV export

- **WHEN** the user selects CSV format and clicks Start Export
- **THEN** the system exports all data as zipped CSV files with real-time progress

#### Scenario: Raw SQLite export

- **WHEN** the user selects Raw format and clicks Start Export
- **THEN** the system exports a valid SQLite database file containing all tables

#### Scenario: Export cancellation

- **WHEN** the user clicks Cancel during an active export
- **THEN** the export operation stops via cancel_export

#### Scenario: Export completion

- **WHEN** the export finishes successfully
- **THEN** a success message with the saved file path is displayed and the Close button becomes enabled
