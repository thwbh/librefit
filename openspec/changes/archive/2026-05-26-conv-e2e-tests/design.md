## Context

LibreFit had substantial Rust integration tests (~50) and Vitest unit/component tests (~300), but no end-to-end coverage of the assembled Tauri app. The reconciliation change just normalized all behavior into ~150 scenario-with-ID statements across 17 specs. This change set out to close the loop with an e2e layer.

It did not land. The history of how the team arrived at "do not e2e at all for this app" is captured here for future reference.

## The journey (what was tried)

### Iteration 1: Playwright + tauri-driver

Initial choice based on the recommendation that Playwright was "the modern default" for web e2e. Wrote `playwright.config.ts`, fixtures, page objects, scenario-citation conventions, ten `.spec.ts` files, a traceability gate script, and CI wiring.

**Discovered after `npm run test:e2e`:** Playwright cannot drive `tauri-driver`. They speak incompatible protocols (Playwright uses CDP for Chromium; `tauri-driver` exposes W3C WebDriver). The official Tauri docs use WebdriverIO, not Playwright. Should have been caught in research.

### Iteration 2: WebdriverIO + tauri-driver

Pivoted to WebdriverIO + Mocha + `tauri-driver`. Rewrote configuration, converted ten `.spec.ts` files to the WDIO API, swapped page-object selector syntax, restructured fixtures. Added a Rust-side `e2e-seed` Cargo feature with composable seed primitives (`seed_user`, `seed_body_data`, `seed_intake_target`, etc.) so tests could construct state without driving the wizard UI for every test.

**Discovered after `npm run test:e2e`:** `tauri-driver --help` on the developer's macOS machine returned `tauri-driver is not supported on this platform`. The shim supports Linux and Windows only (documented at [v2.tauri.app/develop/tests/webdriver/](https://v2.tauri.app/develop/tests/webdriver/)). Should have been caught earlier.

### Iteration 3a: Linux container via Podman (parallel option)

Built a `Containerfile.e2e` (Ubuntu + Tauri deps + Node + Rust + tauri-driver + webkit2gtk-driver + xvfb), a `scripts/e2e.sh` orchestrator with named volume caching, and updated docs. This works — it is in fact the only way to run the e2e suite against a real Tauri binary on macOS today. But the wall-clock cost is ~1–2 minutes per cycle. Iterating on test code in this loop is unpleasant.

### Iteration 3b: tauri-plugin-webdriver (cross-platform plugin)

`Choochmeque/tauri-plugin-webdriver` embeds a W3C WebDriver server inside the Tauri app via a Rust plugin and supports macOS, Linux, and Windows. The pivot would have kept WDIO and most test code unchanged.

**Discovered after `cargo check`:** adding the optional dependency triggered a Cargo resolution cascade that bumped `tauri-runtime` to a version with a new trait method (`eval_script_with_callback`) which the matched `tauri-runtime-wry` did not implement. Inter-version skew inside the Tauri ecosystem — not solvable from the project's `Cargo.toml` without a broader Tauri upgrade.

### The reframe

After three failed/heavy iterations, the underlying question was finally asked: **does this app actually need e2e?**

The answer, after grading each spec area honestly, is **no, or close enough to no that the cost isn't justified**:

- The wizard (the most plausible e2e candidate) is mostly testable via Vitest + `@testing-library/svelte` rendering `Setup.svelte` with mocked Tauri responses, plus existing Rust tests covering `wizard_calculate_tdee` / `wizard_create_targets` / atomic transaction semantics.
- All other feature areas are either backend-heavy (covered by Rust tests), UI-component-shaped (covered by Vitest), or third-party-widget-driven (veilchen, Chart.js — not LibreFit's code to test at the e2e layer).
- Native dialogs (export/import) cannot be driven via WebDriver anyway, eliminating a class of "real Tauri only" scenarios.

For an offline single-window calorie tracker, the e2e value over `Vitest + Rust` is small enough that the tooling cost dominates the equation.

## Decisions

- **No e2e tooling lands.** No tauri-driver, no WebdriverIO, no Playwright, no Podman container, no `tauri-plugin-webdriver`.
- **Scenario IDs stay.** The `[<PREFIX>-<NNN>]` convention from the reconciliation change is layer-agnostic and remains in force.
- **Traceability is layer-agnostic.** The convention enforces "every scenario cited by at least one test"; the test can be at any layer (Rust integration, Vitest component, manual smoke documented as such).
- **The convention is hand-written.** A new `_conv-test-traceability` spec at `openspec/specs/_conv-test-traceability/spec.md` carries the rule. Consistent with other `_conv-*` specs.

## Risks accepted

- **No automated regression catcher above the unit/integration layer.** A real "wired up incorrectly" bug in the assembled app may reach manual testing or users. Mitigated by: typegen + Zod catching IPC drift at compile time; the small surface of cross-cutting code (the app has one window, no IPC contracts between processes other than command invocation); manual smoke before each release.

## Conditions to revisit

Listed in `proposal.md` under "Conditions for reopening."
