## ADDED Requirements

### Requirement: E2E coverage as Definition of Done

Every feature spec scenario SHALL be referenced by at least one test (unit, integration, or end-to-end). Behavior-of-the-assembled-app scenarios (user flows, UI states, navigation) SHALL be covered by an end-to-end test. Pure backend validation scenarios MAY be covered by unit or integration tests alone.

#### Scenario: [E2E-001] Spec scenario covered by e2e

- **WHEN** a scenario describes user-visible behavior of the assembled app
- **THEN** it is referenced by at least one Playwright test in `e2e/specs/`

#### Scenario: [E2E-002] Backend-only scenario covered by integration test

- **WHEN** a scenario describes backend validation or pure data-layer behavior
- **THEN** it is referenced by at least one Rust integration test or Vitest unit test

### Requirement: Scenario ID citation in tests

Tests that cover a documented spec scenario SHALL cite the scenario ID using the form `[<PREFIX>-<NNN>]` in the test name or in a comment within five lines of the declaration. Tests that exist for internal correctness reasons without covering a documented scenario are permitted to omit a citation; they will not be counted toward spec coverage and will not trigger the traceability gate.

#### Scenario: [E2E-003] Test name contains scenario ID

- **WHEN** a test covers a documented spec scenario
- **THEN** its name or a nearby comment contains the corresponding `[<PREFIX>-<NNN>]` reference

### Requirement: Traceability gate in CI

The CI pipeline SHALL fail when any spec scenario lacks a test reference. The traceability check SHALL run on every pull request targeting the main branch. The check enforces the spec→test direction only; tests without scenario references are permitted.

#### Scenario: [E2E-004] Orphan scenario blocks merge

- **WHEN** a spec scenario has no test reference
- **THEN** the CI traceability check fails and the pull request cannot be merged

### Requirement: E2E stack

End-to-end tests SHALL be implemented with Playwright driving the Tauri webview through `tauri-driver`. Tests SHALL live under `e2e/specs/<spec-name>.spec.ts`, organized by the feature spec they exercise. Fixtures and page objects SHALL live under `e2e/fixtures/` and `e2e/pages/` respectively.

#### Scenario: [E2E-005] Test file naming matches spec

- **WHEN** an e2e test file is added for a feature spec
- **THEN** it is placed at `e2e/specs/<spec-name>.spec.ts`

### Requirement: Test isolation

Each e2e test SHALL run against a fresh SQLite database state. Tests SHALL NOT depend on the outcome of preceding tests.

#### Scenario: [E2E-006] Database reset between tests

- **WHEN** an e2e test begins execution
- **THEN** the Tauri app starts with a clean database

### Requirement: Android coverage limitation

This convention applies to desktop Tauri builds only. Android end-to-end coverage is out of scope and SHALL be addressed by a separate change.

#### Scenario: [E2E-007] Android e2e gap documented

- **WHEN** assessing test coverage for an Android-only feature
- **THEN** this convention does not require an e2e test; manual testing or a future mobile-e2e convention applies
