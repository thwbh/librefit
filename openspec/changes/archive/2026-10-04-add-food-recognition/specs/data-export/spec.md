## ADDED Requirements

### Requirement: Export application settings

The JSON export SHALL include non-secret application settings stored in `app_config`. Secrets SHALL NOT be exported: the AI intake API key, which lives only in the OS keystore, SHALL never appear in any export.

#### Scenario: [EX-009] Non-secret settings included in export

- **WHEN** the user exports data in JSON format with AI intake configured
- **THEN** the export contains the non-secret `app_config` settings (enabled flag, base URL, model name)

#### Scenario: [EX-010] API key never exported

- **WHEN** the user exports data in any format with an AI intake key stored
- **THEN** the API key is absent from the export
