## Context

The `food-recognition` pipeline shipped in 26.40.0 and is verified on a real device. The webview transports image bytes to the Rust backend, which owns the provider call, the key, and the endpoint (FR-007/008). Today the capture flow is:

1. `IntakeCaptureButton.svelte` renders a camera FAB when the feature is available (enabled + configured + online).
2. Tapping it (after one-time consent) clicks a hidden `<input type="file" accept="image/*" capture="environment">`.
3. On file change the button spins, the bytes are read and `analyze_meal_photo` is invoked.
4. On success the parent's `onCaptureResult` opens the create modal pre-filled via `modal.openCreateWith`; a low-confidence boolean drives a warning `notice` on the modal.
5. On failure a passive `AlertBox` is shown next to the FAB.

Four problems (#440): the `capture` hint is ignored by Android's WebView file chooser (always opens the document/gallery picker); the loading surface is just the FAB spinner; the computed confidence never reaches the UI (`IntakeCandidate` serializes only `low_confidence: bool`); and the failure `AlertBox` is a dead end — it names manual entry but offers no action.

Constraints: `_conv-user-errors` (error/snackbar handling), `_conv-modals` (dialog UX), `_conv-test-traceability` (every scenario cited by the cheapest correct test). The frontend uses generated `$lib/api` bindings and the `@thwbh/veilchen` library, which already provides `SnackbarContainer` (mounted in `+layout.svelte`) and the `$lib/snackbar` helper used by the workout Undo flow.

## Goals / Non-Goals

**Goals:**

- Tapping capture offers an explicit camera-vs-gallery choice, with the camera opening directly on Android.
- Analysis progress is shown inside the intake modal, which opens immediately and transitions in place.
- Every candidate carries a visible confidence signal (low/medium/high badge), not just a low-confidence warning.
- A failed analysis offers a one-tap path into manual entry.

**Non-Goals:**

- No change to the provider call, parsing, retry, or secret/privacy handling.
- No change to configuration or test-connection.
- No auto-save; confirm-first is preserved.
- No iOS camera support.

## Decisions

### D1 — Use `tauri-plugin-camera` instead of the `capture` attribute

The `capture="environment"` attribute is dropped by wry's Android `onShowFileChooser`, and that class lives in the gitignored, Tauri-regenerated `gen/android/.../generated/` tree — patching it would not survive CI. Rather than hand-roll a native camera command (Kotlin `@TauriPlugin` + `ActivityResult` + `FileProvider` + permission flow — a large, device-only surface), use the existing **`tauri-plugin-camera`** crate (`^0.1.4`, requires tauri `^2.3.1`; project is on 2.11.2). It ships its own `CameraActivity`, `FileProvider`, and merged `AndroidManifest` (CAMERA permission), and exposes `takePicture()` which opens the OS camera and returns `{ imageData: base64, width, height }` **to the webview**.

Crucially, this needs **no new backend command**: the webview decodes the base64 to bytes and feeds them to the existing `analyze_meal_photo`, so the FR-008 boundary is unchanged (key and endpoint stay in the backend) and EXIF is still stripped backend-side before upload (FR-009).

The FAB tap opens the camera directly — `takePicture()` → decode → `analyze_meal_photo`. There is **no in-app camera/gallery chooser**: the OS camera owns the capture UI, so an extra prompt would be redundant. If `takePicture()` rejects (desktop / plugin unavailable) the tap falls back silently to the hidden `<input type="file">`, so capture degrades gracefully rather than dead-ending and AI intake still works off-device.

Plugin wiring: `.plugin(tauri_plugin_camera::init())` in `lib.rs`, the npm package `tauri-plugin-camera` for the JS binding, and a `camera:default` entry in `capabilities/default.json`.

- _Alternative considered — hand-rolled native command:_ rejected — large device-only surface, unverifiable in CI, duplicates what the plugin already provides.
- _Alternative considered — overriding `RustWebChromeClient.onShowFileChooser` from `MainActivity`:_ rejected — fragile against regeneration and overriding Tauri's own client risks breaking unrelated uploads (e.g. avatar picker).

### D2 — Expose numeric confidence; bucket to a badge on the frontend

Add `confidence: f32` to `IntakeCandidate` (`mapping.rs`) alongside the existing `low_confidence` flag — the value is already computed, this just stops discarding it. The frontend buckets it into low/medium/high (a helper in `$lib/food-recognition`) and renders a colored badge in the `IntakeModal` header. The low/medium boundary reuses the backend's `LOW_CONFIDENCE_THRESHOLD` (0.5) so the badge and the existing low-confidence warning never disagree; medium/high split at a second threshold (e.g. 0.8). `low_confidence` stays as the single source for the warning `notice`, so the badge is additive and FR-023 behavior is unchanged.

- _Alternative considered:_ a numeric percentage. Rejected (per #440 decision) — implies false precision for a model estimate.

### D3 — Open the modal before analysis; loading state lives in the mask

The capture flow opens the create modal immediately with a loading state and no editable entry, then transitions in place: on success it fills the entry (today's `openCreateWith` payload) and clears loading; on failure it closes and the snackbar takes over (D4). This moves the single source of "work in progress" from the FAB into the modal. `IntakeMask`/`IntakeModal` gain a `loading` prop that renders a skeleton/spinner in the content slot and disables Save while pending. The route owns the `aiLoading` state and the capture→analyze orchestration (it already owns `onCaptureResult`, `aiNotice`, and the modal composable); `IntakeCaptureButton` emits lifecycle callbacks (`onstart`, `onresult`, `onerror`) rather than opening anything itself.

- _Alternative considered:_ a separate full-screen loading overlay. Rejected — the issue explicitly wants a natural transition straight into the editable mask.

### D4 — Failure recovery via an action snackbar

Replace the FAB-adjacent `AlertBox` with an action snackbar through the existing `$lib/snackbar` + `SnackbarContainer`. The snackbar message is the per-class text already in `aiErrorMessage` (bad key / quota / timeout / parse — FR-028..030), plus an **Add manually** action that opens the normal (blank) create modal via the existing `openManualCreate`. This reuses the workout-Undo snackbar pattern (add an `actionSnackbar` helper next to `undoSnackbar`). The loading modal from D3 closes before the snackbar appears so it does not sit behind the dialog (same ordering lesson as `ExerciseQuickFix`).

## Risks / Trade-offs

- **Third-party plugin (`tauri-plugin-camera`, 0.1.x, community).** → It supplies permissions/FileProvider/CameraActivity itself; gallery + manual entry remain working fallbacks if `takePicture()` is unavailable or rejects, so the feature degrades rather than breaks. Needs on-device verification on the target Android before archive (task 7.3).
- **`takePicture()` can't run in the Vitest/jsdom environment.** → Mock the `tauri-plugin-camera` module in component tests (same approach already used for the `$lib/api` invokes); the native path itself is not unit-tested (consistent with the dropped-e2e decision).
- **Badge and warning could disagree.** → Derive both from the same backend thresholds; `low_confidence` remains authoritative for the warning.
- **Opening the modal before the candidate exists** means a transient modal with no entry. → Guard the mask render on `loading || entry`, and ensure cancel during loading aborts cleanly (ignore a late `onresult` after cancel).
- **Snackbar vs. modal stacking.** → Close the loading modal before showing the failure snackbar (established ordering from `ExerciseQuickFix`).
