## Why

The AI meal-photo intake pipeline (`food-recognition`, shipped in 26.40.0) works end-to-end, but real-device use surfaced four first-use friction points — all clarity/flow issues, not correctness bugs (issue #440). The capture button opens the gallery instead of the camera, there is no proper loading surface during analysis, the confidence the backend already computes never reaches the user, and a failed analysis tells the user to enter manually without giving them a way to do so.

## What Changes

- **Camera-first capture.** Tapping the capture FAB offers an explicit "Take photo" (opens the OS camera directly) and "Choose from gallery" choice. "Take photo" goes through a new native backend command instead of the `<input capture="environment">` hint, which the Android WebView file chooser silently ignores. Gallery capture keeps the existing file-input path. Manual entry stays available throughout.
- **In-modal loading state.** The intake modal opens immediately when analysis starts and shows a loading state inside it, rather than spinning the capture button. It transitions in place to the pre-filled form on success, or hands off to the failure-recovery path on error.
- **Confidence badge.** The backend already flags low confidence (FR-023) but only emits a boolean. The numeric confidence is exposed on the candidate and rendered as a low/medium/high badge in the intake modal header, so every estimate carries a visible trust signal — not just the low-confidence warning.
- **Failure-recovery snackbar.** When analysis fails or returns nothing usable, a snackbar explains the failure and offers a one-tap "Add manually" action that opens the normal intake modal, replacing today's passive `AlertBox` that mentions manual entry without a way to act on it.

### Non-goals

- No change to the backend provider call, structured-output parsing, retry, or secret/privacy handling (FR-007..010, FR-017..019).
- No change to the opt-in configuration surface or test-connection flow.
- No auto-save: the confirm-first contract (FR-025..027) is unchanged.
- iOS camera support is out of scope; Android is the mobile target.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `food-recognition`: capture entry point gains a camera-first choice backed by a native capture command (amends the capture-availability requirement); the intake candidate carries a confidence level in addition to the low-confidence flag (amends the mapping requirement, FR-023); analysis failures are surfaced as an actionable snackbar that opens manual entry (amends the distinct-failure-feedback requirement, FR-028..030); a loading state is shown in the intake mask while analysis is in flight (amends confirm-first, FR-025).

## Impact

- **Frontend:** `IntakeCaptureButton.svelte` (camera/gallery choice, invoke native capture, open modal before analysis), `IntakeModal.svelte` / `IntakeMask.svelte` (loading state + confidence badge), `src/routes/(app)/+page.svelte` (capture → loading → result/failure wiring), `$lib/food-recognition` (confidence bucketing helper), `$lib/snackbar` (action snackbar for failure recovery). New/updated colocated Vitest tests.
- **Backend:** `IntakeCandidate` (`service/food_recognition/mapping.rs`) gains a `confidence` field; a new Tauri command captures a photo from the device camera and returns image bytes to the webview (mirroring the existing analyze boundary — no key or endpoint crosses). Regenerated `$lib/api/gen` bindings.
- **Android native:** `MainActivity.kt` / `AndroidManifest.xml` gain `CAMERA` permission and a `FileProvider` for the camera `ActivityResult`. Lives in committed `gen/android` so it survives CI regeneration.
- **Spec:** `openspec/specs/food-recognition/spec.md` delta for the amended requirements and new scenarios.
