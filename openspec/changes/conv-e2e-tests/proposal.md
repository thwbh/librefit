## Why

The spec corpus now has ~120 traceable scenarios across 17 specs, each with a stable `[<PREFIX>-<NNN>]` ID. Without a corresponding test layer, those scenarios are a contract on paper. This change introduces end-to-end testing as a first-class layer alongside the existing Rust integration tests and Vitest unit/component tests, and makes test↔scenario traceability a verifiable property of the codebase.

## What Changes

- Introduce Playwright (driving the Tauri webview through `tauri-driver`) as the e2e testing stack.
- Add the new convention spec `_conv-e2e-tests` defining the e2e DoD: every feature spec scenario MUST be referenced by at least one test (e2e or, where layer-appropriate, unit/integration); every test MUST cite at least one scenario ID.
- Add a traceability check script (`scripts/check-spec-traceability.*`) that fails CI when orphan scenarios or orphan tests are detected.
- Add an initial e2e suite covering one happy-path scenario per feature spec (10 specs × ~1–3 scenarios each). Backfill coverage to the full DoD threshold within this change.
- Wire e2e + traceability into the CI workflow alongside the existing Rust/Vitest jobs.
- Add a pre-archive checklist item to `_conv-e2e-tests` so future feature changes must confirm e2e coverage before archiving.

Non-breaking. No production code changes. Adds dev dependencies + CI steps + a new spec.

## Capabilities

### New Capabilities

- `_conv-e2e-tests`: end-to-end testing convention — tooling baseline, DoD rule, traceability gate.

### Modified Capabilities

None. Feature specs are not modified by this change; the e2e DoD is enforced _against_ them, not by changing them.

## Impact

- **Specs:** introduces `_conv-e2e-tests` with its own ID prefix `E2E`.
- **Code:** adds `e2e/` directory, `playwright.config.ts`, fixtures, page objects. Adds traceability script under `scripts/`. No changes to `src/` or `src-tauri/` production code.
- **Dev dependencies:** `@playwright/test`, `tauri-driver` (rust binary, installed via `cargo install`).
- **CI:** new GitHub Actions job for e2e + traceability check. Runs after existing test jobs.
- **DoD:** future feature changes inherit "scenarios must be referenced by tests" as a pre-archive gate.
- **Out of scope:** Android e2e. Android remains tested manually until a separate change addresses it (Maestro or similar). Documented as a known limitation in `_conv-e2e-tests`.
