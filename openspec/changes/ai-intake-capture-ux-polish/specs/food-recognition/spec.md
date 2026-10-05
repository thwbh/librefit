## MODIFIED Requirements

### Requirement: Capture availability and degradation

The capture entry point SHALL be available only when the feature is enabled and configured. It SHALL be hidden or disabled when the feature is off, unconfigured, or the device is offline. When triggered, the capture entry point SHALL offer an explicit choice between taking a photo and choosing from the gallery; taking a photo SHALL open the device camera directly rather than relying on the WebView file-chooser capture hint. Manual entry SHALL remain available in all cases.

#### Scenario: [FR-011] Capture hidden when feature off

- **WHEN** the feature is disabled
- **THEN** the capture button is not shown and manual entry is unaffected

#### Scenario: [FR-012] Capture unavailable when unconfigured

- **WHEN** the feature is enabled but not fully configured
- **THEN** the capture button is hidden or disabled

#### Scenario: [FR-013] Capture unavailable offline

- **WHEN** the device is offline
- **THEN** the capture button is disabled and manual entry remains available

#### Scenario: [FR-031] Capture offers camera and gallery choices

- **WHEN** the user triggers capture while the feature is available and consent is granted
- **THEN** a choice between "Take photo" and "Choose from gallery" is presented

#### Scenario: [FR-032] Take photo opens the device camera

- **WHEN** the user chooses "Take photo"
- **THEN** the device camera is opened directly through the native capture path
- **AND** the captured image bytes are passed to analysis without being persisted to disk

#### Scenario: [FR-033] Choose from gallery opens the picker

- **WHEN** the user chooses "Choose from gallery"
- **THEN** the gallery/file picker is opened and the selected image bytes are passed to analysis

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
