## 1. Foundations — config store & secret storage

- [x] 1.1 Add `app_config` migration: two-column (`key`, `value`) kv table; add Diesel schema + model.
- [x] 1.2 Add `AppConfig` service with typed get/set helpers for the AI intake keys (enabled flag, base URL, model name); never stores secrets.
- [ ] 1.3 **[DEFERRED — needs on-device verification]** Add `tauri-plugin-secure-keystore` (version-pinned), review source once, implement the concrete `SecretStore` keystore backend, and wire Android gradle/permissions. Swap it in for the in-memory placeholder in `run()`.
- [x] 1.4 Define a `SecretStore` trait (set/get/delete one secret) with an in-memory fake (used for tests and as the placeholder backend until 1.3 lands).
- [x] 1.5 Add Tauri commands to read/write non-secret AI config and to set/clear the API key via `SecretStore`; expose a `is_configured` helper.

## 2. Provider adapter (backend egress)

- [x] 2.1 Define the `ProviderAdapter` trait (`analyze(image_bytes, prompt, locale) -> AnalysisResult`, `test_connection()`).
- [x] 2.2 Implement the Mistral/OpenAI-compatible adapter over `reqwest` (rustls): `/chat/completions` with image content parts + `response_format` structured output.
- [x] 2.3 Define the fixed analysis schema (`items:[{name, calorieEstimate}]` + confidence) and serde validation with exactly one retry on parse failure.
- [x] 2.4 Classify failures into bad-key / quota / timeout error variants per `_conv-user-errors`.
- [x] 2.5 Add a fake `ProviderAdapter` (canned success, malformed-then-valid, hard-fail) for tests.

## 3. Image handling & privacy

- [x] 3.1 Add `little_exif`; strip EXIF from incoming image bytes in the backend before any provider call.
- [x] 3.2 Keep image bytes in-memory across the IPC boundary (no temp file, never persisted to disk).
- [x] 3.3 Audit logging so only call status/timing are logged — no image bytes, no response content.

## 4. Mapping & commands

- [x] 4.1 Map `AnalysisResult` → a single `NewIntake`: concatenate item names, sum calorie estimates.
- [x] 4.2 Resolve category locally against `food_category` (never from the model); set a low-confidence flag.
- [x] 4.3 Add the `analyze_meal_photo` Tauri command returning one `NewIntake` candidate; add `test_connection` command.
- [x] 4.4 Regenerate `$lib/api` bindings for the new commands/types.

## 5. Frontend — settings & consent

- [ ] 5.1 Add an AI intake settings surface: enable toggle (default OFF), base URL, model name, API key field, "test connection" button with distinct success/error feedback.
- [ ] 5.2 Add the one-time consent dialog (`_conv-modals`) stating what is sent and where; record consent in `app_config`.

## 6. Frontend — capture in the intake flow

- [ ] 6.1 Add the capture button (`<input type="file" accept="image/*" capture="environment">`) to the add-intake flow, shown only when enabled + configured + online.
- [ ] 6.2 Send image bytes to `analyze_meal_photo`; pre-fill the existing `IntakeMask` with the returned candidate; surface low-confidence warning.
- [ ] 6.3 Save via the existing `create_intake` path; cancel discards; no auto-save.
- [ ] 6.4 Wire distinct bad-key / quota / timeout errors to toasts that nudge to manual entry.

## 7. Export / import

- [ ] 7.1 Include non-secret `app_config` settings in the JSON export; assert the API key is never exported.
- [ ] 7.2 Restore `app_config` settings on JSON import (validated per `_conv-validation`); imported config stays unconfigured until a key is re-entered.

## 8. Tests & traceability

- [x] 8.1 Rust integration tests covering `FR` backend scenarios (config, secret handling, parsing/retry, mapping, error taxonomy) using the fakes; cite IDs via `scenario!`. (17 tests, covering FR-001..009, 017..024, 028..030, 004..006.)
- [ ] 8.2 Vitest component tests for `FR` + `IT` frontend scenarios (availability/degradation, consent, pre-fill, cancel) with bracketed IDs.
- [ ] 8.3 Vitest/Rust coverage for `EX`/`IM` settings export/import scenarios.
- [ ] 8.4 Run `npm run lint:traceability` and resolve any uncovered scenarios.

## 9. Docs & registry

- [ ] 9.1 Register the `FR` prefix in the CLAUDE.md scenario registry table.
- [ ] 9.2 Update README / F-Droid privacy wording ("local-first unless you opt in"); highlight Ollama as the zero-egress local option.

## 10. Manual verification

- [ ] 10.1 Verify the secret-store round-trip on a real Android device (no biometric enrollment required) and on desktop.
- [ ] 10.2 End-to-end smoke: configure a provider, capture a photo, confirm a pre-filled entry saves; verify offline/unconfigured hides the button.
