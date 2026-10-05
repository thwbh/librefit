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

### D1 — Native camera command instead of the `capture` attribute

The `capture="environment"` attribute is dropped by wry's Android `onShowFileChooser`, and that class lives in the gitignored, Tauri-regenerated `gen/android/.../generated/` tree — patching it would not survive CI. Instead add a backend command (e.g. `capture_meal_photo`) that launches the OS camera via an Android `ActivityResult` + `FileProvider` and returns the captured image bytes to the webview, mirroring the existing analyze boundary (no key or endpoint crosses). The native glue lives in the **committed** `gen/android` skeleton (`MainActivity.kt`, `AndroidManifest.xml`), which the branch's config-driven signing work keeps out of CI regeneration.

The FAB tap presents two actions: **Take photo** → `capture_meal_photo` → bytes; **Choose from gallery** → the existing hidden `<input type="file">` path (kept, since gallery selection still works and desktop has no camera intent). On desktop the camera action falls back to the file input.

- _Alternative considered:_ overriding `RustWebChromeClient.onShowFileChooser` from `MainActivity`. Rejected — fragile against regeneration and overriding Tauri's own client risks breaking unrelated uploads (e.g. avatar picker).

### D2 — Expose numeric confidence; bucket to a badge on the frontend

Add `confidence: f32` to `IntakeCandidate` (`mapping.rs`) alongside the existing `low_confidence` flag — the value is already computed, this just stops discarding it. The frontend buckets it into low/medium/high (a helper in `$lib/food-recognition`) and renders a colored badge in the `IntakeModal` header. The low/medium boundary reuses the backend's `LOW_CONFIDENCE_THRESHOLD` (0.5) so the badge and the existing low-confidence warning never disagree; medium/high split at a second threshold (e.g. 0.8). `low_confidence` stays as the single source for the warning `notice`, so the badge is additive and FR-023 behavior is unchanged.

- _Alternative considered:_ a numeric percentage. Rejected (per #440 decision) — implies false precision for a model estimate.

### D3 — Open the modal before analysis; loading state lives in the mask

The capture flow opens the create modal immediately with a loading state and no editable entry, then transitions in place: on success it fills the entry (today's `openCreateWith` payload) and clears loading; on failure it closes and the snackbar takes over (D4). This moves the single source of "work in progress" from the FAB into the modal. `IntakeMask`/`IntakeModal` gain a `loading` prop that renders a skeleton/spinner in the content slot and disables Save while pending. The route owns the `aiLoading` state and the capture→analyze orchestration (it already owns `onCaptureResult`, `aiNotice`, and the modal composable); `IntakeCaptureButton` emits lifecycle callbacks (`onstart`, `onresult`, `onerror`) rather than opening anything itself.

- _Alternative considered:_ a separate full-screen loading overlay. Rejected — the issue explicitly wants a natural transition straight into the editable mask.

### D4 — Failure recovery via an action snackbar

Replace the FAB-adjacent `AlertBox` with an action snackbar through the existing `$lib/snackbar` + `SnackbarContainer`. The snackbar message is the per-class text already in `aiErrorMessage` (bad key / quota / timeout / parse — FR-028..030), plus an **Add manually** action that opens the normal (blank) create modal via the existing `openManualCreate`. This reuses the workout-Undo snackbar pattern (add an `actionSnackbar` helper next to `undoSnackbar`). The loading modal from D3 closes before the snackbar appears so it does not sit behind the dialog (same ordering lesson as `ExerciseQuickFix`).

## Risks / Trade-offs

- **Native camera adds Android surface (permissions, FileProvider).** → Keep it minimal and in the committed `gen/android` skeleton; gallery + manual entry remain working fallbacks if the camera intent is unavailable, so the feature degrades rather than breaks.
- **Camera command can't run in the Vitest/jsdom environment.** → Mock the `capture_meal_photo` invoke in component tests (same approach already used for `analyze_meal_photo`); the native path itself is not unit-tested (consistent with the dropped-e2e decision).
- **Badge and warning could disagree.** → Derive both from the same backend thresholds; `low_confidence` remains authoritative for the warning.
- **Opening the modal before the candidate exists** means a transient modal with no entry. → Guard the mask render on `loading || entry`, and ensure cancel during loading aborts cleanly (ignore a late `onresult` after cancel).
- **Snackbar vs. modal stacking.** → Close the loading modal before showing the failure snackbar (established ordering from `ExerciseQuickFix`).
