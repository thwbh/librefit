## Status

**Abandoned 2026-05-26.** This change was proposed, designed, and partially implemented, then deliberately not landed. The rationale and history are preserved here for future reference; the durable artifacts (scenario IDs, traceability gate, test-citation convention) were re-homed into the hand-written `_conv-test-traceability` spec.

## Why (original motivation)

The spec corpus had ~120 traceable scenarios across 17 specs after the reconciliation change, each with a stable `[<PREFIX>-<NNN>]` ID. Without a corresponding test layer, those scenarios were a contract on paper. This change set out to introduce end-to-end testing as a first-class layer alongside Rust integration and Vitest unit/component tests, and to make test↔scenario traceability a verifiable property of the codebase.

## What it would have done

- Introduced Playwright (later pivoted to WebdriverIO) driving the Tauri webview through `tauri-driver`.
- Added a convention spec `_conv-e2e-tests` defining the e2e DoD: every feature spec scenario referenced by at least one test.
- Added a traceability check script that fails CI when orphan scenarios are detected.
- Built an initial e2e suite covering every feature spec.
- Wired e2e + traceability into CI.

## Why abandoned

Two reasons converged:

**1. The tooling story for Tauri + macOS is genuinely immature.** `tauri-driver` (Tauri's WebDriver shim) supports Linux and Windows only — the project's primary development environment is macOS. This was missed in initial research and led to two failed tool pivots (Playwright → WebdriverIO; then a probe at `tauri-plugin-webdriver` which surfaced a Cargo dependency skew in `tauri-runtime-wry`). A working local path _exists_ (Linux container via Podman) but adds ~1–2 minutes per test cycle and feels like running CI on the developer's laptop.

**2. The cheaper layers cover almost everything for this app.** On reflection, the unique value of e2e for an offline single-window calorie tracker is small:

- Backend math/validation/CRUD → already covered by 50+ Rust integration tests.
- UI behavior given a backend response → trivially covered by Vitest + `@testing-library/svelte` with `vi.mock` on the Tauri command boundary.
- State across multi-step components (e.g. the wizard) → same: render the parent, drive children, assert state. No real Tauri needed.
- Atomic transactions on save → backend Rust tests.
- Native dialogs (export/import) → can't be driven via WebDriver anyway.

The SDD work the project just completed (scenarios with stable IDs) is layer-agnostic by design: a scenario can be verified at any layer that exercises its claim. The cheapest correct layer wins. For this codebase, that layer is rarely the assembled Tauri binary.

## What was kept

- **Scenario IDs in all specs.** The `[<PREFIX>-<NNN>]` convention applied during the reconciliation change is independent of e2e and remains in force.
- **`scripts/check-spec-traceability.sh`.** The traceability gate enforces that every scenario has at least one test citation — at any layer.
- **A new hand-written convention spec, `_conv-test-traceability`,** carrying the IDs + citation rule + "cheapest correct layer" principle into the corpus.

## What was removed

- `e2e/` directory (config, fixtures, pages, specs, README).
- `wdio.conf.ts`, `tsconfig.wdio.json`.
- Container infrastructure (`Containerfile.e2e`, `scripts/e2e.sh`, `.dockerignore`).
- WebdriverIO + Mocha npm devDependencies.
- `src-tauri/src/cmd/seed.rs` + `cmd/mod.rs`, the `e2e-seed` Cargo feature, and the gated registrations in `src-tauri/src/lib.rs`.
- CI's `e2e` job and the related required-status-check on `main`.

## Conditions for reopening

This change should be revisited if any of these become true:

- Upstream `tauri-driver` adds macOS support (see [tauri-apps/tauri#7068](https://github.com/tauri-apps/tauri/issues/7068)).
- `tauri-plugin-webdriver` (or `danielraffel/tauri-webdriver`) stabilizes and is compatible with the project's Tauri version without dependency-resolution conflicts.
- A new feature lands that has integration risk not catchable at Vitest + Rust layers — e.g. multi-window IPC, OS-level integration that exceeds plugin coverage, or visual-regression concerns.

## Capabilities

None — this change is being archived as an abandonment record. It produces no deltas.
