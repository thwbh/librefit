## 1. Backend: expose confidence

- [x] 1.1 Add `confidence: f32` to `IntakeCandidate` in `src-tauri/src/service/food_recognition/mapping.rs` (keep `low_confidence`); set it from `result.confidence` in `to_candidate`.
- [x] 1.2 Regenerate `$lib/api/gen` bindings and confirm `IntakeCandidateSchema` gains `confidence`.
- [x] 1.3 Add/extend Rust mapping tests: candidate carries the confidence value and the low-confidence flag agrees with the threshold — `scenario!("[FR-034]")`, `scenario!("[FR-035]")`.

## 2. Camera plugin wiring

- [x] 2.1 Add the `tauri-plugin-camera` crate to `src-tauri/Cargo.toml` and `.plugin(tauri_plugin_camera::init())` in `src-tauri/src/lib.rs`; add the `tauri-plugin-camera` npm package.
- [x] 2.2 Add `camera:default` in a platform-scoped `src-tauri/capabilities/mobile.json` (`platforms: ["android","iOS"]`), since the camera permission is mobile-only and would fail the desktop schema.
- [x] 2.3 Confirm the backend builds with the plugin (`cargo check`), which also regenerates `$lib/api/gen` bindings (confidence field from task 1.1).

## 3. Frontend: camera-vs-gallery choice

- [x] 3.1 In `IntakeCaptureButton.svelte`, tapping opens the camera directly via `capturePhotoFromCamera()` (plugin `take_picture` → base64 decode); no in-app chooser. Keep consent gating (FR-014..016) ahead of capture; fall back silently to the hidden `<input type="file">` if the camera invoke rejects (desktop / unavailable).
- [x] 3.2 Have the button emit lifecycle callbacks (`onstart`, `onresult`, `onerror`) instead of opening/erroring itself; remove the FAB spinner and the FAB-adjacent `AlertBox`.
- [x] 3.3 Update `IntakeCaptureButton.test.ts`: mock the camera helper; cover camera-direct, no chooser, and the file-picker fallback — `it('[FR-031] ...')`, `it('[FR-032] ...')`, `it('[FR-033] ...')`.

## 4. Frontend: in-modal loading + confidence badge

- [x] 4.1 Add a `loading` prop to `IntakeModal.svelte`/`IntakeMask.svelte` that renders a loading state in the content slot and disables Save while pending.
- [x] 4.2 Add a confidence-bucketing helper to `$lib/food-recognition` (low/medium/high from numeric confidence, low boundary = backend threshold) with unit tests, and render a colored badge in the `IntakeModal` header.
- [x] 4.3 Modal/mask tests: loading state disables save — `it('[FR-036] ...')`; badge reflects the level — `it('[FR-037] ...')`.

## 5. Frontend: route orchestration (capture → loading → result/failure)

- [x] 5.1 In `src/routes/(app)/+page.svelte`, open the create modal in a loading state on `onstart`, fill the entry on `onresult`, and handle `onerror`; ignore a late `onresult` after cancel (abort-clean).
- [x] 5.2 Pass the candidate confidence through to the modal badge and keep the low-confidence `notice` wiring.
- [x] 5.3 Route/flow tests: loading opens before the candidate, cancel during loading aborts cleanly — `it('[FR-038] ...')` (and coverage that `[FR-025]`/`[FR-036]` still hold).

## 6. Frontend: failure-recovery snackbar

- [x] 6.1 Add an `actionSnackbar` helper to `$lib/snackbar.ts` (message + single action) next to `undoSnackbar`.
- [x] 6.2 On `onerror`, close the loading modal, then show the action snackbar with `aiErrorMessage(e)` text and an "Add manually" action that calls `openManualCreate`.
- [x] 6.3 Tests: each failure class shows an actionable snackbar and the action opens a blank mask — `it('[FR-028] ...')`, `it('[FR-029] ...')`, `it('[FR-030] ...')`, `it('[FR-039] ...')`.

## 7. Verify

- [x] 7.1 Run `npm run lint:traceability` and confirm every new/changed FR scenario (FR-011/013, FR-020..038 touched, FR-028..039) is cited by a test.
- [x] 7.2 Run the Vitest + Rust suites; fix regressions.
- [ ] 7.3 Manually verify on an Android device: camera opens directly, loading shows in-modal, badge renders, and a non-food photo yields an actionable "Add manually" snackbar.
