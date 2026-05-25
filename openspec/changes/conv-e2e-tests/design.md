## Context

LibreFit has substantial Rust integration tests (50+) and frontend unit/component tests (300+), but no end-to-end coverage of the full Tauri app. The reconciliation change just normalized all behavior into ~120 scenario-with-ID statements across 17 specs. This change closes the loop: a test layer that exercises the assembled app and is verifiably linked back to those scenarios.

## Goals / Non-Goals

**Goals:**

- One canonical e2e tool stack for desktop Tauri runs.
- A test↔scenario traceability gate enforced in CI.
- Initial e2e coverage that satisfies the DoD for every feature spec.
- A convention (`_conv-e2e-tests`) future feature changes inherit automatically.

**Non-Goals:**

- Android e2e. Tauri's Android e2e story is immature; deferred to a separate change.
- Visual regression testing. Out of scope for v1; can be added later.
- Performance/load testing. Different tool category.
- 100% scenario coverage on day one. Aim for DoD threshold across the corpus, not exhaustive multiplication of edge cases.

## Decisions

### Tool stack: Playwright via `tauri-driver`

**Chosen:** `@playwright/test` driving the Tauri webview through `tauri-driver` (the official Tauri WebDriver shim).

**Alternatives considered:**

- **WebdriverIO + `wdio-tauri-service`** — mature in the Tauri community but adds a configuration layer that Playwright avoids. Playwright's built-in tracing, screenshots, parallelism, and TypeScript ergonomics are better DX for the same end coverage.
- **Playwright + Maestro for Android** — would cover Android but doubles the test infra. Deferred.
- **Pure browser e2e against `vite dev`** — would test the UI in isolation from Tauri commands. Misses the integration point this layer exists to cover.

Rationale: Playwright is the modern default for web e2e and the Tauri community has converged on `tauri-driver` as the bridge. Best DX for fastest convergence.

### Test layout

```
e2e/
  fixtures/
    app.ts              ← launches Tauri binary, returns a Playwright context
    db.ts               ← resets SQLite state between tests
  pages/                ← page-object wrappers, one per route
    dashboard.ts
    wizard.ts
    history.ts
    ...
  specs/
    onboarding.spec.ts  ← tests organized by feature spec; filename matches spec name
    intake-tracking.spec.ts
    weight-tracking.spec.ts
    ...
playwright.config.ts
```

Tests are organized by feature spec (`e2e/specs/<spec-name>.spec.ts`), not by route. A test for `[OB-005] Valid body information advances wizard` lives in `onboarding.spec.ts` even though it interacts with `/setup`.

### Test isolation

Each test starts with a fresh SQLite database. The fixture wipes data via a Tauri-side test-only command (`reset_database_for_tests`, gated behind a `test` cfg or feature flag) or by deleting the SQLite file before launching the Tauri binary. Decision: **delete-the-file approach** — avoids shipping test-only commands in production builds.

### Traceability gate

Script at `scripts/check-spec-traceability.sh` (bash) or `.ts` (deno/node). It:

1. Extracts all `[XX-NNN]` IDs from `openspec/specs/**/spec.md`.
2. Greps all test files (`src-tauri/tests/`, `src-tauri/src/` for `#[test]`, `src/**/*.test.ts`, `e2e/**/*.spec.ts`) for `[XX-NNN]` references.
3. Computes two sets:
   - **Orphan scenarios:** in specs but not referenced by any test.
   - **Orphan tests:** test file lines containing the test-declaration pattern with no `[XX-NNN]` in name or surrounding 5 lines.
4. Exits non-zero if either set is non-empty. Prints both lists to stderr and GitHub Actions summary.

Strictness for v1: enforce spec→test (no orphan scenarios). Lenient on test→spec — tests without scenario references are permitted (used for helper/utility tests, internal correctness checks). They do not block CI and do not count toward coverage.

### CI shape

A new job `e2e` in `.github/workflows/ci.yml`:

```yaml
e2e:
  runs-on: ubuntu-latest
  needs: [rust-tests, frontend-tests]
  steps:
    - checkout
    - install Rust + Tauri build deps (libwebkit2gtk etc.)
    - cargo install tauri-driver
    - npm ci
    - npx playwright install --with-deps chromium
    - cargo tauri build --debug # produces the binary playwright will drive
    - npx playwright test
    - bash scripts/check-spec-traceability.sh
    - upload playwright trace + screenshots on failure
```

The traceability check runs after tests so failure output includes both: missing IDs and test failures.

### DoD checklist mechanism

`_conv-e2e-tests` includes a requirement "Pre-archive coverage check" with a scenario stating: when a feature change is archived, every spec scenario added or modified by the change MUST be referenced by a test. The CI traceability gate enforces this automatically — there is no manual checklist to forget. The convention spec documents the rule; CI provides the teeth.

### Initial coverage threshold

Initial e2e suite covers at least one scenario per feature spec, prioritizing primary user flows:

- `onboarding`: wizard happy path end-to-end
- `intake-tracking`: add + edit + delete intake on dashboard
- `weight-tracking`: log weight; verify trend update
- `history`: navigate week, edit historical intake
- `progress`: insufficient-data state + sufficient-data charts
- `profile`: view + edit name
- `data-export`: CSV export completes
- `data-import`: import a small CSV
- `plan-review`: expand + collapse on dashboard
- `app-shell`: bottom dock navigation; error page

Unit/integration tests (Rust + Vitest) continue to cover backend validation scenarios (out-of-range submissions, etc.) — those don't need e2e duplication. The traceability check accepts either layer.

## Risks / Trade-offs

- **[Risk] `tauri-driver` flakiness on CI** → Mitigation: pin versions; retry config in Playwright (`retries: 2` on CI); collect traces on failure.
- **[Risk] Slow e2e suite blocking CI** → Mitigation: parallelize via Playwright workers; budget ~5 min for the suite; if it grows, consider sharding.
- **[Risk] Traceability gate false positives during in-flight work** → Mitigation: the gate runs on PR + main; orphan scenarios in a feature branch are expected mid-development. Gate is enforced at PR merge, not on every commit.
- **[Risk] Android coverage gap** → Accepted. Documented as a non-goal here; tracked as a follow-up change.

## Migration Plan

1. Install dev dependencies + `tauri-driver`.
2. Land Playwright config + fixtures + first feature's e2e suite (`onboarding.spec.ts`) and the traceability script. Verify the gate works.
3. Backfill e2e suites for remaining feature specs.
4. Wire CI.
5. Write `_conv-e2e-tests` spec content as part of the apply phase (via the delta).
6. Archive.

## Open Questions

- **DB reset approach.** Confirmed: delete-the-file (avoids shipping test-only commands). Will validate during apply.
- **Snapshot/trace artifact retention.** Default Playwright behavior (trace on first retry) is fine for v1. Tune later if needed.
