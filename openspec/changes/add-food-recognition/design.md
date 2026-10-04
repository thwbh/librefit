## Context

LibreFit is local-first: today nothing leaves the device. This change introduces the app's first optional network egress, scoped tightly to a BYOK photo→intake shortcut. It must not compromise the local-first promise for users who don't opt in, and must keep the API key out of every surface that could leak it.

The existing intake stack already provides the landing zone: `NewIntake` (camelCase serde) and `create_intake` with 1–10,000 kcal validation (`src-tauri/src/service/intake.rs`). The intake mask (`src/lib/component/intake/IntakeMask.svelte`) is a single-entry form bound to one `entry: Intake | NewIntake`. There is currently **no** settings-persistence layer and **no** secret storage — both are introduced here.

Constraints:

- Target is desktop **and** Android; `keyring-rs` has no Android backend.
- Tests cannot hit the network; traceability (`_conv-test-traceability`) requires every `FR` scenario be cited at the cheapest correct layer.
- `reqwest` (rustls) is already transitively in the lockfile.

## Goals / Non-Goals

**Goals:**

- One button, one backend call, the existing mask as the review surface — no chatbot, no auto-save.
- API key stored only in the OS keystore; all provider calls originate in Rust; the webview only transports image bytes.
- Provider access behind a trait so additional providers (and a different secret backend) can be swapped without touching the feature.
- A reusable `app_config` key/value store that this feature is merely the first consumer of.

**Non-Goals:**

- USDA/food-library hybrid (#184), macros (#415), native Gemini, a provider registry, a multi-candidate review UI, purely-local "usual meals" recall.
- Hardware-attestation guarantees on Android beyond what the chosen keystore plugin provides.

## Decisions

### D1 — One Mistral/OpenAI-compatible adapter behind a `ProviderAdapter` trait

A single `/chat/completions`-style contract with image content parts and `response_format` structured output covers Mistral, OpenRouter, Groq, and Ollama (local). The adapter sits behind a trait that is simultaneously the **extension point** (future providers) and the **test seam** (a fake impl returns canned/malformed responses so `FR` parsing/mapping/error scenarios run without network). Native Gemini is deferred — it is not OpenAI-compatible without its own adapter.
_Alternatives:_ multiple provider adapters now (rejected — YAGNI, the issue's "one adapter" claim only holds for the compatible dialect); provider registry (rejected — premature).

### D2 — Secret storage behind a `SecretStore` trait; implemented with the Rust `keyring` crate

The key is stored via a `SecretStore` abstraction. **Implementation note (diverged from the original plan):** we first intended `tauri-plugin-secure-keystore`, but that (and the other Tauri keystore plugins) are JS-side — the key would only be reachable from the webview. Our architecture requires the **Rust backend to read the key** to make the provider call (FR-008, key never crosses to the webview), so a JS-side plugin doesn't fit. The concrete backend is instead Rust-native, built on **`keyring-core` v1 plus each platform's native store crate** (`apple-native-keyring-store`, `windows-native-keyring-store`, `zbus-secret-service-keyring-store`, `android-native-keyring-store`), wired per-target in `Cargo.toml`. `KeyringSecretStore` uses `keyring_core::Entry`; `secret::init_default_store()` (called at startup in `run`) registers the platform store via `keyring_core::set_default_store`. We deliberately avoid the `keyring` umbrella's `v1` convenience wrapper because it auto-initializes only on desktop and **explicitly refuses Android/iOS** — setting the default store ourselves is what makes Android work. The Android store reads the app context from `ndk-context`. **Tauri does not initialize `ndk-context`** (confirmed: nothing else in the dep tree pulls it), so we do it ourselves: a Rust JNI function `Java_io_tohowabohu_librefit_MainActivity_initNdkContext` (android-gated, in `lib.rs`) is called from `MainActivity.onCreate` (Kotlin, after `super.onCreate` loads the lib). Because that runs _after_ Tauri's setup hook, the default-store registration is **lazy** (`ensure_default_store` via `OnceLock`, on first secret use) rather than at startup — by first use the context is ready. TLS for the provider call needs **no** per-platform init: instead of reqwest's default platform verifier (which on Android requires a bundled `org.rustls.platformverifier` Java class that isn't in the APK), the adapter builds its own rustls `ClientConfig` trusting **bundled Mozilla roots** (`webpki-roots`) and passes it via `use_preconfigured_tls`. This verifies certs identically on every platform with no OS trust store and no Java support classes — appropriate for calling public LLM APIs. `InMemorySecretStore` remains the test backend behind the same trait. (Note: the Apple store bumped `security-framework` to 3.7.0 to satisfy both it and reqwest's platform-verifier.)
_Alternatives:_ Stronghold (rejected — **deprecated/removed in Tauri v3**, argon2-password-encrypted file not hardware-backed, needs a master-password bootstrap); `tauri-plugin-keyring` (viable fallback — mature `keyring-rs` on desktop, but silent on Android biometric behavior and ~10 months stale); roll-your-own Android Keystore bridge (deferred — right long-term call, unnecessary scope for Phase 1 given the trait).
_Note:_ on Android the app sandbox already isolates the SQLite DB from other apps, so the keystore's marginal threat reduction is modest; its real value is the privacy narrative ("key lives in the OS keystore, never the database").

### D3 — Non-secret config in a generic SQLite `app_config` kv table

A two-column (`key`, `value`) table holds the enabled flag, base URL, and model name. It rides the existing Diesel/SQLite spine, flows through JSON export/import for backup convenience, and is explicitly intended as the home for future settings. The API key is **never** written here.
_Alternatives:_ `tauri-plugin-store` JSON file (rejected — new dep, bypasses export/import); profile table (rejected — not a natural fit, not reusable).

### D4 — Collapse multi-item analysis into a single `NewIntake`

The schema returns structured `items:[{name, calorieEstimate}]` for model accuracy (itemize-then-sum beats a single blended total), but the mapping collapses to **one** entry: concatenated description, summed calories. This keeps the single-entry `IntakeMask` untouched and removes the only genuinely new UI surface. Category is resolved locally against `food_category`; the summed amount passes through `create_intake`'s existing 1–10k guardrail unchanged.
_Alternatives:_ one candidate row per item with per-row confirm/dismiss (rejected per product direction — user confirms a single entry; "Grilled chicken with rice and broccoli" is an acceptable single line).

### D5 — Backend-only egress; image bytes cross IPC in-memory

The webview's only jobs: open the camera (`<input type="file" accept="image/*" capture="environment">`) and pass raw bytes over `invoke`. EXIF strip (`little_exif`, pure Rust, no decode/re-encode), key retrieval, the HTTP call, schema validation, and mapping all happen in Rust. Bytes are passed in-memory (base64/byte array) rather than via a temp file so "photo never persisted" holds by construction. Optional downscale (via `image`) is left as a follow-up lever if cost/latency warrants.
_Alternatives:_ call the provider from JS (rejected — exposes key/endpoint to the webview, CORS, log-leak surface); temp-file handoff (rejected — violates no-persist).

### D6 — Validated parsing with a single retry

Provider structured output is requested where available; the backend validates with serde and retries exactly once on parse failure before surfacing an error. Failures are classed (bad key / quota / timeout) per `_conv-user-errors`, each nudging to manual entry.

## Risks / Trade-offs

- **`tauri-plugin-secure-keystore` is beta and lightly maintained** → version-pinned, source-reviewed once, isolated behind `SecretStore`; `tauri-plugin-keyring` is the pre-vetted fallback.
- **Android keystore behavior can't be exercised in CI** → the `SecretStore` trait is faked in tests; real-device verification is a manual check in tasks.
- **Model hallucination / wrong calories** → confirm-first (never auto-save) plus the 1–10k `create_intake` validation; low-confidence results are flagged.
- **New network egress erodes the local-first story** → default OFF, one-time consent stating what goes where, button hidden when unconfigured/offline, README/F-Droid wording updated, Ollama highlighted as the zero-egress local option.
- **Provider schema drift / malformed JSON** → fixed schema + single retry + classed error; the `ProviderAdapter` trait localizes any future dialect fix.
- **Leaking secrets via logs** → logs restricted to status/timing; a code-review checklist item ensures no image/response content is logged.

## Migration Plan

1. Add the `app_config` migration (additive; no existing table touched — trivial rollback by dropping the table).
2. Ship with the feature default OFF; no behavior change for existing users until they opt in.
3. Export/import gain a new optional section; older backups without `app_config` import unchanged (section simply absent).
4. Register the `FR` prefix in the CLAUDE.md scenario registry.

## Open Questions

- Downscale-before-upload: include a resize step (pulls in `image`) in Phase 1, or defer until cost/latency data justifies it? (Leaning defer.)
- Whether to also delete the keystore entry when the user disables the feature, or retain it for easy re-enable. (Leaning retain; disabling just flips the flag.)
