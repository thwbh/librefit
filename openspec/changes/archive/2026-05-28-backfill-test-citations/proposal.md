## Why

The traceability gate is currently at 0/163 — every spec scenario is an orphan because no existing test cites its ID. This change does the mechanical backfill: each scenario gets matched to one or more existing tests (which are then renamed to include the ID per the tightened `[TRC-003]` rule), or a new test is written at the cheapest correct layer when no existing test covers it.

## What Changes

- Rename existing Rust `#[test]` functions to include the snake-case ID prefix (e.g. `fn test_create_intake_validation_amount_too_low()` → `fn it_021_amount_below_lower_bound_rejected()`), with a `/// [IT-021]` doc comment.
- Rename existing Vitest `it(...)` / `test(...)` calls to embed the literal bracketed ID in the test name (e.g. `it('should show 0 when entries is empty', ...)` → `it('[IT-001] no intake tracked yields zero progress and empty shield', ...)`).
- Where no existing test covers a scenario, write one at the cheapest correct layer. Most missing tests are UI flows that map onto Vitest + `@testing-library/svelte` against the relevant component.
- Update the CI traceability gate to green once all 163 scenarios are cited.

Non-breaking. No production-code changes. Test names and a handful of new Vitest test files only.

## Capabilities

None. This change makes no spec deltas — it adjusts test names to satisfy the convention. It will archive with `--skip-specs`.

## Impact

- **Tests:** every `#[test]` and `it(...)` declaration that covers a documented scenario gets renamed. Roughly ~150 Rust test functions, ~120 Vitest tests.
- **New tests:** estimated 30–50 new Vitest tests for UI scenarios that have no existing coverage (most of `app-shell`, `history`, `plan-review` UI behavior, parts of `onboarding`).
- **CI:** the traceability gate flips from red to green when this change lands.
- **Required status check:** can be re-enabled on `main` once green (`gh api -X POST repos/thwbh/librefit/branches/main/protection/required_status_checks/contexts -f 'contexts[]=Spec ↔ test traceability gate'`).
