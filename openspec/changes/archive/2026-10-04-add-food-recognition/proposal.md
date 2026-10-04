## Why

Manual entry is calorie tracking's biggest friction point: looking up calorie values and typing them for every meal is tedious, and it is the main reason users abandon trackers. An opt-in photo shortcut removes most of the typing while keeping LibreFit's local-first promise — the user brings their own LLM key, the call goes straight from the device to their chosen provider, and nothing is stored beyond the intake entry the user confirms.

## What Changes

- **New camera button in the intake flow.** When AI intake is enabled and configured, the intake mask gains a capture button that opens the system camera (and doubles as gallery-attach). It sends the photo to the user's configured provider and pre-fills the intake mask for confirmation. No chatbot — one button, one call, the existing mask as the review surface.
- **New AI intake settings.** A settings surface to toggle the feature (default OFF), set a Mistral/OpenAI-compatible base URL and model name, store the API key, and run a "test connection" call. Non-secret settings persist in SQLite; the API key is stored only in the OS keystore.
- **Confirm-first mapping.** The provider response is translated in Rust into a single `NewIntake` candidate (multi-item photos are collapsed into one entry — concatenated description, summed calories). The candidate pre-fills the mask; the user edits and saves through the existing `create_intake` path, whose 1–10,000 kcal validation doubles as a hallucination guardrail. Nothing is auto-saved.
- **Backend-only provider calls.** All provider network calls originate in the Rust backend. The webview only transports image bytes over `invoke` and never holds the API key or the provider endpoint.
- **Privacy hygiene.** EXIF stripped before upload; the photo is never persisted to disk and crosses the IPC boundary in-memory; no image bytes or response content in logs (status/timing only); a one-time consent dialog states what is sent where; README/F-Droid privacy wording is updated ("local-first unless you opt in").
- **Graceful degradation.** The button is hidden/disabled when offline or unconfigured; manual entry stays the primary path; bad-key, quota, and timeout failures surface as distinct errors that nudge the user to manual entry.

### Non-goals (Phase 1)

- **No USDA/food-library hybrid** (#184) — Phase 1 ships plain LLM estimation; local per-100g computation is deferred.
- **No macros** (#415) — the schema stays calories-only until the intake table has macro columns.
- **No multi-candidate review UI** — a photo yields exactly one confirmable entry, not one row per detected item.
- **No native Gemini / provider registry** — one Mistral/OpenAI-compatible adapter, structured behind a trait so other providers can be wired in later.
- **No auto-save, no chatbot, no new DB entry type** — results flow through the existing `NewIntake` / `create_intake` path.

## Capabilities

### New Capabilities

- `food-recognition`: Opt-in, BYOK AI assistance that turns a meal photo into a confirmable intake candidate — settings/configuration, secret storage, image capture and privacy hygiene, the backend-only provider call, structured-output parsing, and deterministic mapping to a `NewIntake`.

### Modified Capabilities

- `intake-tracking`: The "Add intake entry" flow gains an optional AI-capture entry point that pre-fills the existing mask; the save path and validation are unchanged.
- `data-export` / `data-import`: Non-secret AI intake settings are included in backup export/import; the API key is never exported.

## Impact

- **New Rust deps:** `tauri-plugin-secure-keystore` (OS keystore, behind a `SecretStore` trait), `little_exif` (pure-Rust EXIF stripping). `reqwest` (rustls) is already present transitively.
- **New DB migration:** a generic `app_config` key/value table for non-secret settings (first consumer; intended for future settings too).
- **Rust service:** new `food-recognition` service module — provider adapter trait + one Mistral/OpenAI-compatible impl, image prep, schema validation (serde, single retry), and mapping to `NewIntake`. New Tauri commands for analyze / test-connection / config read-write.
- **Frontend:** AI intake settings surface; capture button + consent dialog wired into the intake mask; new `$lib/api` bindings from codegen.
- **Specs/tests:** new `food-recognition` spec (prefix `FR`); deltas to `intake-tracking`, `data-export`, `data-import`; scenarios cited per `_conv-test-traceability`, with the provider adapter behind a trait so network calls are mocked in tests.
- **Docs:** README / F-Droid privacy wording updated for the opt-in egress.
