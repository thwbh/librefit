## Purpose

**ID prefix:** `TRC`

Define the traceability convention between spec scenarios and tests. Every behavioral claim a spec makes SHALL be verifiable by at least one test, at whichever layer most cheaply exercises the claim.

This convention replaces what `conv-e2e-tests` would have provided. The original change set out to introduce an end-to-end testing layer; on reflection the cheaper layers (Rust integration tests, Vitest component tests) cover almost all scenarios for this app. The rule that survives is layer-agnostic: every scenario MUST be cited by some test.

See the archived change `2026-05-26-conv-e2e-tests` for the full reasoning.

## Requirements

### Requirement: Scenario IDs are stable

Every `#### Scenario:` heading in any spec under `openspec/specs/` SHALL begin with `[<PREFIX>-<NNN>]`, where `<PREFIX>` is the spec's declared ID prefix (in its `## Purpose` section) and `<NNN>` is a zero-padded three-digit number, monotonically increasing per spec. Numbers are never reused; removed scenarios leave gaps.

#### Scenario: [TRC-001] Spec scenario carries an ID

- **WHEN** a new scenario is added to a spec
- **THEN** its heading begins with `[<PREFIX>-<NNN>]` using the next free number for that spec

#### Scenario: [TRC-002] IDs are never reused

- **WHEN** a scenario is removed from a spec
- **THEN** its number is not reassigned to a new scenario

### Requirement: Tests cite the scenarios they cover in the test name

Tests that exercise a documented scenario SHALL include the scenario ID in the test name itself, so that test runner output is self-locating against the spec. Test failures, CI logs, and IDE test browsers all surface the test name; embedding the ID there makes "what scenario broke" answerable without grepping.

Per-layer form:

- **Vitest / Mocha / any framework with freeform test names:** include the bracketed form literally — e.g. `it('[IT-005] [IT-015] add intake creates entry and updates score', ...)`. Multiple IDs separated by spaces when one test covers several scenarios.
- **Rust (`#[test]` / nextest):** function names cannot contain `[]`. Use the prefix and number as a snake-case head of the function name — e.g. `fn it_021_amount_below_lower_bound_rejected()` — and include a doc comment with the literal bracketed form for grep-ability: `/// [IT-021] amount below lower bound rejected`.

Additional citations MAY appear in a comment within five lines of the declaration when a single test covers more scenarios than fit comfortably in the name.

Tests that exist for internal correctness reasons (helpers, harness verification) without covering a documented scenario MAY omit the citation; they will not be counted toward spec coverage and will not trigger the gate.

#### Scenario: [TRC-003] Vitest test name contains the literal bracketed ID

- **WHEN** a Vitest test verifies a documented spec scenario
- **THEN** the string passed to `it(...)` or `test(...)` contains the corresponding `[<PREFIX>-<NNN>]` substring

#### Scenario: [TRC-008] Rust test function name contains the snake-case ID

- **WHEN** a Rust `#[test]` function verifies a documented spec scenario
- **THEN** the function name begins with `<prefix_lower>_<nnn>_` (e.g. `it_021_`) and a doc comment within five lines contains the literal `[<PREFIX>-<NNN>]` form

#### Scenario: [TRC-009] Multi-scenario test cites each ID

- **WHEN** a single test covers more than one scenario
- **THEN** the test name contains every covered ID, separated by spaces (Vitest), or the first ID is in the function name and the rest are listed in the doc comment (Rust)

### Requirement: Cheapest correct layer

Tests SHALL be authored at the cheapest layer that correctly exercises the scenario:

- **Backend math, validation, CRUD, and data-layer behavior** → Rust integration tests under `src-tauri/tests/`.
- **UI behavior given a backend response** → Vitest + `@testing-library/svelte` with the Tauri command boundary mocked.
- **Cross-component state and routing** → Vitest rendering a parent component.
- **Real assembled-app integration** → none currently. End-to-end coverage is not in scope for this codebase; see the archived `conv-e2e-tests` change for reasoning and revisit conditions.

#### Scenario: [TRC-004] Backend behavior cited from a Rust test

- **WHEN** a scenario describes backend behavior (range validation, transactional save, query result shape, etc.)
- **THEN** at least one Rust test under `src-tauri/tests/` cites its ID

#### Scenario: [TRC-005] UI behavior cited from a Vitest test

- **WHEN** a scenario describes UI behavior given a backend response
- **THEN** at least one Vitest test in `src/**/*.test.ts` cites its ID

### Requirement: Traceability gate

The CI pipeline SHALL fail when any spec scenario lacks a test citation. The gate is implemented by `scripts/check-spec-traceability.sh` and runs on every pull request targeting the main branch. The check enforces the spec→test direction; tests without scenario references are permitted.

#### Scenario: [TRC-006] Orphan scenario blocks merge

- **WHEN** a spec scenario has no test reference anywhere in the codebase
- **THEN** the CI traceability check fails and the pull request cannot be merged

#### Scenario: [TRC-007] Tests without citations are permitted

- **WHEN** a test exists for internal correctness reasons (helper, utility, harness verification) without covering a documented scenario
- **THEN** the test is allowed to omit a scenario citation and the traceability gate does not fail
