# food-recognition Specification

## Purpose

**ID prefix:** `FR`

Opt-in, bring-your-own-key AI assistance that turns a meal photo into a single confirmable intake candidate. Covers configuration and secret storage, image capture and privacy hygiene, the backend-only provider call, structured-output parsing, and deterministic mapping to a `NewIntake`. The feature never auto-saves and never replaces manual entry — it only pre-fills the existing intake mask.

## Requirements

### Requirement: Enable and configure AI intake

The system SHALL provide an AI intake configuration surface where the feature can be enabled or disabled and a provider can be configured. The feature SHALL default to disabled. Non-secret configuration (enabled flag, base URL, model name) SHALL persist in the local SQLite `app_config` store; the API key SHALL NOT be stored there. The feature SHALL be considered configured only when a base URL, a model name, and an API key are all present.

#### Scenario: [FR-001] Feature disabled by default

- **WHEN** a user opens the AI intake settings for the first time
- **THEN** the feature is disabled and no provider is configured

#### Scenario: [FR-002] Non-secret config persists in app_config

- **WHEN** the user enters a base URL and model name and saves
- **THEN** the base URL and model name are written to the `app_config` store
- **AND** the values are present after an app restart

#### Scenario: [FR-003] Feature reported unconfigured until all fields present

- **WHEN** a base URL and model are set but no API key has been stored
- **THEN** the feature reports as not configured

### Requirement: Test connection

The system SHALL offer a "test connection" action that performs a single low-cost provider call using the current configuration and reports the outcome. The test SHALL distinguish success from the failure classes defined in `_conv-user-errors`.

#### Scenario: [FR-004] Successful test connection

- **WHEN** the user runs the test with a valid base URL, model, and key
- **THEN** the system reports success

#### Scenario: [FR-005] Test connection with invalid key

- **WHEN** the test call returns an authentication error
- **THEN** the system reports a bad-key error distinct from a network error

#### Scenario: [FR-006] Test connection unreachable

- **WHEN** the test call cannot reach the provider before timeout
- **THEN** the system reports a network/timeout error distinct from a bad-key error

### Requirement: Secret and privacy handling

The API key SHALL be stored only in the OS keystore and SHALL never be written to the SQLite database, serialized to the webview, or included in any export. All provider network calls SHALL originate in the Rust backend; the webview SHALL only transport image bytes and SHALL never hold the key or the provider endpoint. Image EXIF metadata SHALL be stripped before upload, the photo SHALL never be persisted to disk, and logs SHALL contain only call status and timing — never image bytes or response content.

#### Scenario: [FR-007] Key stored in keystore, not the database

- **WHEN** the user saves an API key
- **THEN** the key is written to the OS keystore
- **AND** the key does not appear in the `app_config` store or the database

#### Scenario: [FR-008] Key never reaches the webview

- **WHEN** an analysis call is made
- **THEN** the key is read in the backend and used there
- **AND** the key is never sent to the webview

#### Scenario: [FR-009] EXIF stripped and photo not persisted

- **WHEN** an image is submitted for analysis
- **THEN** its EXIF metadata is removed before the provider call
- **AND** the image is held in memory only and never written to disk

#### Scenario: [FR-010] Logs exclude image and response content

- **WHEN** an analysis call completes or fails
- **THEN** logs record status and timing only
- **AND** logs contain no image bytes and no response content

### Requirement: Capture availability and degradation

The capture entry point SHALL be available only when the feature is enabled and configured. It SHALL be hidden or disabled when the feature is off, unconfigured, or the device is offline. When triggered, the capture entry point SHALL open the device camera directly through the native capture path rather than relying on the WebView file-chooser capture hint; no in-app camera/gallery chooser is shown. Where the camera is unavailable, capture SHALL fall back to the file picker. Manual entry SHALL remain available in all cases.

#### Scenario: [FR-011] Capture hidden when feature off

- **WHEN** the feature is disabled
- **THEN** the capture button is not shown and manual entry is unaffected

#### Scenario: [FR-012] Capture unavailable when unconfigured

- **WHEN** the feature is enabled but not fully configured
- **THEN** the capture button is hidden or disabled

#### Scenario: [FR-013] Capture unavailable offline

- **WHEN** the device is offline
- **THEN** the capture button is disabled and manual entry remains available

#### Scenario: [FR-031] Capture opens the device camera directly

- **WHEN** the user triggers capture while the feature is available and consent is granted
- **THEN** the device camera is opened directly through the native capture path
- **AND** no in-app camera/gallery chooser is shown

#### Scenario: [FR-032] Captured image is analyzed and not persisted

- **WHEN** the camera returns a photo
- **THEN** the captured image bytes are passed to analysis without being persisted to disk

#### Scenario: [FR-033] Camera unavailable falls back to the file picker

- **WHEN** the device camera is unavailable (e.g. desktop)
- **THEN** capture falls back to the file picker and the selected image bytes are passed to analysis

### Requirement: One-time consent before first upload

Before the first image is ever sent to a provider, the system SHALL show a consent dialog (per `_conv-modals`) stating what data is sent and to which endpoint. No image SHALL be uploaded until consent is given. Once granted, consent SHALL be remembered and not shown again.

#### Scenario: [FR-014] First capture prompts for consent

- **WHEN** the user triggers capture for the first time
- **THEN** a consent dialog describing the data and destination is shown before any upload

#### Scenario: [FR-015] Declining consent aborts the upload

- **WHEN** the user declines the consent dialog
- **THEN** no image is uploaded and the user returns to manual entry

#### Scenario: [FR-016] Consent remembered

- **WHEN** the user has previously granted consent
- **THEN** subsequent captures proceed without showing the dialog again

### Requirement: Structured analysis with validated parsing

The analysis call SHALL request a structured response conforming to a fixed schema of detected items, each with a name and a calorie estimate. The response SHALL be validated in the backend; on a parse failure the system SHALL retry exactly once before surfacing an error. The category SHALL NOT be taken from the model response.

#### Scenario: [FR-017] Valid response parsed

- **WHEN** the provider returns a schema-conformant response
- **THEN** the detected items are parsed into the internal analysis result

#### Scenario: [FR-018] Single retry on parse failure

- **WHEN** the first response fails schema validation
- **THEN** the system retries the call exactly once
- **AND** a conformant retry response is parsed successfully

#### Scenario: [FR-019] Retry exhausted surfaces an error

- **WHEN** both the initial call and the retry fail validation
- **THEN** the system surfaces an error nudging the user to manual entry

### Requirement: Deterministic mapping to a single intake candidate

The system SHALL map an analysis result into exactly one `NewIntake` candidate: multiple detected items SHALL be collapsed into a single entry whose description concatenates the item names and whose amount sums the per-item calorie estimates. The category SHALL be resolved locally against `food_category`. The candidate SHALL carry a confidence level derived from the analysis confidence, and a low-confidence result SHALL additionally be flagged to the user. The candidate amount SHALL pass through the existing `create_intake` 1–10,000 kcal validation unchanged.

#### Scenario: [FR-020] Single item maps to one candidate

- **WHEN** the analysis returns one item
- **THEN** one candidate is produced with that item's name and calorie estimate

#### Scenario: [FR-021] Multiple items collapse into one entry

- **WHEN** the analysis returns several items
- **THEN** one candidate is produced whose description concatenates the names and whose amount is the sum of the estimates

#### Scenario: [FR-022] Category resolved locally

- **WHEN** a candidate is produced
- **THEN** its category is resolved locally against `food_category` and not taken from the model

#### Scenario: [FR-023] Low-confidence result flagged

- **WHEN** the analysis reports low confidence
- **THEN** the candidate is surfaced with a warning prompting extra scrutiny

#### Scenario: [FR-024] Out-of-range sum rejected on save

- **WHEN** the summed amount exceeds 10,000 kcal and the user attempts to save
- **THEN** the existing `create_intake` validation rejects it

#### Scenario: [FR-034] Candidate carries a confidence level

- **WHEN** a candidate is produced from an analysis result
- **THEN** the candidate includes the numeric analysis confidence
- **AND** a confidence level of low, medium, or high is derivable from it

#### Scenario: [FR-035] Confidence level agrees with the low-confidence flag

- **WHEN** the analysis confidence is below the low-confidence threshold
- **THEN** the derived confidence level is low
- **AND** the low-confidence warning is shown

### Requirement: Confirm-first save

A produced candidate SHALL pre-fill the existing intake mask for review. While analysis is in flight the intake mask SHALL show a loading state and SHALL NOT allow saving. The confidence level SHALL be surfaced in the pre-filled mask. The system SHALL NOT auto-save. The user SHALL be able to edit any field and save via the existing `create_intake` path, or cancel to discard the candidate.

#### Scenario: [FR-025] Candidate pre-fills the mask

- **WHEN** a candidate is produced
- **THEN** the intake mask opens pre-filled with the candidate's category, amount, and description

#### Scenario: [FR-026] Save goes through the existing path

- **WHEN** the user confirms the pre-filled candidate
- **THEN** the entry is created via `create_intake` and appears in the intake stack

#### Scenario: [FR-027] Cancel discards the candidate

- **WHEN** the user cancels the pre-filled mask
- **THEN** no entry is created

#### Scenario: [FR-036] Loading state shown while analysis is in flight

- **WHEN** analysis starts
- **THEN** the intake mask opens immediately in a loading state with saving disabled

#### Scenario: [FR-037] Confidence badge shown on the candidate

- **WHEN** the mask is pre-filled with a candidate
- **THEN** a low/medium/high confidence badge is shown reflecting the candidate's confidence level

#### Scenario: [FR-038] Cancel during loading aborts cleanly

- **WHEN** the user cancels while analysis is still in flight
- **THEN** no entry is created and a late analysis result does not reopen or pre-fill the mask

### Requirement: Distinct failure feedback

Analysis failures SHALL be surfaced as distinct, user-facing errors per `_conv-user-errors` — at minimum bad key, quota exceeded, and timeout/network — each offering a one-tap action that opens manual entry.

#### Scenario: [FR-028] Bad-key failure

- **WHEN** an analysis call returns an authentication error
- **THEN** a bad-key error is shown with a one-tap "Add manually" action that opens the manual intake mask

#### Scenario: [FR-029] Quota failure

- **WHEN** an analysis call returns a quota/rate-limit error
- **THEN** a quota error is shown with a one-tap "Add manually" action that opens the manual intake mask

#### Scenario: [FR-030] Timeout failure

- **WHEN** an analysis call does not complete before timeout
- **THEN** a timeout error is shown with a one-tap "Add manually" action that opens the manual intake mask

#### Scenario: [FR-039] Add-manually action opens a blank mask

- **WHEN** the user taps the "Add manually" action on a failure snackbar
- **THEN** the normal blank intake mask opens for manual entry
