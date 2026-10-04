## ADDED Requirements

### Requirement: Import application settings

The JSON import SHALL restore non-secret application settings present in the backup's `app_config` section, validated per `_conv-validation`. Restoring settings SHALL NOT enable AI intake on its own: because the API key is never part of a backup, an imported configuration SHALL report as not configured until the user re-enters the key.

#### Scenario: [IM-012] Non-secret settings restored from backup

- **WHEN** the user imports a backup containing `app_config` settings
- **THEN** the non-secret settings (enabled flag, base URL, model name) are restored

#### Scenario: [IM-013] Imported config stays unconfigured without a key

- **WHEN** a backup with AI intake settings is imported but no key exists in the keystore
- **THEN** the feature reports as not configured until the user re-enters the API key
